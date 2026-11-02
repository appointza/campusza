using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;
using System.Text.Json;

namespace Campusza.Services.Campusza
{
    public class DashboardService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public DashboardService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<DashboardStatsDTO> GetStats(DashboardSelectReq req)
        {
            var page = await GetAdminDashboardPage(new AdminDashboardPageReq
            {
                organizationid = ResolveOrganizationId(req.organizationid, req.organisationid),
            });

            return new DashboardStatsDTO
            {
                totalstudents = page.totalstudents,
                totalstaff = page.totalstaff,
                totalclasses = page.classestoday,
                attendancerate = page.attendancerate == "—" ? 0 : ParseAttendanceRate(page.attendancerate),
                recentactivities = page.recentactivities.Select(a => new DashboardActivityDTO
                {
                    action = a.action,
                    description = a.name,
                    timestamp = DateTime.UtcNow,
                }).ToList(),
            };
        }

        public async Task<AdminDashboardPageRes> GetAdminDashboardPage(AdminDashboardPageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid, 0);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            var todayDay = DateTime.Now.ToString("dddd", CultureInfo.InvariantCulture);
            var page = new AdminDashboardPageRes();

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                page.totalstudents = await ExecuteCountAsync(db, @"
                    SELECT COUNT(*)
                    FROM students
                    WHERE organization_id = @organization_id
                      AND is_active = true", orgId);

                page.totalstaff = await ExecuteCountAsync(db, @"
                    SELECT COUNT(*)
                    FROM staff
                    WHERE organization_id = @organization_id
                      AND is_active = true", orgId);

                page.classestoday = await ExecuteCountAsync(db, @"
                    SELECT COUNT(DISTINCT class_id)
                    FROM staff_schedules
                    WHERE organization_id = @organization_id
                      AND is_active = true
                      AND class_id IS NOT NULL
                      AND day = @day", orgId, ("day", todayDay));

                page.attendancerate = await GetTodayAttendanceRateAsync(db, orgId);
                page.recentactivities = await GetRecentActivitiesAsync(db, orgId);
            }

            return page;
        }

        public async Task<PlatformDashboardPageRes> GetPlatformDashboardPage(string sessionEmail)
        {
            var email = sessionEmail?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(email))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Session email is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            if (!await IsSuperAdminByEmailAsync(db, email))
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "Platform administrator access only.");

            var result = new PlatformDashboardPageRes();

