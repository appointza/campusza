using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using Npgsql;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamRoomService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamAuditService examAuditService;
        private readonly ClassService classService;
        private readonly RequestState requeststate;

        public ExamRoomService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            OrganizationIdResolver organizationIdResolver,
            ExamAuditService examAuditService,
            ClassService classService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.examAuditService = examAuditService;
            this.classService = classService;
            this.requeststate = requeststate;
        }

        public async Task<List<ExamRoom>> Select(ExamRoomSelectReq req)
        {
            try
            {
                using IDb db = await dbprovider.GetDb();
                await db.Connect();
                return await SelectTransaction(db, req);
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
            {
                throw MissingSchoolRoomsTableException(ex);
            }
        }

        public async Task<List<ExamRoom>> SelectTransaction(IDb db, ExamRoomSelectReq req)
        {
            var result = new List<ExamRoom>();
            const string query = @"
                SELECT id, organization_id, name, building, floor, capacity, rows_count, columns_count,
                       linked_class_id, is_active, created_at, updated_at, created_by, updated_by
                FROM school_rooms";

            var qb = querybuilderprovider.GetQueryBuilder(query);
            if (req.includeinactive != true)
                qb.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            if (!string.IsNullOrWhiteSpace(req.id))
                qb.AddParameter("id", "=", "id", req.id!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                qb.AddParameter("organization_id", "=", "organization_id", req.organizationid!, DbTypes.Types.String);
            qb.AddOrderBy(QueryBuilder.Order.ASC, "name");

            using var reader = await db.Execute(qb.GetCommand(db));
            while (await reader.ReadAsync())
                result.Add(MapRoom(reader));
            return result;
        }

        public async Task<ExamRoom> Save(ExamRoom room, string? organizationId, string? email)
        {
            var orgId = await organizationIdResolver.RequireAsync(organizationId ?? room.organizationid, email ?? "");
            if (string.IsNullOrWhiteSpace(room.name))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Room name is required.");
            SchoolRoomTenant.ValidateGridDimensions(room.capacity, room.rowscount, room.columnscount);

            try
            {
                using IDb db = await dbprovider.GetDb();
                await db.Connect();
                await db.BeginTransaction();
                try
                {
                    room.organizationid = orgId;
                    await EnsureUniqueActiveNameTransaction(db, orgId, room.id, room.name, room.isactive);
                if (!string.IsNullOrWhiteSpace(room.linkedclassid))
                {
                    var classes = await classService.SelectTransaction(db, new ClassSelectReq { id = room.linkedclassid, organizationid = orgId });
                    var cls = classes.FirstOrDefault()
                        ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Linked class not found.");
                    ExamTenantGuard.EnsureSameOrganization(orgId, cls.organizationid, "Class");
                }

                if (!room.isactive && !string.IsNullOrWhiteSpace(room.id))
                {
                    await EnsureCanDeactivateTransaction(db, orgId, room.id, room.capacity);
                }
                else if (!string.IsNullOrWhiteSpace(room.id))
                {
                    await EnsureCapacityNotBelowSeatsTransaction(db, orgId, room.id, room.capacity);
                }

                var now = DateTime.UtcNow;
                var actor = ResolveActor();
                if (string.IsNullOrWhiteSpace(room.id))
                {
                    room.id = Guid.NewGuid().ToString();
                    room.isactive = true;
                    room.createdat = now;
                    room.updatedat = now;
                    room.createdby = actor;
                    room.updatedby = actor;
                    await InsertTransaction(db, room);
                }
                else
                {
                    room.updatedat = now;
                    room.updatedby = actor;
                    await UpdateTransaction(db, room);
                }

                    await examAuditService.AppendAsync(db, orgId, "exam_room", room.id, "Save", after: new { room.name, room.capacity });
                    await db.CommitTransaction();
                    return room;
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable)
            {
                throw MissingSchoolRoomsTableException(ex);
            }
        }

        private static AppException MissingSchoolRoomsTableException(PostgresException ex)
        {
            if (!ex.MessageText.Contains("school_rooms", StringComparison.OrdinalIgnoreCase))
                throw ex;
            return new AppException(
                AppException.ErrorCodes.BadRequest,
                "Room master is not set up on this database. Run migration: Database/migrations/add_school_rooms_unified.sql");
        }

        private async Task EnsureUniqueActiveNameTransaction(IDb db, string orgId, string roomId, string name, bool isActive)
        {
            if (!isActive)
                return;
            const string query = @"
                SELECT id FROM school_rooms
                WHERE organization_id = @organization_id AND LOWER(name) = LOWER(@name)
                  AND is_active = true AND id <> @id
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = name.Trim();
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = roomId ?? "";
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "An active room with this name already exists.");
            }
        }

        private async Task EnsureCanDeactivateTransaction(IDb db, string orgId, string roomId, int capacity)
        {
            const string query = @"
                SELECT COUNT(*) FROM exam_seat_allocations sa
                INNER JOIN exam_sessions es ON es.id = sa.exam_session_id AND es.organization_id = sa.organization_id
                WHERE sa.organization_id = @organization_id AND sa.exam_room_id = @room_id
                  AND es.status IN (@published, @inprogress)";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "room_id", DbTypes.Types.String).Value = roomId;
            db.AddParameter(cmd, "published", DbTypes.Types.String).Value = ExamSessionStatuses.Published;
            db.AddParameter(cmd, "inprogress", DbTypes.Types.String).Value = ExamSessionStatuses.InProgress;
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync() && Convert.ToInt64(reader[0]) > 0)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Cannot deactivate a room that has seating on published or in-progress exams.");
            }
        }

        private async Task EnsureCapacityNotBelowSeatsTransaction(IDb db, string orgId, string roomId, int newCapacity)
        {
            const string query = @"
                SELECT COUNT(*) FROM exam_seat_allocations
                WHERE organization_id = @organization_id AND exam_room_id = @room_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "room_id", DbTypes.Types.String).Value = roomId;
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                var seated = Convert.ToInt32(reader[0]);
                if (newCapacity < seated)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "Room capacity cannot be less than existing seat assignments.");
                }
            }
        }

        private async Task InsertTransaction(IDb db, ExamRoom r)
        {
            const string query = @"
                INSERT INTO school_rooms (
                    id, organization_id, name, building, floor, capacity, rows_count, columns_count,
                    linked_class_id, is_active, created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @name, @building, @floor, @capacity, @rows_count, @columns_count,
                    @linked_class_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                )";
            var cmd = db.GetCommand(query);
            BindRoom(db, cmd, r);
            await db.ExecuteNonQuery(cmd);
        }

        private async Task UpdateTransaction(IDb db, ExamRoom r)
        {
            const string query = @"
                UPDATE school_rooms SET
                    name = @name, building = @building, floor = @floor, capacity = @capacity,
                    rows_count = @rows_count, columns_count = @columns_count, linked_class_id = @linked_class_id,
                    is_active = @is_active, updated_at = @updated_at, updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id";
            var cmd = db.GetCommand(query);
            BindRoom(db, cmd, r);
            await db.ExecuteNonQuery(cmd);
        }

        private static void BindRoom(IDb db, DbCommand cmd, ExamRoom r)
        {
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = r.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = r.organizationid;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = r.name ?? "";
            db.AddParameter(cmd, "building", DbTypes.Types.String).Value = r.building ?? "";
            db.AddParameter(cmd, "floor", DbTypes.Types.String).Value = r.floor ?? "";
            db.AddParameter(cmd, "capacity", DbTypes.Types.Integer).Value = r.capacity;
            db.AddParameter(cmd, "rows_count", DbTypes.Types.Integer).Value =
                r.rowscount.HasValue ? r.rowscount.Value : DBNull.Value;
            db.AddParameter(cmd, "columns_count", DbTypes.Types.Integer).Value =
                r.columnscount.HasValue ? r.columnscount.Value : DBNull.Value;
            db.AddParameter(cmd, "linked_class_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(r.linkedclassid) ? DBNull.Value : r.linkedclassid;
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = r.isactive;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = r.createdat;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = r.updatedat;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = r.createdby ?? "";
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = r.updatedby ?? "";
        }

        private static ExamRoom MapRoom(DbDataReader reader) => new()
        {
            id = reader["id"]?.ToString() ?? "",
            organizationid = reader["organization_id"]?.ToString() ?? "",
            name = reader["name"]?.ToString() ?? "",
            building = reader["building"]?.ToString() ?? "",
            floor = reader["floor"]?.ToString() ?? "",
            capacity = reader["capacity"] == DBNull.Value ? 0 : Convert.ToInt32(reader["capacity"]),
            rowscount = reader["rows_count"] == DBNull.Value ? null : Convert.ToInt32(reader["rows_count"]),
            columnscount = reader["columns_count"] == DBNull.Value ? null : Convert.ToInt32(reader["columns_count"]),
            linkedclassid = reader["linked_class_id"]?.ToString() ?? "",
            isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
            createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
            updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
            createdby = reader["created_by"]?.ToString() ?? "",
            updatedby = reader["updated_by"]?.ToString() ?? "",
        };

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }
    }
}
