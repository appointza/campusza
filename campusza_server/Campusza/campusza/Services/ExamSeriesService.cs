using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamSeriesService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly TermService termService;
        private readonly ExamAuditService examAuditService;
        private readonly ExamValidationService examValidationService;
        private readonly RequestState requeststate;

        public ExamSeriesService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            OrganizationIdResolver organizationIdResolver,
            TermService termService,
            ExamAuditService examAuditService,
            ExamValidationService examValidationService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.termService = termService;
            this.examAuditService = examAuditService;
            this.examValidationService = examValidationService;
            this.requeststate = requeststate;
        }

        public async Task<List<ExamSeries>> Select(ExamSeriesSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, req);
        }

        public async Task<List<ExamSeries>> SelectTransaction(IDb db, ExamSeriesSelectReq req)
        {
            var result = new List<ExamSeries>();
            const string query = @"
                SELECT id, organization_id, term_id, academic_year, name, exam_type_ref_id,
                       start_date, end_date, status, instructions,
                       published_at, published_by, cancelled_at, cancelled_by, cancel_reason,
                       is_active, created_at, updated_at, created_by, updated_by
                FROM exam_series";

            var qb = querybuilderprovider.GetQueryBuilder(query);
            qb.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);

            if (!string.IsNullOrWhiteSpace(req.id))
                qb.AddParameter("id", "=", "id", req.id!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                qb.AddParameter("organization_id", "=", "organization_id", req.organizationid!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.termid))
                qb.AddParameter("term_id", "=", "term_id", req.termid!, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.status))
                qb.AddParameter("status", "=", "status", req.status!, DbTypes.Types.String);

            qb.AddOrderBy(QueryBuilder.Order.DESC, "start_date");

            using var reader = await db.Execute(qb.GetCommand(db));
            while (await reader.ReadAsync())
                result.Add(MapSeries(reader));
            return result;
        }

        public async Task<ExamSeries?> GetByIdTransaction(IDb db, string orgId, string id)
        {
            var rows = await SelectTransaction(db, new ExamSeriesSelectReq { organizationid = orgId, id = id });
            return rows.FirstOrDefault();
        }

        public async Task<ExamSeries> Save(ExamSeriesSaveReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(
                req.organizationid ?? req.series.organizationid,
                req.email ?? "");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var saved = await SaveTransaction(db, orgId, req.series);
                await examAuditService.AppendAsync(db, orgId, "exam_series", saved.id, "Save", after: new { saved.status, saved.name });
                await db.CommitTransaction();
                return saved;
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamSeries> SaveTransaction(IDb db, string orgId, ExamSeries series)
        {
            series.organizationid = orgId;
            ValidateSeriesForSave(series);

            var terms = await termService.SelectTransaction(db, new TermSelectReq { id = series.termid, organizationid = orgId });
            var term = terms.FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Term not found for this organization.");
            ExamTenantGuard.EnsureSameOrganization(orgId, term.organizationid, "Term");

            if (string.IsNullOrWhiteSpace(series.academicyear))
                series.academicyear = term.academicyear ?? "";

            var dateValidation = examValidationService.ValidateSeriesDatesAgainstTerm(series, term);
            if (!dateValidation.isvalid)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, string.Join(" ", dateValidation.errors));
            }

            var now = DateTime.UtcNow;
            var actor = ResolveActor();

            if (string.IsNullOrWhiteSpace(series.id))
            {
                series.id = Guid.NewGuid().ToString();
                series.status = ExamSeriesStatuses.Draft;
                series.isactive = true;
                series.createdat = now;
                series.createdby = actor;
                await InsertTransaction(db, series);
            }
            else
            {
                var existing = await GetByIdTransaction(db, orgId, series.id)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");
                ExamTenantGuard.EnsureSameOrganization(orgId, existing.organizationid, "Exam series");

                if (!string.Equals(existing.status, ExamSeriesStatuses.Draft, StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(existing.status, ExamSeriesStatuses.Scheduled, StringComparison.OrdinalIgnoreCase))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "Only draft or scheduled exam series can be edited.");
                }

                series.createdat = existing.createdat;
                series.createdby = existing.createdby;
                series.status = string.IsNullOrWhiteSpace(series.status) ? existing.status : series.status;
                series.updatedat = now;
                series.updatedby = actor;
                await UpdateTransaction(db, series);
            }

            return series;
        }

        public async Task<ExamValidationResult> Validate(ExamSeriesValidateReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series ID is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await examValidationService.ValidateSeriesAsync(db, orgId, req.id);
        }

        public async Task<ExamSeries> Schedule(ExamSeriesLifecycleReq req)
        {
            return await TransitionSeries(req, ExamSeriesStatuses.Scheduled, "Schedule");
        }

        public async Task<ExamSeries> Publish(ExamSeriesLifecycleReq req)
        {
            return await TransitionSeries(req, ExamSeriesStatuses.Published, "Publish");
        }

        public async Task<ExamSeries> Cancel(ExamSeriesLifecycleReq req)
        {
            if (string.IsNullOrWhiteSpace(req.reason))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Cancellation reason is required.");
            return await TransitionSeries(req, ExamSeriesStatuses.Cancelled, "Cancel", req.reason);
        }

        private async Task<ExamSeries> TransitionSeries(ExamSeriesLifecycleReq req, string targetStatus, string action, string? reason = null)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series ID is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var existing = await GetByIdTransaction(db, orgId, req.id)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");

                examValidationService.EnsureSeriesTransition(existing.status, targetStatus);

                if (targetStatus is ExamSeriesStatuses.Scheduled or ExamSeriesStatuses.Published)
                {
                    await examValidationService.AssertSeriesReadyForLifecycleAsync(db, orgId, req.id);
                }

                var before = new { existing.status };
                existing.status = targetStatus;
                existing.updatedat = DateTime.UtcNow;
                existing.updatedby = ResolveActor();

                if (targetStatus == ExamSeriesStatuses.Published)
                {
                    existing.publishedat = DateTime.UtcNow;
                    existing.publishedby = existing.updatedby;
                }
                if (targetStatus == ExamSeriesStatuses.Cancelled)
                {
                    existing.cancelledat = DateTime.UtcNow;
                    existing.cancelledby = existing.updatedby;
                    existing.cancelreason = reason ?? "";
                }

                await UpdateStatusTransaction(db, existing);

                if (targetStatus == ExamSeriesStatuses.Scheduled)
                {
                    await SyncSessionStatusesForSeriesTransaction(
                        db, orgId, existing.id, ExamSessionStatuses.Scheduled);
                }
                else if (targetStatus == ExamSeriesStatuses.Published)
                {
                    await SyncSessionStatusesForSeriesTransaction(
                        db, orgId, existing.id, ExamSessionStatuses.Published);
                }

                await examAuditService.AppendAsync(db, orgId, "exam_series", existing.id, action, reason, before, new { existing.status });
                await db.CommitTransaction();
                return existing;
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        private static void ValidateSeriesForSave(ExamSeries series)
        {
            if (string.IsNullOrWhiteSpace(series.name))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series name is required.");
            if (string.IsNullOrWhiteSpace(series.termid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Term is required.");
            if (series.enddate.Date < series.startdate.Date)
                throw new AppException(AppException.ErrorCodes.BadRequest, "End date must be on or after start date.");
        }

        private async Task InsertTransaction(IDb db, ExamSeries s)
        {
            const string query = @"
                INSERT INTO exam_series (
                    id, organization_id, term_id, academic_year, name, exam_type_ref_id,
                    start_date, end_date, status, instructions,
                    is_active, created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @term_id, @academic_year, @name, @exam_type_ref_id,
                    @start_date, @end_date, @status, @instructions,
                    @is_active, @created_at, @updated_at, @created_by, @updated_by
                )";
            var cmd = db.GetCommand(query);
            BindSeriesParams(db, cmd, s);
            await db.ExecuteNonQuery(cmd);
        }

        private async Task UpdateTransaction(IDb db, ExamSeries s)
        {
            const string query = @"
                UPDATE exam_series SET
                    term_id = @term_id, academic_year = @academic_year, name = @name,
                    exam_type_ref_id = @exam_type_ref_id, start_date = @start_date, end_date = @end_date,
                    status = @status, instructions = @instructions,
                    updated_at = @updated_at, updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id AND is_active = true";
            var cmd = db.GetCommand(query);
            BindSeriesParams(db, cmd, s);
            await db.ExecuteNonQuery(cmd);
        }

        private async Task UpdateStatusTransaction(IDb db, ExamSeries s)
        {
            const string query = @"
                UPDATE exam_series SET
                    status = @status, published_at = @published_at, published_by = @published_by,
                    cancelled_at = @cancelled_at, cancelled_by = @cancelled_by, cancel_reason = @cancel_reason,
                    updated_at = @updated_at, updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id AND is_active = true";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = s.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = s.organizationid;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = s.status;
            db.AddParameter(cmd, "published_at", DbTypes.Types.DateTime).Value =
                s.publishedat.HasValue ? s.publishedat.Value : DBNull.Value;
            db.AddParameter(cmd, "published_by", DbTypes.Types.String).Value = s.publishedby ?? "";
            db.AddParameter(cmd, "cancelled_at", DbTypes.Types.DateTime).Value =
                s.cancelledat.HasValue ? s.cancelledat.Value : DBNull.Value;
            db.AddParameter(cmd, "cancelled_by", DbTypes.Types.String).Value = s.cancelledby ?? "";
            db.AddParameter(cmd, "cancel_reason", DbTypes.Types.String).Value = s.cancelreason ?? "";
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = s.updatedat;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = s.updatedby ?? "";
            await db.ExecuteNonQuery(cmd);
        }

        private static void BindSeriesParams(IDb db, DbCommand cmd, ExamSeries s)
        {
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = s.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = s.organizationid;
            db.AddParameter(cmd, "term_id", DbTypes.Types.String).Value = s.termid;
            db.AddParameter(cmd, "academic_year", DbTypes.Types.String).Value = s.academicyear ?? "";
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = s.name ?? "";
            db.AddParameter(cmd, "exam_type_ref_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(s.examtyperefid) ? DBNull.Value : s.examtyperefid;
            db.AddParameter(cmd, "start_date", DbTypes.Types.Date).Value = s.startdate.Date;
            db.AddParameter(cmd, "end_date", DbTypes.Types.Date).Value = s.enddate.Date;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = s.status ?? ExamSeriesStatuses.Draft;
            db.AddParameter(cmd, "instructions", DbTypes.Types.String).Value = s.instructions ?? "";
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = s.isactive;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = s.createdat;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = s.updatedat;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = s.createdby ?? "";
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = s.updatedby ?? "";
        }

        private static ExamSeries MapSeries(DbDataReader reader)
        {
            return new ExamSeries
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                termid = reader["term_id"]?.ToString() ?? "",
                academicyear = reader["academic_year"]?.ToString() ?? "",
                name = reader["name"]?.ToString() ?? "",
                examtyperefid = reader["exam_type_ref_id"]?.ToString() ?? "",
                startdate = reader["start_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["start_date"]),
                enddate = reader["end_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["end_date"]),
                status = reader["status"]?.ToString() ?? "",
                instructions = reader["instructions"]?.ToString() ?? "",
                publishedat = reader["published_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["published_at"]),
                publishedby = reader["published_by"]?.ToString() ?? "",
                cancelledat = reader["cancelled_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["cancelled_at"]),
                cancelledby = reader["cancelled_by"]?.ToString() ?? "",
                cancelreason = reader["cancel_reason"]?.ToString() ?? "",
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? "",
            };
        }

        private async Task SyncSessionStatusesForSeriesTransaction(IDb db, string orgId, string seriesId, string targetStatus)
        {
            const string query = @"
                UPDATE exam_sessions SET
                    status = @status,
                    updated_at = @updated_at
                WHERE organization_id = @organization_id
                  AND exam_series_id = @exam_series_id
                  AND status <> @cancelled";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = targetStatus;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_series_id", DbTypes.Types.String).Value = seriesId;
            db.AddParameter(cmd, "cancelled", DbTypes.Types.String).Value = ExamSessionStatuses.Cancelled;
            await db.ExecuteNonQuery(cmd);
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }
    }
}
