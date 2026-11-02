using System.Text.Json;
using System.Text.RegularExpressions;
using Campusza.Models.Campusza;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public class OrganizationRegistrationService
    {
        private readonly IDbProvider dbprovider;
        private readonly CustomCryptography cryptography;

        public OrganizationRegistrationService(IDbProvider dbprovider, CustomCryptography cryptography)
        {
            this.dbprovider = dbprovider;
            this.cryptography = cryptography;
        }

        public async Task<OrganizationRegistrationRes> Register(OrganizationRegistrationReq req)
        {
            ValidateReq(req);

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();

                try
                {
                    if (await EmailExists(db, req.adminEmail))
                        throw new AppException(AppException.ErrorCodes.UsersDuplicate, "Admin email already registered.");

                    string slugBase = NormalizeSlug(req.organizationName);
                    string slug = await EnsureUniqueSlug(db, slugBase);

                    string orgId = Guid.NewGuid().ToString();
                    string userId = Guid.NewGuid().ToString();

                    await InsertOrganization(db, req, orgId, slug);
                    await InsertAdminUser(db, req, orgId, userId);

                    await db.CommitTransaction();

                    return new OrganizationRegistrationRes
                    {
                        organizationId = orgId,
                        adminUserId = userId,
                        slug = slug
                    };
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
        }

        private static void ValidateReq(OrganizationRegistrationReq req)
        {
            if (string.IsNullOrWhiteSpace(req.organizationName))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization name is required.");
            if (string.IsNullOrWhiteSpace(req.organizationType))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization type is required.");
            if (string.IsNullOrWhiteSpace(req.address))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Address is required.");
            if (string.IsNullOrWhiteSpace(req.city))
                throw new AppException(AppException.ErrorCodes.BadRequest, "City is required.");
            if (string.IsNullOrWhiteSpace(req.state))
                throw new AppException(AppException.ErrorCodes.BadRequest, "State is required.");
            if (string.IsNullOrWhiteSpace(req.country))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Country is required.");
            if (string.IsNullOrWhiteSpace(req.phone))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Phone is required.");
            if (string.IsNullOrWhiteSpace(req.adminFirstName))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Admin first name is required.");
            if (string.IsNullOrWhiteSpace(req.adminLastName))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Admin last name is required.");
            if (string.IsNullOrWhiteSpace(req.adminEmail))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Admin email is required.");
            if (string.IsNullOrWhiteSpace(req.adminPassword))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Admin password is required.");
        }

        private static string NormalizeSlug(string name)
        {
            var slug = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
            return string.IsNullOrWhiteSpace(slug) ? "org" : slug;
        }

        private async Task<string> EnsureUniqueSlug(IDb db, string slugBase)
        {
            string slug = slugBase;
            int attempt = 1;

            while (await SlugExists(db, slug))
            {
                attempt += 1;
                slug = $"{slugBase}-{attempt}";
            }

            return slug;
        }

        private static async Task<bool> SlugExists(IDb db, string slug)
        {
            string query = @"SELECT 1 FROM organizations WHERE slug = @slug LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "slug", DbTypes.Types.String).Value = slug;

            using (var reader = await db.Execute(cmd))
            {
                return await reader.ReadAsync();
            }
        }

        private static async Task<bool> EmailExists(IDb db, string email)
        {
            string query = @"SELECT 1 FROM users WHERE lower(email) = lower(@email) LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;

            using (var reader = await db.Execute(cmd))
            {
                return await reader.ReadAsync();
            }
        }

        private async Task InsertOrganization(IDb db, OrganizationRegistrationReq req, string orgId, string slug)
        {
            string query = @"
                INSERT INTO organizations (
                    id, name, slug, email, phone,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    logo_url, website, type, status,
                    subscription_plan, subscription_start_date, subscription_end_date,
                    max_users, max_students, current_users, current_students,
                    settings, is_active, created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @id, @name, @slug, @email, @phone,
                    @address_street, @address_city, @address_state, @address_zip_code, @address_country,
                    @logo_url, @website, @type, @status,
                    @subscription_plan, @subscription_start_date, @subscription_end_date,
                    @max_users, @max_students, @current_users, @current_students,
                    @settings, @is_active, @created_at, @updated_at, @created_by, @updated_by
                );
            ";

            var cmd = db.GetCommand(query);

            DateTime now = DateTime.UtcNow;
            int maxStudents = ParseMaxStudents(req.studentCount);

            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.organizationName.Trim();
            db.AddParameter(cmd, "slug", DbTypes.Types.String).Value = slug;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = req.adminEmail.Trim();
            db.AddParameter(cmd, "phone", DbTypes.Types.String).Value = req.phone.Trim();

            db.AddParameter(cmd, "address_street", DbTypes.Types.String).Value = req.address.Trim();
            db.AddParameter(cmd, "address_city", DbTypes.Types.String).Value = req.city.Trim();
            db.AddParameter(cmd, "address_state", DbTypes.Types.String).Value = req.state.Trim();
            db.AddParameter(cmd, "address_zip_code", DbTypes.Types.String).Value = "";
            db.AddParameter(cmd, "address_country", DbTypes.Types.String).Value = req.country.Trim();

            db.AddParameter(cmd, "logo_url", DbTypes.Types.String).Value = "";
            db.AddParameter(cmd, "website", DbTypes.Types.String).Value = req.website ?? "";
            db.AddParameter(cmd, "type", DbTypes.Types.String).Value = MapOrganizationType(req.organizationType);
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = "trial";

            db.AddParameter(cmd, "subscription_plan", DbTypes.Types.String).Value = "free";
            db.AddParameter(cmd, "subscription_start_date", DbTypes.Types.Date).Value = now.Date;
            db.AddParameter(cmd, "subscription_end_date", DbTypes.Types.Date).Value = DBNull.Value;

            db.AddParameter(cmd, "max_users", DbTypes.Types.Integer).Value = 10;
            db.AddParameter(cmd, "max_students", DbTypes.Types.Integer).Value = maxStudents;
            db.AddParameter(cmd, "current_users", DbTypes.Types.Integer).Value = 1;
            db.AddParameter(cmd, "current_students", DbTypes.Types.Integer).Value = 0;

            db.AddParameter(cmd, "settings", DbTypes.Types.Json).Value = BuildDefaultSettingsJson();
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = req.adminEmail.Trim();
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = req.adminEmail.Trim();

            await db.ExecuteNonQuery(cmd);
        }

        private async Task InsertAdminUser(IDb db, OrganizationRegistrationReq req, string orgId, string userId)
        {
            string query = @"
                INSERT INTO users (
                    id, email, username, password_hash,
                    role, status, organization_id, profile_id,
                    last_login_at, last_login_ip,
                    email_verified, email_verified_at, two_factor_enabled,
                    is_active, created_at, updated_at, created_by
                )
                VALUES (
                    @id, @email, @username, @password_hash,
                    @role, @status, @organization_id, @profile_id,
                    @last_login_at, @last_login_ip,
                    @email_verified, @email_verified_at, @two_factor_enabled,
                    @is_active, @created_at, @updated_at, @created_by
                );
            ";

            var cmd = db.GetCommand(query);

            DateTime now = DateTime.UtcNow;
            string email = req.adminEmail.Trim();
            string username = BuildUsername(req);

            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = username;
            db.AddParameter(cmd, "password_hash", DbTypes.Types.String).Value = cryptography.CalculateSHA256Hash(req.adminPassword);

            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = "admin";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = "active";
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "profile_id", DbTypes.Types.String).Value = userId;

            db.AddParameter(cmd, "last_login_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "last_login_ip", DbTypes.Types.String).Value = "";
            db.AddParameter(cmd, "email_verified", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(cmd, "email_verified_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "two_factor_enabled", DbTypes.Types.Boolean).Value = false;

            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = email;

            await db.ExecuteNonQuery(cmd);
        }

        private static string MapOrganizationType(string value)
        {
            string normalized = value?.Trim().ToLowerInvariant() ?? "";
            return normalized switch
            {
                "primary" => "school",
                "secondary" => "school",
                "high" => "school",
                "college" => "college",
                "university" => "university",
                "coaching" => "training_center",
                "vocational" => "training_center",
                "school" => "school",
                "training_center" => "training_center",
                _ => "other"
            };
        }

        private static int ParseMaxStudents(string studentCount)
        {
            if (string.IsNullOrWhiteSpace(studentCount))
                return 0;

            string trimmed = studentCount.Trim();
            if (trimmed.EndsWith("+", StringComparison.Ordinal))
            {
                if (int.TryParse(trimmed.TrimEnd('+'), out int min))
                    return min;
            }

            var parts = trimmed.Split('-', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 2 && int.TryParse(parts[1], out int max))
                return max;

            return 0;
        }

        private static string BuildUsername(OrganizationRegistrationReq req)
        {
            string first = req.adminFirstName?.Trim() ?? "";
            string last = req.adminLastName?.Trim() ?? "";
            string combined = $"{first}.{last}".Trim('.').ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(combined))
                return combined;

            if (!string.IsNullOrWhiteSpace(req.adminEmail))
            {
                var parts = req.adminEmail.Split('@');
                if (parts.Length > 0 && !string.IsNullOrWhiteSpace(parts[0]))
                    return parts[0].ToLowerInvariant();
            }

            return "admin";
        }

        private static string BuildDefaultSettingsJson()
        {
            var settings = new
            {
                academicYear = "",
                termsPerYear = 2,
                dateFormat = "YYYY-MM-DD",
                timeFormat = "24h",
                timezone = "UTC",
                currency = "USD",
                language = "en",
                allowStudentRegistration = false,
                allowParentPortal = true,
                attendanceAutoMark = false,
                emailNotifications = new
                {
                    enabled = false,
                    attendanceAlerts = false,
                    gradeAlerts = false,
                    feeReminders = false,
                    generalAnnouncements = false
                },
                smsNotifications = new
                {
                    enabled = false,
                    attendanceAlerts = false,
                    feeReminders = false
                },
                features = new
                {
                    attendance = true,
                    grades = true,
                    fees = true,
                    certificates = true,
                    reports = true,
                    schedule = true
                }
            };

            return JsonSerializer.Serialize(settings);
        }
    }
}
