using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class SchoolCalendarService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;
        private readonly TermService termService;

        public SchoolCalendarService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            TermService termService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.termService = termService;
        }

        public async Task<SchoolCalendarPageRes> GetPage(SchoolCalendarPageReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.termid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Term is required.");

            var terms = await termService.Select(new TermSelectReq
            {
                id = req.termid,
                organizationid = orgId,
            });
            var term = terms.FirstOrDefault();
            if (term == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Term not found.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                var weekly = await SelectWeeklyRulesTransaction(db, orgId, req.termid);
                var overrides = await SelectDayOverridesTransaction(db, orgId, req.termid);
                return new SchoolCalendarPageRes
                {
                    term = term,
                    weeklyrules = weekly,
                    dayoverrides = overrides,
                };
            }
        }

        public async Task<SchoolCalendarPageRes> SaveWeeklyRule(SchoolCalendarWeeklyRuleSaveReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.termid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Term is required.");
            if (req.weekday < 0 || req.weekday > 6)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Weekday must be 0 (Sunday) through 6 (Saturday).");
            var dayType = NormalizeDayType(req.daytype, allowOpen: false);
            if (dayType != "closed" && dayType != "half_day")
                throw new AppException(AppException.ErrorCodes.BadRequest, "Weekly rule must be closed or half_day.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                var existing = await SelectWeeklyRulesTransaction(db, orgId, req.termid);
                var match = existing.FirstOrDefault(r => r.weekday == req.weekday);
                var rule = new SchoolCalendarWeeklyRule
                {
                    id = string.IsNullOrWhiteSpace(req.id) ? match?.id ?? Guid.NewGuid().ToString() : req.id,
                    organizationid = orgId,
                    termid = req.termid,
                    weekday = req.weekday,
                    daytype = dayType,
                    reason = req.reason?.Trim() ?? "",
                    isactive = true,
                };
                if (match != null && match.id != rule.id)
                {
                    await SoftDeleteWeeklyRuleTransaction(db, match.id);
                }
                await UpsertWeeklyRuleTransaction(db, rule);
            }

            return await GetPage(new SchoolCalendarPageReq { termid = req.termid, organizationid = orgId });
        }

        public async Task<SchoolCalendarPageRes> DeleteWeeklyRule(SchoolCalendarDeleteReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Rule id is required.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await SoftDeleteWeeklyRuleTransaction(db, req.id);
            }

            return await GetPage(new SchoolCalendarPageReq { termid = req.termid, organizationid = orgId });
        }

        public async Task<SchoolCalendarPageRes> SaveDayOverride(SchoolCalendarDayOverrideSaveReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.termid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Term is required.");
            if (!DateTime.TryParse(req.calendardate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var calendarDate))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid calendar date is required.");
            var dayType = NormalizeDayType(req.daytype, allowOpen: true);

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                var existing = await SelectDayOverridesTransaction(db, orgId, req.termid);
                var dateKey = calendarDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                var match = existing.FirstOrDefault(o =>
                    o.calendardate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) == dateKey);
                var item = new SchoolCalendarDayOverride
                {
                    id = string.IsNullOrWhiteSpace(req.id) ? match?.id ?? Guid.NewGuid().ToString() : req.id,
                    organizationid = orgId,
                    termid = req.termid,
                    calendardate = calendarDate.Date,
                    daytype = dayType,
                    reason = req.reason?.Trim() ?? "",
                    isactive = true,
                };
                if (match != null && match.id != item.id)
                {
                    await SoftDeleteDayOverrideTransaction(db, match.id);
                }
                await UpsertDayOverrideTransaction(db, item);
            }

            return await GetPage(new SchoolCalendarPageReq { termid = req.termid, organizationid = orgId });
        }

        public async Task<SchoolCalendarPageRes> DeleteDayOverride(SchoolCalendarDeleteReq req)
        {
            var orgId = ResolveOrgId(req.organizationid);
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Override id is required.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await SoftDeleteDayOverrideTransaction(db, req.id);
            }

            return await GetPage(new SchoolCalendarPageReq { termid = req.termid, organizationid = orgId });
        }

        private string ResolveOrgId(string fromReq)
        {
            if (!string.IsNullOrWhiteSpace(fromReq))
                return fromReq.Trim();
            if (requeststate.usercontext?.organisationid > 0)
                return requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
        }

        private static string NormalizeDayType(string raw, bool allowOpen)
        {
            var t = (raw ?? "").Trim().ToLowerInvariant();
            if (t == "leave" || t == "holiday" || t == "closed") return "closed";
            if (t == "half_day" || t == "halfday" || t == "half") return "half_day";
            if (allowOpen && (t == "open" || t == "working")) return "open";
            return t;
        }

        private async Task<List<SchoolCalendarWeeklyRule>> SelectWeeklyRulesTransaction(IDb db, string orgId, string termId)
        {
            const string query = @"
                SELECT id, organization_id, term_id, weekday, day_type, reason, is_active
                FROM school_calendar_weekly_rules
            ";
            var qb = querybuilderprovider.GetQueryBuilder(query);
            qb.AddParameter("organization_id", "=", "organization_id", orgId, DbTypes.Types.String);
            qb.AddParameter("term_id", "=", "term_id", termId, DbTypes.Types.String);
            qb.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            qb.AddOrderBy(QueryBuilder.Order.ASC, "weekday");

            var result = new List<SchoolCalendarWeeklyRule>();
            using var reader = await db.Execute(qb.GetCommand(db));
            while (await reader.ReadAsync())
            {
                result.Add(MapWeeklyRule(reader));
            }
            return result;
        }

        private async Task<List<SchoolCalendarDayOverride>> SelectDayOverridesTransaction(IDb db, string orgId, string termId)
        {
            const string query = @"
                SELECT id, organization_id, term_id, calendar_date, day_type, reason, is_active
                FROM school_calendar_day_overrides
            ";
            var qb = querybuilderprovider.GetQueryBuilder(query);
            qb.AddParameter("organization_id", "=", "organization_id", orgId, DbTypes.Types.String);
            qb.AddParameter("term_id", "=", "term_id", termId, DbTypes.Types.String);
            qb.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            qb.AddOrderBy(QueryBuilder.Order.ASC, "calendar_date");

            var result = new List<SchoolCalendarDayOverride>();
            using var reader = await db.Execute(qb.GetCommand(db));
            while (await reader.ReadAsync())
            {
                result.Add(MapDayOverride(reader));
            }
            return result;
        }

        private static SchoolCalendarWeeklyRule MapWeeklyRule(DbDataReader reader)
        {
            return new SchoolCalendarWeeklyRule
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString() ?? "",
                termid = reader["term_id"] == DBNull.Value ? "" : reader["term_id"].ToString() ?? "",
                weekday = reader["weekday"] == DBNull.Value ? 0 : Convert.ToInt32(reader["weekday"]),
                daytype = reader["day_type"] == DBNull.Value ? "" : reader["day_type"].ToString() ?? "",
                reason = reader["reason"] == DBNull.Value ? "" : reader["reason"].ToString() ?? "",
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
            };
        }

        private static SchoolCalendarDayOverride MapDayOverride(DbDataReader reader)
        {
            return new SchoolCalendarDayOverride
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString() ?? "",
                termid = reader["term_id"] == DBNull.Value ? "" : reader["term_id"].ToString() ?? "",
                calendardate = reader["calendar_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["calendar_date"]),
                daytype = reader["day_type"] == DBNull.Value ? "" : reader["day_type"].ToString() ?? "",
                reason = reader["reason"] == DBNull.Value ? "" : reader["reason"].ToString() ?? "",
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
            };
        }

        private async Task UpsertWeeklyRuleTransaction(IDb db, SchoolCalendarWeeklyRule rule)
        {
            const string query = @"
                INSERT INTO school_calendar_weekly_rules (
                    id, organization_id, term_id, weekday, day_type, reason, is_active, created_at, updated_at
                ) VALUES (
                    @id, @organization_id, @term_id, @weekday, @day_type, @reason, @is_active, @created_at, @updated_at
                )
                ON CONFLICT (id) DO UPDATE SET
                    weekday = EXCLUDED.weekday,
                    day_type = EXCLUDED.day_type,
                    reason = EXCLUDED.reason,
                    is_active = EXCLUDED.is_active,
                    updated_at = EXCLUDED.updated_at
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = rule.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = rule.organizationid;
            db.AddParameter(cmd, "term_id", DbTypes.Types.String).Value = rule.termid;
            db.AddParameter(cmd, "weekday", DbTypes.Types.Integer).Value = rule.weekday;
            db.AddParameter(cmd, "day_type", DbTypes.Types.String).Value = rule.daytype;
            db.AddParameter(cmd, "reason", DbTypes.Types.String).Value = rule.reason ?? "";
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = rule.isactive;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task UpsertDayOverrideTransaction(IDb db, SchoolCalendarDayOverride item)
        {
            const string query = @"
                INSERT INTO school_calendar_day_overrides (
                    id, organization_id, term_id, calendar_date, day_type, reason, is_active, created_at, updated_at
                ) VALUES (
                    @id, @organization_id, @term_id, @calendar_date, @day_type, @reason, @is_active, @created_at, @updated_at
                )
                ON CONFLICT (id) DO UPDATE SET
                    calendar_date = EXCLUDED.calendar_date,
                    day_type = EXCLUDED.day_type,
                    reason = EXCLUDED.reason,
                    is_active = EXCLUDED.is_active,
                    updated_at = EXCLUDED.updated_at
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = item.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = item.organizationid;
            db.AddParameter(cmd, "term_id", DbTypes.Types.String).Value = item.termid;
            db.AddParameter(cmd, "calendar_date", DbTypes.Types.Date).Value = item.calendardate.Date;
            db.AddParameter(cmd, "day_type", DbTypes.Types.String).Value = item.daytype;
            db.AddParameter(cmd, "reason", DbTypes.Types.String).Value = item.reason ?? "";
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = item.isactive;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task SoftDeleteWeeklyRuleTransaction(IDb db, string id)
        {
            const string query = @"
                UPDATE school_calendar_weekly_rules SET is_active = false, updated_at = @updated_at WHERE id = @id
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = id;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task SoftDeleteDayOverrideTransaction(IDb db, string id)
        {
            const string query = @"
                UPDATE school_calendar_day_overrides SET is_active = false, updated_at = @updated_at WHERE id = @id
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = id;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }
    }
}
