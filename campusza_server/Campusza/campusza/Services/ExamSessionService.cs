using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using Npgsql;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamSessionService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamSeriesService examSeriesService;
        private readonly ExamSubjectEligibilityService subjectEligibilityService;
        private readonly ExamValidationService examValidationService;
        private readonly ExamAuditService examAuditService;
        private readonly RequestState requeststate;

        public ExamSessionService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            OrganizationIdResolver organizationIdResolver,
            ExamSeriesService examSeriesService,
            ExamSubjectEligibilityService subjectEligibilityService,
            ExamValidationService examValidationService,
            ExamAuditService examAuditService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.examSeriesService = examSeriesService;
            this.subjectEligibilityService = subjectEligibilityService;
            this.examValidationService = examValidationService;
            this.examAuditService = examAuditService;
            this.requeststate = requeststate;
        }

        public async Task<List<ExamSession>> Select(ExamSessionSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, req);
        }

        public async Task<List<ExamSession>> SelectTransaction(IDb db, ExamSessionSelectReq req)
        {
            try
            {
                return await SelectTransactionCore(db, req, includeMarksStatus: true);
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedColumn
                && ex.MessageText.Contains("marks_status", StringComparison.OrdinalIgnoreCase))
            {
                return await SelectTransactionCore(db, req, includeMarksStatus: false);
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable
                && ex.MessageText.Contains("exam_sessions", StringComparison.OrdinalIgnoreCase))
            {
                return new List<ExamSession>();
            }
        }

        private async Task<List<ExamSession>> SelectTransactionCore(IDb db, ExamSessionSelectReq req, bool includeMarksStatus)
        {
            var result = new List<ExamSession>();
            var marksCol = includeMarksStatus ? "marks_status," : "";
            var baseQuery = $@"
                SELECT id, organization_id, exam_series_id, subject_id, exam_date,
                       start_time, end_time, duration_minutes, max_marks, passing_marks,
                       instructions, status, {marksCol}
                       created_at, updated_at, created_by, updated_by
                FROM exam_sessions";

            var qb = querybuilderprovider.GetQueryBuilder(baseQuery);

            if (!string.IsNullOrWhiteSpace(req.classid))
            {
                qb.AddParameter(
                    @"EXISTS (
                        SELECT 1 FROM exam_session_classes c
                        WHERE c.exam_session_id = exam_sessions.id
                          AND c.organization_id = exam_sessions.organization_id
                          AND c.class_id = @class_id)",
                    "class_id",
                    req.classid!,
                    DbTypes.Types.String);
            }

            if (!string.IsNullOrWhiteSpace(req.id))
                qb.AddParameter("id", "=", "id", req.id!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                qb.AddParameter("organization_id", "=", "organization_id", req.organizationid!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.examseriesid))
                qb.AddParameter("exam_series_id", "=", "exam_series_id", req.examseriesid!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.status))
                qb.AddParameter("status", "=", "status", req.status!, DbTypes.Types.String);

            qb.AddOrderBy(QueryBuilder.Order.ASC, "exam_date");
            qb.AddOrderBy(QueryBuilder.Order.ASC, "start_time");

            using (var reader = await db.Execute(qb.GetCommand(db)))
            {
                while (await reader.ReadAsync())
                    result.Add(MapSession(reader, includeMarksStatus));
            }

            var orgForClasses = !string.IsNullOrWhiteSpace(req.organizationid)
                ? req.organizationid!
                : result.FirstOrDefault()?.organizationid ?? "";
            foreach (var session in result)
                session.classids = new List<string>();
            await ExamSessionClassIds.AttachBatchAsync(db, orgForClasses, result);

            return result;
        }

        public async Task<ExamSession> Save(ExamSessionSaveReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(
                req.organizationid ?? req.session.organizationid,
                req.email ?? "");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var saved = await SaveTransaction(db, orgId, req.session);
                await examAuditService.AppendAsync(db, orgId, "exam_session", saved.id, "Save",
                    after: new { saved.examseriesid, saved.subjectid, classCount = saved.classids.Count });
                await db.CommitTransaction();
                return saved;
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamSession> SaveTransaction(IDb db, string orgId, ExamSession session)
        {
            session.organizationid = orgId;
            ValidateSession(session);

            var series = await examSeriesService.GetByIdTransaction(db, orgId, session.examseriesid)
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");
            ExamTenantGuard.EnsureSameOrganization(orgId, series.organizationid, "Exam series");

            if (!string.Equals(series.status, ExamSeriesStatuses.Draft, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(series.status, ExamSeriesStatuses.Scheduled, StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Sessions can only be added or edited while the series is draft or scheduled.");
            }

            if (session.examdate.Date < series.startdate.Date || session.examdate.Date > series.enddate.Date)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Exam date must fall within the exam series date range.");
            }

            foreach (var classId in session.classids.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                await subjectEligibilityService.EnsureSubjectAllowedForClassAsync(db, orgId, classId, session.subjectid);
            }

            await examValidationService.ValidateSessionForSaveAsync(db, orgId, session);

            var now = DateTime.UtcNow;
            var actor = ResolveActor();

            if (string.IsNullOrWhiteSpace(session.id))
            {
                session.id = Guid.NewGuid().ToString();
                session.status = ExamSessionStatuses.Draft;
                session.marksstatus = ExamMarksWorkflowStatuses.Draft;
                session.createdat = now;
                session.updatedat = now;
                session.createdby = actor;
                session.updatedby = actor;
                await InsertSessionTransaction(db, session);
            }
            else
            {
                var existingRows = await SelectTransaction(db, new ExamSessionSelectReq { organizationid = orgId, id = session.id });
                var existing = existingRows.FirstOrDefault()
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");
                if (!string.Equals(existing.status, ExamSessionStatuses.Draft, StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(existing.status, ExamSessionStatuses.Scheduled, StringComparison.OrdinalIgnoreCase))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "Only draft or scheduled sessions can be edited.");
                }

                session.createdat = existing.createdat;
                session.createdby = existing.createdby;
                session.marksstatus = existing.marksstatus;
                session.status = ResolveSessionStatusForWrite(session.status, existing.status);
                session.updatedat = now;
                session.updatedby = actor;
                await UpdateSessionTransaction(db, session);
                await DeleteSessionClassesTransaction(db, orgId, session.id);
            }

            await ReplaceSessionClassesTransaction(db, orgId, session.id, session.classids);
            session.classids = await ExamSessionClassIds.LoadForSessionAsync(db, orgId, session.id);
            return session;
        }

        public async Task<ExamValidationResult> Validate(ExamSessionValidateReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(
                req.organizationid ?? req.session.organizationid,
                req.email ?? "");
            req.session.organizationid = orgId;

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await examValidationService.ValidateSessionAsync(db, orgId, req.session);
        }

        public async Task<List<ExamSession>> SelectPublishedForClassTransaction(IDb db, string orgId, string classId)
        {
            var result = new List<ExamSession>();
            const string query = @"
                SELECT es.id, es.organization_id, es.exam_series_id, es.subject_id, es.exam_date,
                       es.start_time, es.end_time, es.duration_minutes, es.max_marks, es.passing_marks,
                       es.instructions, es.status, es.marks_status,
                       es.created_at, es.updated_at, es.created_by, es.updated_by,
                       ser.name AS series_name
                FROM exam_sessions es
                INNER JOIN exam_series ser ON ser.id = es.exam_series_id AND ser.organization_id = es.organization_id
                INNER JOIN exam_session_classes esc ON esc.exam_session_id = es.id AND esc.organization_id = es.organization_id
                WHERE es.organization_id = @organization_id
                  AND esc.class_id = @class_id
                  AND ser.is_active = true
                  AND ser.status = @series_published
                  AND es.status = @session_published
                ORDER BY es.exam_date, es.start_time";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = classId;
            db.AddParameter(cmd, "series_published", DbTypes.Types.String).Value = ExamSeriesStatuses.Published;
            db.AddParameter(cmd, "session_published", DbTypes.Types.String).Value = ExamSessionStatuses.Published;
            using (var reader = await db.Execute(cmd))
            {
                while (await reader.ReadAsync())
                    result.Add(MapSession(reader));
            }
            foreach (var session in result)
                session.classids = new List<string>();
            await ExamSessionClassIds.AttachBatchAsync(db, orgId, result);
            return result;
        }

        private static void ValidateSession(ExamSession session)
        {
            if (string.IsNullOrWhiteSpace(session.examseriesid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series is required.");
            if (string.IsNullOrWhiteSpace(session.subjectid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Subject is required.");
            if (session.classids == null || session.classids.Count == 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "At least one class is required.");
            if (session.endtime <= session.starttime)
                throw new AppException(AppException.ErrorCodes.BadRequest, "End time must be after start time.");
            if (session.durationminutes <= 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Duration must be positive.");
            if (session.maxmarks <= 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Maximum marks must be positive.");
            if (session.passingmarks < 0 || session.passingmarks > session.maxmarks)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Passing marks are out of range.");
        }

        private async Task InsertSessionTransaction(IDb db, ExamSession s)
        {
            const string query = @"
                INSERT INTO exam_sessions (
                    id, organization_id, exam_series_id, subject_id, exam_date, start_time, end_time,
                    duration_minutes, max_marks, passing_marks, instructions, status, marks_status,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @exam_series_id, @subject_id, @exam_date, @start_time, @end_time,
                    @duration_minutes, @max_marks, @passing_marks, @instructions, @status, @marks_status,
                    @created_at, @updated_at, @created_by, @updated_by
                )";
            var cmd = db.GetCommand(query);
            BindSessionParams(db, cmd, s);
            await db.ExecuteNonQuery(cmd);
        }

        private async Task UpdateSessionTransaction(IDb db, ExamSession s)
        {
            const string query = @"
                UPDATE exam_sessions SET
                    exam_series_id = @exam_series_id, subject_id = @subject_id, exam_date = @exam_date,
                    start_time = @start_time, end_time = @end_time, duration_minutes = @duration_minutes,
                    max_marks = @max_marks, passing_marks = @passing_marks, instructions = @instructions,
                    status = @status, updated_at = @updated_at, updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id";
            var cmd = db.GetCommand(query);
            BindSessionParams(db, cmd, s);
            await db.ExecuteNonQuery(cmd);
        }

        private static void BindSessionParams(IDb db, DbCommand cmd, ExamSession s)
        {
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = s.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = s.organizationid;
            db.AddParameter(cmd, "exam_series_id", DbTypes.Types.String).Value = s.examseriesid;
            db.AddParameter(cmd, "subject_id", DbTypes.Types.String).Value = s.subjectid;
            db.AddParameter(cmd, "exam_date", DbTypes.Types.Date).Value = s.examdate.Date;
            db.AddParameter(cmd, "start_time", DbTypes.Types.Time).Value = s.starttime;
            db.AddParameter(cmd, "end_time", DbTypes.Types.Time).Value = s.endtime;
            db.AddParameter(cmd, "duration_minutes", DbTypes.Types.Integer).Value = s.durationminutes;
            db.AddParameter(cmd, "max_marks", DbTypes.Types.Decimal).Value = s.maxmarks;
            db.AddParameter(cmd, "passing_marks", DbTypes.Types.Decimal).Value = s.passingmarks;
            db.AddParameter(cmd, "instructions", DbTypes.Types.String).Value = s.instructions ?? "";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value =
                ResolveSessionStatusForWrite(s.status);
            db.AddParameter(cmd, "marks_status", DbTypes.Types.String).Value = s.marksstatus ?? ExamMarksWorkflowStatuses.Draft;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = s.createdat;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = s.updatedat;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = s.createdby ?? "";
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = s.updatedby ?? "";
        }

        private async Task ReplaceSessionClassesTransaction(IDb db, string orgId, string sessionId, List<string> classIds)
        {
            foreach (var classId in classIds.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                const string query = @"
                    INSERT INTO exam_session_classes (id, organization_id, exam_session_id, class_id, created_at)
                    VALUES (@id, @organization_id, @exam_session_id, @class_id, @created_at)";
                var cmd = db.GetCommand(query);
                db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
                db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = classId;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(cmd);
            }
        }

        private async Task DeleteSessionClassesTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                DELETE FROM exam_session_classes
                WHERE organization_id = @organization_id AND exam_session_id = @exam_session_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            await db.ExecuteNonQuery(cmd);
        }

        private static string ResolveSessionStatusForWrite(string? status, string? fallback = null)
        {
            if (!string.IsNullOrWhiteSpace(status))
            {
                var trimmed = status.Trim();
                if (ExamSessionStatuses.All.Contains(trimmed))
                    return trimmed;
            }
            if (!string.IsNullOrWhiteSpace(fallback))
            {
                var trimmedFallback = fallback.Trim();
                if (ExamSessionStatuses.All.Contains(trimmedFallback))
                    return trimmedFallback;
            }
            return ExamSessionStatuses.Draft;
        }

        private static ExamSession MapSession(DbDataReader reader, bool includeMarksStatus = true)
        {
            return new ExamSession
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                examseriesid = reader["exam_series_id"]?.ToString() ?? "",
                subjectid = reader["subject_id"]?.ToString() ?? "",
                examdate = reader["exam_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["exam_date"]),
                starttime = ExamDbReader.ReadTimeSpan(reader, "start_time"),
                endtime = ExamDbReader.ReadTimeSpan(reader, "end_time"),
                durationminutes = reader["duration_minutes"] == DBNull.Value ? 0 : Convert.ToInt32(reader["duration_minutes"]),
                maxmarks = reader["max_marks"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["max_marks"]),
                passingmarks = reader["passing_marks"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["passing_marks"]),
                instructions = reader["instructions"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "",
                marksstatus = includeMarksStatus
                    ? ExamDbReader.ReadOptionalString(reader, "marks_status", "Draft")
                    : "Draft",
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? "",
            };
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }
    }
}
