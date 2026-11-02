using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class GradePeriodService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;

        public GradePeriodService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<GradePeriod>> Select(GradePeriodSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<GradePeriod>> SelectTransaction(IDb db, GradePeriodSelectReq req)
        {
            var result = new List<GradePeriod>();
            string query = @"
                SELECT id, organization_id, grade_id, grade_name, period_code, period_name,
                       start_time, end_time, display_order, is_active,
                       created_at, updated_at, created_by, updated_by
                FROM grade_periods
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);

            var orgId = req.organizationid;
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (!string.IsNullOrWhiteSpace(orgId))
                queryBuilder.AddParameter("organization_id", "=", "organization_id", orgId, DbTypes.Types.String);

            if (!string.IsNullOrWhiteSpace(req.gradeid))
                queryBuilder.AddParameter("grade_id", "=", "grade_id", req.gradeid, DbTypes.Types.String);

            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "display_order");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    result.Add(MapRow(reader));
                }
            }
            return result;
        }

        public async Task<GradePeriod> Insert(GradePeriod item)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, item);
            }
            return item;
        }

        public async Task InsertTransaction(IDb db, GradePeriod item)
        {
            Validate(item);

            if (string.IsNullOrWhiteSpace(item.organizationid) && requeststate.usercontext?.organisationid > 0)
                item.organizationid = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(item.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            item.id = string.IsNullOrWhiteSpace(item.id) ? Guid.NewGuid().ToString() : item.id;
            item.isactive = true;
            item.createdat = DateTime.UtcNow;
            item.updatedat = item.createdat;
            item.createdby = ResolveActor();
            item.updatedby = item.createdby;
            if (item.displayorder < 0) item.displayorder = 0;
            if (string.IsNullOrWhiteSpace(item.periodcode))
                item.periodcode = $"P{item.displayorder}";

            string query = @"
                INSERT INTO grade_periods (
                    id, organization_id, grade_id, grade_name, period_code, period_name,
                    start_time, end_time, display_order, is_active,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @grade_id, @grade_name, @period_code, @period_name,
                    @start_time, @end_time, @display_order, @is_active,
                    @created_at, @updated_at, @created_by, @updated_by
                )
                ON CONFLICT (organization_id, grade_id, period_code)
                DO UPDATE SET
                    grade_name = EXCLUDED.grade_name,
                    period_name = EXCLUDED.period_name,
                    start_time = EXCLUDED.start_time,
                    end_time = EXCLUDED.end_time,
                    display_order = EXCLUDED.display_order,
                    is_active = true,
                    updated_at = EXCLUDED.updated_at,
                    updated_by = EXCLUDED.updated_by
            ";

            DbCommand command = db.GetCommand(query);
            BindWrite(db, command, item);
            await db.ExecuteNonQuery(command);
        }

        public async Task<GradePeriod> Update(GradePeriod item)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, item);
            }
            return item;
        }

        public async Task UpdateTransaction(IDb db, GradePeriod item)
        {
            if (string.IsNullOrWhiteSpace(item.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Id is required.");
            Validate(item);

            item.updatedat = DateTime.UtcNow;
            item.updatedby = ResolveActor();

            string query = @"
                UPDATE grade_periods SET
                    grade_id = @grade_id,
                    grade_name = @grade_name,
                    period_code = @period_code,
                    period_name = @period_name,
                    start_time = @start_time,
                    end_time = @end_time,
                    display_order = @display_order,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id
            ";

            if (string.IsNullOrWhiteSpace(item.organizationid) && requeststate.usercontext?.organisationid > 0)
                item.organizationid = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = item.id;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = item.organizationid ?? "";
            db.AddParameter(command, "grade_id", DbTypes.Types.String).Value = item.gradeid ?? "";
            db.AddParameter(command, "grade_name", DbTypes.Types.String).Value = item.gradename ?? "";
            db.AddParameter(command, "period_code", DbTypes.Types.String).Value = item.periodcode ?? "";
            db.AddParameter(command, "period_name", DbTypes.Types.String).Value = item.periodname ?? "";
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = item.starttime;
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = item.endtime;
            db.AddParameter(command, "display_order", DbTypes.Types.Integer).Value = item.displayorder;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = item.updatedat;
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = item.updatedby ?? "";

            await db.ExecuteNonQuery(command);
        }

        public async Task<GradePeriod> Save(GradePeriod item)
        {
            if (!string.IsNullOrWhiteSpace(item.id))
                return await Update(item);
            return await Insert(item);
        }

        public async Task<bool> Delete(GradePeriodDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                if (string.IsNullOrWhiteSpace(req.id))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Id is required.");

                string orgId = req.organizationid;
                if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                    orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);

                string query = @"
                    UPDATE grade_periods
                    SET is_active = false, updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id
                ";
                if (!string.IsNullOrWhiteSpace(orgId))
                    query += " AND organization_id = @organization_id";

                DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor();
                if (!string.IsNullOrWhiteSpace(orgId))
                    db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = orgId;

                return await db.ExecuteNonQuery(command) > 0;
            }
        }

        public async Task<List<GradePeriod>> ReplaceSchedule(GradePeriodReplaceReq req)
        {
            if (string.IsNullOrWhiteSpace(req.gradeid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Grade is required.");
            if (req.periods == null || req.periods.Count == 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "At least one period is required.");

            var orgId = req.organizationid;
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                string deleteQuery = @"
                    DELETE FROM grade_periods
                    WHERE organization_id = @organization_id AND grade_id = @grade_id
                ";
                DbCommand deleteCommand = db.GetCommand(deleteQuery);
                db.AddParameter(deleteCommand, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(deleteCommand, "grade_id", DbTypes.Types.String).Value = req.gradeid;
                await db.ExecuteNonQuery(deleteCommand);

                var created = new List<GradePeriod>();
                foreach (var slot in req.periods.OrderBy(p => p.displayorder))
                {
                    var row = new GradePeriod
                    {
                        organizationid = orgId,
                        gradeid = req.gradeid,
                        gradename = string.IsNullOrWhiteSpace(req.gradename) ? req.gradeid : req.gradename,
                        periodcode = slot.periodcode,
                        periodname = slot.periodname,
                        starttime = slot.starttime,
                        endtime = slot.endtime,
                        displayorder = slot.displayorder,
                    };
                    await InsertTransaction(db, row);
                    created.Add(row);
                }
                return created;
            }
        }

        public async Task<List<GradePeriod>> CopyToGrade(GradePeriodCopyReq req)
        {
            if (string.IsNullOrWhiteSpace(req.fromgradeid) || string.IsNullOrWhiteSpace(req.togradeid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "From and to grade are required.");
            if (req.fromgradeid == req.togradeid)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Choose a different target grade.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                var source = await SelectTransaction(db, new GradePeriodSelectReq
                {
                    organizationid = req.organizationid,
                    gradeid = req.fromgradeid
                });
                if (source.Count == 0)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Source grade has no periods to copy.");

                var created = new List<GradePeriod>();
                foreach (var s in source)
                {
                    var row = new GradePeriod
                    {
                        organizationid = s.organizationid,
                        gradeid = req.togradeid,
                        gradename = string.IsNullOrWhiteSpace(req.togradename) ? req.togradeid : req.togradename,
                        periodcode = s.periodcode,
                        periodname = s.periodname,
                        starttime = s.starttime,
                        endtime = s.endtime,
                        displayorder = s.displayorder,
                    };
                    await InsertTransaction(db, row);
                    created.Add(row);
                }
                return created;
            }
        }

        private static void Validate(GradePeriod item)
        {
            if (string.IsNullOrWhiteSpace(item.gradeid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Grade is required.");
            if (string.IsNullOrWhiteSpace(item.periodname))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Period name is required.");
            if (item.endtime <= item.starttime)
                throw new AppException(AppException.ErrorCodes.BadRequest, "End time must be after start time.");
        }

        private void BindWrite(IDb db, DbCommand command, GradePeriod item)
        {
            db.AddParameter(command, "id", DbTypes.Types.String).Value = item.id;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = item.organizationid ?? "";
            db.AddParameter(command, "grade_id", DbTypes.Types.String).Value = item.gradeid ?? "";
            db.AddParameter(command, "grade_name", DbTypes.Types.String).Value = item.gradename ?? "";
            db.AddParameter(command, "period_code", DbTypes.Types.String).Value = item.periodcode ?? "";
            db.AddParameter(command, "period_name", DbTypes.Types.String).Value = item.periodname ?? "";
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = item.starttime;
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = item.endtime;
            db.AddParameter(command, "display_order", DbTypes.Types.Integer).Value = item.displayorder;
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = item.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = item.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = item.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = item.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = item.updatedby ?? "";
        }

        private static GradePeriod MapRow(DbDataReader reader)
        {
            return new GradePeriod
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString() ?? "",
                gradeid = reader["grade_id"] == DBNull.Value ? "" : reader["grade_id"].ToString() ?? "",
                gradename = reader["grade_name"] == DBNull.Value ? "" : reader["grade_name"].ToString() ?? "",
                periodcode = reader["period_code"] == DBNull.Value ? "" : reader["period_code"].ToString() ?? "",
                periodname = reader["period_name"] == DBNull.Value ? "" : reader["period_name"].ToString() ?? "",
                starttime = reader["start_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["start_time"],
                endtime = reader["end_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["end_time"],
                displayorder = reader["display_order"] == DBNull.Value ? 0 : Convert.ToInt32(reader["display_order"]),
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString() ?? "",
                updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString() ?? "",
            };
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }
    }
}
