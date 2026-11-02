using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamInvigilatorService
    {
        private readonly IDbProvider dbprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamSessionService examSessionService;
        private readonly ExamSessionRoomService examSessionRoomService;
        private readonly StaffService staffService;
        private readonly ExamAuditService examAuditService;

        public ExamInvigilatorService(
            IDbProvider dbprovider,
            OrganizationIdResolver organizationIdResolver,
            ExamSessionService examSessionService,
            ExamSessionRoomService examSessionRoomService,
            StaffService staffService,
            ExamAuditService examAuditService)
        {
            this.dbprovider = dbprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.examSessionService = examSessionService;
            this.examSessionRoomService = examSessionRoomService;
            this.staffService = staffService;
            this.examAuditService = examAuditService;
        }

        public async Task<List<ExamInvigilator>> Select(ExamInvigilatorSelectReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, orgId, req.examsessionid ?? "");
        }

        public async Task<List<ExamInvigilator>> SelectTransaction(IDb db, string orgId, string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                return new List<ExamInvigilator>();

            const string query = @"
                SELECT iv.id, iv.organization_id, iv.exam_session_id, iv.exam_room_id, iv.staff_id, iv.role, iv.created_at,
                       er.name AS room_name,
                       TRIM(COALESCE(st.first_name,'') || ' ' || COALESCE(st.last_name,'')) AS staff_name
                FROM exam_invigilators iv
                INNER JOIN school_rooms er ON er.id = iv.exam_room_id AND er.organization_id = iv.organization_id
                INNER JOIN staff st ON st.id = iv.staff_id AND st.organization_id = iv.organization_id
                WHERE iv.organization_id = @organization_id AND iv.exam_session_id = @exam_session_id
                ORDER BY er.name, iv.role";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            var list = new List<ExamInvigilator>();
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new ExamInvigilator
                {
                    id = reader["id"]?.ToString() ?? "",
                    organizationid = reader["organization_id"]?.ToString() ?? "",
                    examsessionid = reader["exam_session_id"]?.ToString() ?? "",
                    examroomid = reader["exam_room_id"]?.ToString() ?? "",
                    roomname = reader["room_name"]?.ToString() ?? "",
                    staffid = reader["staff_id"]?.ToString() ?? "",
                    staffname = reader["staff_name"]?.ToString() ?? "",
                    role = reader["role"]?.ToString() ?? "",
                    createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                });
            }
            return list;
        }

        public async Task<ExamInvigilator> Save(ExamInvigilatorSaveReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            var iv = req.invigilator ?? new ExamInvigilator();
            if (string.IsNullOrWhiteSpace(iv.examsessionid) || string.IsNullOrWhiteSpace(iv.examroomid) || string.IsNullOrWhiteSpace(iv.staffid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Session, room, and staff are required.");

            var role = string.IsNullOrWhiteSpace(iv.role) ? "Invigilator" : iv.role;
            if (!string.Equals(role, "Invigilator", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(role, "Chief Invigilator", StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid invigilator role.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
                {
                    organizationid = orgId,
                    id = iv.examsessionid,
                });
                var session = sessions.FirstOrDefault()
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");

                var rooms = await examSessionRoomService.SelectTransaction(db, orgId, iv.examsessionid);
                if (!rooms.Any(r => string.Equals(r.examroomid, iv.examroomid, StringComparison.OrdinalIgnoreCase)))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Room is not allocated to this session.");

                var staffRows = await staffService.SelectTransaction(db, new StaffSelectReq { organizationid = orgId, id = iv.staffid });
                var staff = staffRows.FirstOrDefault()
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Staff not found.");
                ExamTenantGuard.EnsureSameOrganization(orgId, staff.organizationid, "Staff");

                await EnsureStaffNotDoubleBookedTransaction(db, orgId, session, iv.staffid, iv.examsessionid);

                if (string.IsNullOrWhiteSpace(iv.id))
                {
                    iv.id = Guid.NewGuid().ToString();
                    const string insert = @"
                        INSERT INTO exam_invigilators (id, organization_id, exam_session_id, exam_room_id, staff_id, role, created_at)
                        VALUES (@id, @organization_id, @exam_session_id, @exam_room_id, @staff_id, @role, @created_at)";
                    var cmd = db.GetCommand(insert);
                    db.AddParameter(cmd, "id", DbTypes.Types.String).Value = iv.id;
                    db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                    db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = iv.examsessionid;
                    db.AddParameter(cmd, "exam_room_id", DbTypes.Types.String).Value = iv.examroomid;
                    db.AddParameter(cmd, "staff_id", DbTypes.Types.String).Value = iv.staffid;
                    db.AddParameter(cmd, "role", DbTypes.Types.String).Value = role;
                    db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                    await db.ExecuteNonQuery(cmd);
                }

                await examAuditService.AppendAsync(db, orgId, "exam_invigilator", iv.id, "Save",
                    after: new { iv.examsessionid, iv.examroomid, iv.staffid, role });
                await db.CommitTransaction();

                var rows = await SelectTransaction(db, orgId, iv.examsessionid);
                return rows.First(r => string.Equals(r.id, iv.id, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        private async Task EnsureStaffNotDoubleBookedTransaction(
            IDb db, string orgId, ExamSession session, string staffId, string currentSessionId)
        {
            const string query = @"
                SELECT es.id, es.start_time, es.end_time
                FROM exam_invigilators iv
                INNER JOIN exam_sessions es ON es.id = iv.exam_session_id AND es.organization_id = iv.organization_id
                WHERE iv.organization_id = @organization_id
                  AND iv.staff_id = @staff_id
                  AND iv.exam_session_id <> @exam_session_id
                  AND es.exam_date = @exam_date
                  AND es.status <> @cancelled";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "staff_id", DbTypes.Types.String).Value = staffId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = currentSessionId;
            db.AddParameter(cmd, "exam_date", DbTypes.Types.Date).Value = session.examdate.Date;
            db.AddParameter(cmd, "cancelled", DbTypes.Types.String).Value = ExamSessionStatuses.Cancelled;

            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                var otherStart = (TimeSpan)reader["start_time"];
                var otherEnd = (TimeSpan)reader["end_time"];
                if (ExamOverlapRules.TimeRangesOverlap(session.starttime, session.endtime, otherStart, otherEnd))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "This staff member is already assigned as invigilator for another overlapping exam session.");
                }
            }
        }

        public async Task<bool> Delete(ExamInvigilatorDeleteReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invigilator ID is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                const string query = @"
                    DELETE FROM exam_invigilators
                    WHERE organization_id = @organization_id AND id = @id";
                var cmd = db.GetCommand(query);
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(cmd, "id", DbTypes.Types.String).Value = req.id;
                await db.ExecuteNonQuery(cmd);
                await examAuditService.AppendAsync(db, orgId, "exam_invigilator", req.id, "Delete");
                await db.CommitTransaction();
                return true;
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }
    }
}
