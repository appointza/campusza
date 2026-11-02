using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class SchoolNoticeService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;
        private readonly TermService termService;
        private readonly SchoolCalendarService schoolCalendarService;

        public SchoolNoticeService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            TermService termService,
            SchoolCalendarService schoolCalendarService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.termService = termService;
            this.schoolCalendarService = schoolCalendarService;
        }

        public async Task<SchoolNotificationsPageRes> GetNotificationsPage(SchoolNotificationsPageReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            var audience = NormalizeReaderAudience(req.audience);
            var canManage = audience == "admin";

            Term? term = null;
            var weekly = new List<SchoolCalendarWeeklyRule>();
            var overrides = new List<SchoolCalendarDayOverride>();

            var terms = await termService.Select(new TermSelectReq { organizationid = orgId, status = "active" });
            var today = DateTime.Now.Date;
            var activeTerms = terms
                .Where(t => t.isactive && string.Equals(t.status, "active", StringComparison.OrdinalIgnoreCase))
                .ToList();
            term = activeTerms.FirstOrDefault(t => t.startdate.Date <= today && t.enddate.Date >= today)
                ?? activeTerms.OrderByDescending(t => t.startdate).FirstOrDefault();

            if (term != null)
            {
                var cal = await schoolCalendarService.GetPage(new SchoolCalendarPageReq
                {
                    termid = term.id,
                    organizationid = orgId,
                });
                term = cal.term;
                weekly = cal.weeklyrules;
                overrides = cal.dayoverrides;
            }

            var notices = await Select(new SchoolNoticeSelectReq
            {
                organizationid = orgId,
                audience = audience,
                includemanagement = canManage,
            });

            return new SchoolNotificationsPageRes
            {
                term = term,
                weeklyrules = weekly,
                dayoverrides = overrides,
                notices = notices,
                canmanage = canManage,
            };
        }

        public async Task<List<SchoolNotice>> Select(SchoolNoticeSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<SchoolNotice>> SelectTransaction(IDb db, SchoolNoticeSelectReq req)
        {
            var result = new List<SchoolNotice>();
            const string query = @"
                SELECT
                    id, organization_id, title, body, audience,
                    publish_from, publish_to, is_active,
                    created_at, updated_at, created_by, updated_by
                FROM school_notices
            ";

            var qb = querybuilderprovider.GetQueryBuilder(query);
            if (!string.IsNullOrWhiteSpace(req.id))
                qb.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                qb.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);

            qb.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            qb.AddOrderBy(QueryBuilder.Order.DESC, "created_at");

            var today = DateTime.Now.Date;
            var readerAudience = NormalizeReaderAudience(req.audience);
            var includeManagement = req.includemanagement && readerAudience == "admin";

            using var reader = await db.Execute(qb.GetCommand(db));
            while (await reader.ReadAsync())
            {
                var notice = MapRow(reader);
                if (includeManagement)
                {
                    if (!notice.isactive) continue;
                    result.Add(notice);
                    continue;
                }

                if (!IsPublishedOn(notice, today))
                    continue;
                if (!MatchesReaderAudience(notice.audience, readerAudience))
                    continue;
                result.Add(notice);
            }

            return result;
        }

        public async Task<SchoolNotice> Save(SchoolNoticeSaveReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.body?.Trim()) && string.IsNullOrWhiteSpace(req.title?.Trim()))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Title or message body is required.");

            var audience = NormalizeNoticeAudience(req.audience);
            DateTime? publishFrom = ParseOptionalDate(req.publishfrom);
            DateTime? publishTo = ParseOptionalDate(req.publishto);
            if (publishFrom.HasValue && publishTo.HasValue && publishFrom.Value.Date > publishTo.Value.Date)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Publish from date cannot be after publish to date.");

            var actor = CurrentActor();
            var id = string.IsNullOrWhiteSpace(req.id) ? Guid.NewGuid().ToString() : req.id.Trim();

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                const string query = @"
                    INSERT INTO school_notices (
                        id, organization_id, title, body, audience,
                        publish_from, publish_to, is_active,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        @id, @organization_id, @title, @body, @audience,
                        @publish_from, @publish_to, @is_active,
                        @created_at, @updated_at, @created_by, @updated_by
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        body = EXCLUDED.body,
                        audience = EXCLUDED.audience,
                        publish_from = EXCLUDED.publish_from,
                        publish_to = EXCLUDED.publish_to,
                        is_active = EXCLUDED.is_active,
                        updated_at = EXCLUDED.updated_at,
                        updated_by = EXCLUDED.updated_by
                ";
                var cmd = db.GetCommand(query);
                db.AddParameter(cmd, "id", DbTypes.Types.String).Value = id;
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(cmd, "title", DbTypes.Types.String).Value = req.title?.Trim() ?? "";
                db.AddParameter(cmd, "body", DbTypes.Types.String).Value = req.body?.Trim() ?? "";
                db.AddParameter(cmd, "audience", DbTypes.Types.String).Value = audience;
                db.AddParameter(cmd, "publish_from", DbTypes.Types.Date).Value =
                    publishFrom.HasValue ? publishFrom.Value.Date : DBNull.Value;
                db.AddParameter(cmd, "publish_to", DbTypes.Types.Date).Value =
                    publishTo.HasValue ? publishTo.Value.Date : DBNull.Value;
                db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = true;
                db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = actor;
                db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;
                await db.ExecuteNonQuery(cmd);
            }

            var saved = await Select(new SchoolNoticeSelectReq { id = id, organizationid = orgId, audience = "admin", includemanagement = true });
            return saved.FirstOrDefault() ?? new SchoolNotice { id = id, organizationid = orgId };
        }

        public async Task Delete(SchoolNoticeDeleteReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Notice id is required.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                const string query = @"
                    UPDATE school_notices
                    SET is_active = false, updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id AND organization_id = @organization_id
                ";
                var cmd = db.GetCommand(query);
                db.AddParameter(cmd, "id", DbTypes.Types.String).Value = req.id;
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = CurrentActor();
                await db.ExecuteNonQuery(cmd);
            }
        }

        private static SchoolNotice MapRow(DbDataReader reader)
        {
            return new SchoolNotice
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString() ?? "",
                title = reader["title"] == DBNull.Value ? "" : reader["title"].ToString() ?? "",
                body = reader["body"] == DBNull.Value ? "" : reader["body"].ToString() ?? "",
                audience = reader["audience"] == DBNull.Value ? "all" : reader["audience"].ToString() ?? "all",
                publishfrom = reader["publish_from"] == DBNull.Value ? null : Convert.ToDateTime(reader["publish_from"]),
                publishto = reader["publish_to"] == DBNull.Value ? null : Convert.ToDateTime(reader["publish_to"]),
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString() ?? "",
                updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString() ?? "",
            };
        }

        private static bool IsPublishedOn(SchoolNotice notice, DateTime today)
        {
            if (!notice.isactive) return false;
            if (notice.publishfrom.HasValue && notice.publishfrom.Value.Date > today) return false;
            if (notice.publishto.HasValue && notice.publishto.Value.Date < today) return false;
            return true;
        }

        private static bool MatchesReaderAudience(string noticeAudience, string readerAudience)
        {
            var na = NormalizeNoticeAudience(noticeAudience);
            if (na == "all") return true;
            if (readerAudience == "admin") return true;
            return string.Equals(na, readerAudience, StringComparison.OrdinalIgnoreCase);
        }

        private static string NormalizeReaderAudience(string raw)
        {
            var a = (raw ?? "staff").Trim().ToLowerInvariant();
            if (a == "student") return "student";
            if (a == "admin" || a == "admin_staff") return "admin";
            return "staff";
        }

        private static string NormalizeNoticeAudience(string raw)
        {
            var a = (raw ?? "all").Trim().ToLowerInvariant();
            if (a == "staff" || a == "student") return a;
            return "all";
        }

        private static DateTime? ParseOptionalDate(string raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return null;
            if (DateTime.TryParse(raw.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
                return d.Date;
            throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid date format.");
        }

        private string ResolveOrgId(string fromReq)
        {
            if (!string.IsNullOrWhiteSpace(fromReq))
                return fromReq.Trim();
            if (requeststate.usercontext?.organisationid > 0)
                return requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
        }

        private string CurrentActor()
        {
            var email = requeststate.usercontext?.useremail?.Trim();
            if (!string.IsNullOrWhiteSpace(email)) return email;
            return requeststate.usercontext?.userid.ToString(CultureInfo.InvariantCulture) ?? "";
        }
    }
}