            const string countSql = @"
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE lower(type) IN ('school', 'primary', 'secondary', 'high', 'college', 'university', 'training_center')) AS schools
                FROM organizations
                WHERE is_active = true";

            var countCmd = db.GetCommand(countSql);
            using (var countReader = await db.Execute(countCmd))
            {
                if (await countReader.ReadAsync())
                {
                    result.totalorganizations = countReader["total"] == DBNull.Value
                        ? 0
                        : Convert.ToInt64(countReader["total"]);
                    result.totalschools = countReader["schools"] == DBNull.Value
                        ? result.totalorganizations
                        : Convert.ToInt64(countReader["schools"]);
                }
            }

            const string listSql = @"
                SELECT
                    o.id,
                    o.name,
                    o.slug,
                    o.status,
                    o.type,
                    o.created_at,
                    (
                        SELECT COUNT(*)
                        FROM students s
                        WHERE s.organization_id = o.id AND s.is_active = true
                    ) AS student_count,
                    (
                        SELECT COUNT(*)
                        FROM staff st
                        WHERE st.organization_id = o.id AND st.is_active = true
                    ) AS staff_count,
                    p.billing_period,
                    p.currency_code,
                    p.amount_per_student_yearly,
                    p.term_amounts,
                    (
                        SELECT COALESCE(
                            NULLIF(TRIM(st.full_name), ''),
                            NULLIF(TRIM(CONCAT(COALESCE(st.first_name, ''), ' ', COALESCE(st.last_name, ''))), ''),
                            NULLIF(TRIM(u.username), ''),
                            split_part(u.email, '@', 1)
                        )
                        FROM users u
                        LEFT JOIN staff st ON st.id = u.profile_id AND st.organization_id = o.id AND st.is_active = true
                        WHERE u.organization_id = o.id
                          AND u.is_active = true
                          AND lower(u.role) = 'admin'
                          AND COALESCE(u.isfactory, false) = false
                        ORDER BY u.created_at ASC NULLS LAST
                        LIMIT 1
                    ) AS admin_name,
                    (
                        SELECT COALESCE(
                            NULLIF(TRIM(u.mobile), ''),
                            NULLIF(TRIM(st.phone), ''),
                            NULLIF(TRIM(o.phone), '')
                        )
                        FROM users u
                        LEFT JOIN staff st ON st.id = u.profile_id AND st.organization_id = o.id AND st.is_active = true
                        WHERE u.organization_id = o.id
                          AND u.is_active = true
                          AND lower(u.role) = 'admin'
                          AND COALESCE(u.isfactory, false) = false
                        ORDER BY u.created_at ASC NULLS LAST
                        LIMIT 1
                    ) AS admin_mobile
                FROM organizations o
                LEFT JOIN organization_platform_pricing p ON p.organization_id = o.id
                WHERE o.is_active = true
                ORDER BY o.created_at DESC NULLS LAST, o.name ASC";

            var listCmd = db.GetCommand(listSql);
            using (var reader = await db.Execute(listCmd))
            {
                while (await reader.ReadAsync())
                {
                    var created = reader["created_at"] == DBNull.Value
                        ? DateTime.UtcNow
                        : Convert.ToDateTime(reader["created_at"]);
                    result.organizations.Add(new PlatformOrganizationListItem
                    {
                        id = reader["id"]?.ToString()?.Trim() ?? "",
                        name = reader["name"]?.ToString()?.Trim() ?? "",
                        slug = reader["slug"]?.ToString()?.Trim() ?? "",
                        status = reader["status"]?.ToString()?.Trim() ?? "",
                        type = reader["type"]?.ToString()?.Trim() ?? "",
                        studentcount = reader["student_count"] == DBNull.Value
                            ? 0
                            : Convert.ToInt64(reader["student_count"]),
                        staffcount = reader["staff_count"] == DBNull.Value
                            ? 0
                            : Convert.ToInt64(reader["staff_count"]),
                        createdat = created.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        adminname = reader["admin_name"] == DBNull.Value
                            ? ""
                            : reader["admin_name"]?.ToString()?.Trim() ?? "",
                        adminmobile = reader["admin_mobile"] == DBNull.Value
                            ? ""
                            : reader["admin_mobile"]?.ToString()?.Trim() ?? "",
                        studentpricing = MapPricingFromOrgRow(reader),
                    });
                }
            }

            return result;
        }

        public async Task<PlatformStudentPricingConfig> SavePlatformStudentPricing(PlatformStudentPricingSaveReq req)
        {
            var email = req.email?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(email))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Session email is required.");

            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            var billing = NormalizeBillingPeriod(req.billingperiod);
            var currency = string.IsNullOrWhiteSpace(req.currencycode) ? "INR" : req.currencycode.Trim().ToUpperInvariant();
            if (currency.Length > 10)
                currency = currency[..10];

            var yearly = req.amountperstudentyearly;
            if (yearly < 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Yearly amount cannot be negative.");

            var terms = SanitizeTermAmounts(req.termamounts);
            if (billing == "per_term" && terms.Count == 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Add at least one term with an amount.");

            foreach (var t in terms)
            {
                if (t.amount < 0)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Term amounts cannot be negative.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            if (!await IsSuperAdminByEmailAsync(db, email))
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "Platform administrator access only.");

            if (!await OrganizationExistsAndActiveAsync(db, orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization not found or inactive.");

            var termsJson = JsonSerializer.Serialize(terms);

            const string upsert = @"
                INSERT INTO organization_platform_pricing (
                    organization_id, billing_period, currency_code, amount_per_student_yearly, term_amounts, updated_at, updated_by
                )
                VALUES (
                    @organization_id, @billing_period, @currency_code, @amount_per_student_yearly, @term_amounts::jsonb, CURRENT_TIMESTAMP, @updated_by
                )
                ON CONFLICT (organization_id) DO UPDATE SET
                    billing_period = EXCLUDED.billing_period,
                    currency_code = EXCLUDED.currency_code,
                    amount_per_student_yearly = EXCLUDED.amount_per_student_yearly,
                    term_amounts = EXCLUDED.term_amounts,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = EXCLUDED.updated_by";

            var cmd = db.GetCommand(upsert);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "billing_period", DbTypes.Types.String).Value = billing;
            db.AddParameter(cmd, "currency_code", DbTypes.Types.String).Value = currency;
            db.AddParameter(cmd, "amount_per_student_yearly", DbTypes.Types.Decimal).Value = yearly;
            db.AddParameter(cmd, "term_amounts", DbTypes.Types.Json).Value = termsJson;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = email;

            await db.ExecuteNonQuery(cmd);

            return await GetOrganizationPlatformPricingAsync(db, orgId);
        }

        private static async Task<bool> OrganizationExistsAndActiveAsync(IDb db, string orgId)
        {
            const string sql = @"
                SELECT 1
                FROM organizations
                WHERE id = @organization_id AND is_active = true
                LIMIT 1";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            using var reader = await db.Execute(cmd);
            return await reader.ReadAsync();
        }

        private static PlatformStudentPricingConfig CreateDefaultPricingConfig()
        {
            return new PlatformStudentPricingConfig
            {
                billingperiod = "per_year",
                currencycode = "INR",
                amountperstudentyearly = 0,
                termamounts = DefaultTermAmounts(),
            };
        }

        private static PlatformStudentPricingConfig MapPricingFromOrgRow(DbDataReader reader)
        {
            if (reader["billing_period"] == DBNull.Value)
                return CreateDefaultPricingConfig();

            return MapPricingFromReader(reader);
        }

        private static async Task<PlatformStudentPricingConfig> GetOrganizationPlatformPricingAsync(IDb db, string orgId)
        {
            const string sql = @"
                SELECT billing_period, currency_code, amount_per_student_yearly, term_amounts
                FROM organization_platform_pricing
                WHERE organization_id = @organization_id
                LIMIT 1";

            try
            {
                var cmd = db.GetCommand(sql);
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                using var reader = await db.Execute(cmd);
                if (await reader.ReadAsync())
                    return MapPricingFromReader(reader);
            }
            catch
            {
                /* table may not exist yet */
            }

            return CreateDefaultPricingConfig();
        }

        private static string NormalizeBillingPeriod(string value)
        {
            var v = (value ?? "").Trim().ToLowerInvariant();
            return v == "per_term" ? "per_term" : "per_year";
        }

        private static List<PlatformStudentPricingTermItem> SanitizeTermAmounts(List<PlatformStudentPricingTermItem> input)
        {
            if (input == null || input.Count == 0)
                return DefaultTermAmounts();

            var list = new List<PlatformStudentPricingTermItem>();
            foreach (var row in input)
            {
                var label = (row.label ?? "").Trim();
                if (string.IsNullOrWhiteSpace(label))
                    continue;
                list.Add(new PlatformStudentPricingTermItem
                {
                    label = label,
                    amount = row.amount,
                });
            }

            return list.Count > 0 ? list : DefaultTermAmounts();
        }

        private static List<PlatformStudentPricingTermItem> DefaultTermAmounts()
        {
            return new List<PlatformStudentPricingTermItem>
            {
                new() { label = "1st Term", amount = 0 },
                new() { label = "2nd Term", amount = 0 },
                new() { label = "3rd Term", amount = 0 },
            };
        }

        private static PlatformStudentPricingConfig MapPricingFromReader(DbDataReader reader)
        {
            var config = new PlatformStudentPricingConfig
            {
                billingperiod = NormalizeBillingPeriod(reader["billing_period"]?.ToString() ?? "per_year"),
                currencycode = reader["currency_code"]?.ToString()?.Trim() ?? "INR",
                amountperstudentyearly = reader["amount_per_student_yearly"] == DBNull.Value
                    ? 0
                    : Convert.ToDecimal(reader["amount_per_student_yearly"], CultureInfo.InvariantCulture),
            };

            var json = reader["term_amounts"] == DBNull.Value ? "[]" : reader["term_amounts"].ToString() ?? "[]";
            try
            {
                config.termamounts = JsonSerializer.Deserialize<List<PlatformStudentPricingTermItem>>(json)
                    ?? DefaultTermAmounts();
            }
            catch
            {
                config.termamounts = DefaultTermAmounts();
            }

            if (config.termamounts.Count == 0)
                config.termamounts = DefaultTermAmounts();

            return config;
        }

        private static async Task<bool> IsSuperAdminByEmailAsync(IDb db, string email)
        {
            const string sql = @"
                SELECT COALESCE(isfactory, false) AS isfactory
                FROM users
                WHERE lower(trim(email)) = lower(trim(@email))
                  AND is_active = true
                LIMIT 1";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;

            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return false;

            return reader["isfactory"] != DBNull.Value && Convert.ToBoolean(reader["isfactory"]);
        }

        private string ResolveOrganizationId(string organizationId, long organisationId)
        {
            var org = organizationId?.Trim() ?? "";
            if (!string.IsNullOrWhiteSpace(org))
                return org;
            if (organisationId > 0)
                return organisationId.ToString(CultureInfo.InvariantCulture);
            if (requeststate.usercontext?.organisationid > 0)
                return requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            return "";
        }

        private static double ParseAttendanceRate(string value)
        {
            if (string.IsNullOrWhiteSpace(value) || value == "—")
                return 0;
            var numeric = value.Trim().TrimEnd('%');
            return double.TryParse(numeric, NumberStyles.Any, CultureInfo.InvariantCulture, out var rate) ? rate : 0;
        }

        private static async Task<long> ExecuteCountAsync(IDb db, string sql, string orgId, params (string name, string value)[] extraParams)
        {
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            foreach (var (name, value) in extraParams)
            {
                db.AddParameter(cmd, name, DbTypes.Types.String).Value = value ?? "";
            }
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return reader[0] == DBNull.Value ? 0 : Convert.ToInt64(reader[0]);
            return 0;
        }

        private static async Task<string> GetTodayAttendanceRateAsync(IDb db, string orgId)
        {
            const string sql = @"
                SELECT
                    COUNT(*) FILTER (
                        WHERE lower(status) IN ('present', 'ref_att_stat_001')
                    ) AS present_count,
                    COUNT(*) AS total_count
                FROM attendance
                WHERE organization_id = @organization_id
                  AND isactive = true
                  AND type = 'student'
                  AND date = CURRENT_DATE";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return "—";

            var present = reader["present_count"] == DBNull.Value ? 0 : Convert.ToInt64(reader["present_count"]);
            var total = reader["total_count"] == DBNull.Value ? 0 : Convert.ToInt64(reader["total_count"]);
            if (total <= 0)
                return "—";

            var rate = (int)Math.Round(100.0 * present / total, MidpointRounding.AwayFromZero);
            return $"{rate}%";
        }

        private static async Task<List<AdminDashboardActivityItem>> GetRecentActivitiesAsync(IDb db, string orgId)
        {
            const string sql = @"
                SELECT action, name, created_at
                FROM (
                    (
                        SELECT
                            'New student enrolled' AS action,
                            COALESCE(
                                NULLIF(full_name, ''),
                                NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), ''),
                                student_id,
                                id
                            ) AS name,
                            created_at
                        FROM students
                        WHERE organization_id = @organization_id
                          AND is_active = true
                        ORDER BY created_at DESC
                        LIMIT 5
                    )
                    UNION ALL
                    (
                        SELECT
                            'Staff added' AS action,
                            COALESCE(
                                NULLIF(full_name, ''),
                                NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))), ''),
                                staff_id,
                                id
                            ) AS name,
                            created_at
                        FROM staff
                        WHERE organization_id = @organization_id
                          AND is_active = true
                        ORDER BY created_at DESC
                        LIMIT 5
                    )
                ) recent
                ORDER BY created_at DESC
                LIMIT 4";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;

            var activities = new List<AdminDashboardActivityItem>();
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                var createdAt = reader["created_at"] == DBNull.Value
                    ? DateTime.UtcNow
                    : Convert.ToDateTime(reader["created_at"]);

                activities.Add(new AdminDashboardActivityItem
                {
                    action = reader["action"]?.ToString() ?? "",
                    name = reader["name"]?.ToString() ?? "",
                    timeago = FormatTimeAgo(createdAt),
                });
            }
            return activities;
        }

        private static string FormatTimeAgo(DateTime timestamp)
        {
            var utcTimestamp = timestamp.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(timestamp, DateTimeKind.Utc)
                : timestamp.ToUniversalTime();
            var diff = DateTime.UtcNow - utcTimestamp;
            if (diff.TotalMinutes < 1) return "just now";
            if (diff.TotalMinutes < 60)
            {
                var mins = (int)Math.Floor(diff.TotalMinutes);
                return $"{mins} min{(mins == 1 ? "" : "s")} ago";
            }
            if (diff.TotalHours < 24)
            {
                var hrs = (int)Math.Floor(diff.TotalHours);
                return $"{hrs} hour{(hrs == 1 ? "" : "s")} ago";
            }
            var days = (int)Math.Floor(diff.TotalDays);
            return $"{days} day{(days == 1 ? "" : "s")} ago";
        }

        // --- Config ---

        public async Task<List<DashboardConfig>> SelectConfig(DashboardConfigSelectReq req)
        {
            List<DashboardConfig> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectConfigTransaction(db, req);
            }
            return result;
        }

        public async Task<List<DashboardConfig>> SelectConfigTransaction(IDb db, DashboardConfigSelectReq req)
        {
            List<DashboardConfig> result = new List<DashboardConfig>();
            string query = @"
                SELECT 
                    id, organisationid, role, layout, widgets,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, attributes
                FROM DashboardConfig
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
             if (!string.IsNullOrEmpty(req.role))
            {
                queryBuilder.AddParameter("role", "=", "role", req.role, DbTypes.Types.String);
            }

            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    DashboardConfig temp = new DashboardConfig();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.role = reader["role"] == DBNull.Value ? "" : reader["role"].ToString();
                    temp.layout = reader["layout"] == DBNull.Value ? "" : reader["layout"].ToString();
                    temp.widgets_json = reader["widgets"] == DBNull.Value ? "[]" : reader["widgets"].ToString();
                    
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<DashboardConfig> InsertConfig(DashboardConfig config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertConfigTransaction(db, config);
            }
            return config;
        }

        public async Task InsertConfigTransaction(IDb db, DashboardConfig config)
        {
            string query = @"
                INSERT INTO DashboardConfig (
                    organisationid, role, layout, widgets,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, attributes
                )
                VALUES (
                    @organisationid, @role, @layout, @widgets,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @attributes
                )
                RETURNING id;
            ";

            config.isactive = true;
            config.version = 1;
            config.createdon = DateTime.UtcNow;
            config.createdby = requeststate.usercontext.id;
            config.modifiedon = DateTime.UtcNow;
            config.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = config.organisationid;
            db.AddParameter(command, "role", DbTypes.Types.String).Value = config.role ?? "";
            db.AddParameter(command, "layout", DbTypes.Types.String).Value = config.layout ?? "";
            db.AddParameter(command, "widgets", DbTypes.Types.Json).Value = config.widgets_json ?? "[]";
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = config.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = config.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = config.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = config.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = config.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = config.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = config.issuspended;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = config.attributes_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    config.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        
         public async Task<DashboardConfig> UpdateConfig(DashboardConfig config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateConfigTransaction(db, config);
            }
            return config;
        }

        public async Task<bool> UpdateConfigTransaction(IDb db, DashboardConfig config)
        {
            bool result = false;
            string query = @"
                UPDATE DashboardConfig
                SET 
                    organisationid = @organisationid, role = @role, layout = @layout, widgets = @widgets,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, attributes = @attributes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            config.modifiedon = DateTime.UtcNow;
            config.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = config.id;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = config.organisationid;
            db.AddParameter(command, "role", DbTypes.Types.String).Value = config.role ?? "";
            db.AddParameter(command, "layout", DbTypes.Types.String).Value = config.layout ?? "";
            db.AddParameter(command, "widgets", DbTypes.Types.Json).Value = config.widgets_json ?? "[]";
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = config.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = config.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = config.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = config.issuspended;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                config.version = config.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> DeleteConfig(DashboardConfigDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteConfigTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteConfigTransaction(IDb db, DashboardConfigDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE DashboardConfig
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby
                WHERE id = @id
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
    }
}
