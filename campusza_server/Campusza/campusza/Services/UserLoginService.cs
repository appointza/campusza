using Campusza.Models.Campusza;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public class UserLoginService
    {
        private readonly IDbProvider dbprovider;
        private readonly CustomCryptography cryptography;

        public UserLoginService(IDbProvider dbprovider, CustomCryptography cryptography)
        {
            this.dbprovider = dbprovider;
            this.cryptography = cryptography;
        }

        public async Task<UserLoginRes> Login(UserLoginReq req)
        {
            if (string.IsNullOrWhiteSpace(req.email) || string.IsNullOrWhiteSpace(req.password))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Email and password are required.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                var user = await GetUserByEmail(db, req.email.Trim());
                if (user == null)
                    throw new AppException(AppException.ErrorCodes.InvalidCredential, "Invalid email or password.");

                string passwordHash = cryptography.CalculateSHA256Hash(req.password);
                if (!string.Equals(user.passwordHash, passwordHash, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.InvalidCredential, "Invalid email or password.");

                if (!string.Equals(user.status, "active", StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.InvalidCredential, "User is not active.");

                if (user.passwordSetupRequired)
                    throw new AppException(AppException.ErrorCodes.InvalidCredential, "Complete account setup using the link sent to your email before signing in.");

                var org = await GetOrganization(db, user.organizationId);

                string staffId = await ResolveStaffIdForLoginAsync(db, user);

                var effectiveRole = await ResolveEffectiveLoginRoleAsync(db, user, staffId);

                return new UserLoginRes
                {
                    userId = user.id,
                    email = user.email,
                    role = effectiveRole,
                    organizationId = user.organizationId,
                    organizationName = org?.Name ?? "",
                    organizationSlug = org?.Slug ?? "",
                    staffId = staffId,
                    isfactory = user.isFactory
                };
            }
        }

        public async Task<UserLoginRes> LoginWithMobile(UserMobileLoginReq req)
        {
            string mobile = StudentUserService.NormalizeMobile(req.mobile);
            if (string.IsNullOrWhiteSpace(mobile) || string.IsNullOrWhiteSpace(req.password))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Mobile number and date of birth are required.");

            if (!StudentUserService.TryNormalizeDobPassword(req.password, out string dobPassword))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Enter a valid date of birth.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var user = await GetStudentUserByMobile(db, mobile, req.organizationid?.Trim());
            if (user == null)
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "Invalid mobile number or date of birth.");

            string passwordHash = cryptography.CalculateSHA256Hash(dobPassword);
            if (!string.Equals(user.passwordHash, passwordHash, StringComparison.OrdinalIgnoreCase))
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "Invalid mobile number or date of birth.");

            if (!string.Equals(user.status, "active", StringComparison.OrdinalIgnoreCase))
                throw new AppException(AppException.ErrorCodes.InvalidCredential, "User is not active.");

            var org = await GetOrganization(db, user.organizationId);

            return new UserLoginRes
            {
                userId = user.id,
                email = user.email,
                role = user.role,
                organizationId = user.organizationId,
                organizationName = org?.Name ?? "",
                organizationSlug = org?.Slug ?? "",
                studentId = user.profileId,
                mobile = mobile
            };
        }

        public async Task<UserLoginRes> UpdateProfile(UserProfileUpdateReq req)
        {
            if (string.IsNullOrWhiteSpace(req.userId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "User id is required.");
            if (string.IsNullOrWhiteSpace(req.currentPassword))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Current password is required.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                var user = await GetUserById(db, req.userId.Trim());
                if (user == null)
                    throw new AppException(AppException.ErrorCodes.UserNotFound, "User not found.");

                string currentHash = cryptography.CalculateSHA256Hash(req.currentPassword);
                if (!string.Equals(user.passwordHash, currentHash, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.InvalidCredential, "Current password is incorrect.");

                string targetEmail = user.email;
                if (!string.IsNullOrWhiteSpace(req.newEmail))
                {
                    targetEmail = req.newEmail.Trim();
                    if (targetEmail.Length < 3 || targetEmail.IndexOf('@') < 1)
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Enter a valid email address.");
                    if (!targetEmail.Equals(user.email, StringComparison.OrdinalIgnoreCase)
                        && await EmailTakenByAnotherUser(db, targetEmail, user.id))
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest, "That email is already in use.");
                    }
                }

                string targetPasswordHash = user.passwordHash;
                if (!string.IsNullOrWhiteSpace(req.newPassword))
                {
                    if (req.newPassword.Length < 6)
                        throw new AppException(AppException.ErrorCodes.BadRequest, "New password must be at least 6 characters.");
                    targetPasswordHash = cryptography.CalculateSHA256Hash(req.newPassword);
                }

                string targetUsername = UsernameFromEmail(targetEmail);

                await UpdateUserProfileRow(db, user.id, targetEmail, targetUsername, targetPasswordHash);

                if (IsStaffLinkedUserRole(user.role)
                    && !string.IsNullOrWhiteSpace(user.profileId))
                {
                    await SyncStaffEmail(db, user.profileId, user.organizationId, targetEmail);
                }

                var org = await GetOrganization(db, user.organizationId);
                string staffId = await ResolveStaffIdForLoginAsync(db, user);
                var effectiveRole = await ResolveEffectiveLoginRoleAsync(db, user, staffId);

                return new UserLoginRes
                {
                    userId = user.id,
                    email = targetEmail,
                    role = effectiveRole,
                    organizationId = user.organizationId,
                    organizationName = org?.Name ?? "",
                    organizationSlug = org?.Slug ?? "",
                    staffId = staffId,
                    isfactory = user.isFactory
                };
            }
        }

        private sealed class UserRow
        {
            public string id { get; set; } = "";
            public string email { get; set; } = "";
            public string role { get; set; } = "";
            public string status { get; set; } = "";
            public string organizationId { get; set; } = "";
            public string passwordHash { get; set; } = "";
            public string profileId { get; set; } = "";
            public string username { get; set; } = "";
            public DateTime? otpExpiresAt { get; set; }
            public bool passwordSetupRequired { get; set; }
            public bool isFactory { get; set; }
        }

        private static async Task<UserRow?> GetStudentUserByMobile(IDb db, string mobile, string organizationId)
        {
            string query = @"
                SELECT id, email, role, status, organization_id, password_hash, profile_id, username, otp_expires_at,
                       COALESCE(password_setup_required, false) AS password_setup_required,
                       COALESCE(isfactory, false) AS isfactory
                FROM users
                WHERE mobile = @mobile
                  AND role = 'student'
                  AND is_active = true
            ";
            if (!string.IsNullOrWhiteSpace(organizationId))
                query += " AND organization_id = @organization_id";
            query += " LIMIT 1;";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "mobile", DbTypes.Types.String).Value = mobile;
            if (!string.IsNullOrWhiteSpace(organizationId))
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;

            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return MapUserRow(reader);
            return null;
        }

        private static async Task<UserRow?> GetUserByEmail(IDb db, string email)
        {
            string query = @"
                SELECT id, email, role, status, organization_id, password_hash, profile_id, username, otp_expires_at,
                       COALESCE(password_setup_required, false) AS password_setup_required,
                       COALESCE(isfactory, false) AS isfactory
                FROM users
                WHERE lower(email) = lower(@email)
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    return MapUserRow(reader);
                }
            }

            return null;
        }

        private static async Task<UserRow?> GetUserById(IDb db, string userId)
        {
            string query = @"
                SELECT id, email, role, status, organization_id, password_hash, profile_id, username, otp_expires_at,
                       COALESCE(password_setup_required, false) AS password_setup_required,
                       COALESCE(isfactory, false) AS isfactory
                FROM users
                WHERE id = @id
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = userId;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                    return MapUserRow(reader);
            }

            return null;
        }

        private static UserRow MapUserRow(System.Data.Common.DbDataReader reader)
        {
            DateTime? otpExpires = null;
            try
            {
                int idx = reader.GetOrdinal("otp_expires_at");
                if (reader[idx] != DBNull.Value)
                    otpExpires = Convert.ToDateTime(reader[idx]);
            }
            catch (IndexOutOfRangeException)
            {
                // Column may be missing before migration.
            }

            bool passwordSetupRequired = false;
            try
            {
                int psIdx = reader.GetOrdinal("password_setup_required");
                if (reader[psIdx] != DBNull.Value)
                    passwordSetupRequired = Convert.ToBoolean(reader[psIdx]);
            }
            catch (IndexOutOfRangeException)
            {
            }

            bool isFactory = false;
            try
            {
                int fIdx = reader.GetOrdinal("isfactory");
                if (reader[fIdx] != DBNull.Value)
                    isFactory = Convert.ToBoolean(reader[fIdx]);
            }
            catch (IndexOutOfRangeException)
            {
            }

            return new UserRow
            {
                id = reader["id"]?.ToString() ?? "",
                email = reader["email"]?.ToString() ?? "",
                role = reader["role"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "",
                organizationId = reader["organization_id"]?.ToString() ?? "",
                passwordHash = reader["password_hash"]?.ToString() ?? "",
                profileId = reader["profile_id"]?.ToString() ?? "",
                username = reader["username"]?.ToString() ?? "",
                otpExpiresAt = otpExpires,
                passwordSetupRequired = passwordSetupRequired,
                isFactory = isFactory
            };
        }

        private static string UsernameFromEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return "";
            int at = email.IndexOf('@');
            string local = at > 0 ? email.Substring(0, at) : email;
            local = local.Trim().Replace(" ", "_", StringComparison.Ordinal);
            return local.Length > 0 ? local : email;
        }

        private static async Task<bool> EmailTakenByAnotherUser(IDb db, string email, string excludeUserId)
        {
            string query = @"
                SELECT id FROM users
                WHERE lower(email) = lower(@email)
                  AND id <> @exclude_id
                  AND is_active = true
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "exclude_id", DbTypes.Types.String).Value = excludeUserId;

            using (var reader = await db.Execute(cmd))
            {
                return await reader.ReadAsync();
            }
        }

        private static async Task UpdateUserProfileRow(IDb db, string userId, string email, string username, string passwordHash)
        {
            string query = @"
                UPDATE users
                SET email = @email,
                    username = @username,
                    password_hash = @password_hash,
                    updated_at = @updated_at
                WHERE id = @id
                  AND is_active = true;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = username ?? "";
            db.AddParameter(cmd, "password_hash", DbTypes.Types.String).Value = passwordHash ?? "";
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            await db.ExecuteNonQuery(cmd);
        }

        private static async Task SyncStaffEmail(IDb db, string staffId, string organizationId, string email)
        {
            if (string.IsNullOrWhiteSpace(staffId) || string.IsNullOrWhiteSpace(organizationId))
                return;

            string query = @"
                UPDATE staff
                SET email = @email,
                    updated_at = @updated_at
                WHERE staff_id = @staff_id
                  AND organization_id = @organization_id
                  AND is_active = true;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email.Trim();
            db.AddParameter(cmd, "staff_id", DbTypes.Types.String).Value = staffId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            await db.ExecuteNonQuery(cmd);
        }

        private static async Task<(string Name, string Slug)?> GetOrganization(IDb db, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                return null;

            string query = @"
                SELECT name, slug
                FROM organizations
                WHERE id = @id
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = organizationId;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    return (
                        reader["name"]?.ToString() ?? "",
                        reader["slug"]?.ToString() ?? ""
                    );
                }
            }

            return null;
        }

        /// <summary>Look up staff.id by email and organization_id for staff login.</summary>
        private static async Task<string?> GetStaffIdByEmailAndOrg(IDb db, string email, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(organizationId))
                return null;

            string query = @"
                SELECT staff_id
                FROM staff
                WHERE lower(email) = lower(@email)
                  AND organization_id = @organization_id
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    var id = reader["staff_id"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(id))
                        return id;
                }
            }

            return null;
        }

        private static bool IsStaffLinkedUserRole(string role)
        {
            return string.Equals(role, "staff", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "admin_staff", StringComparison.OrdinalIgnoreCase);
        }

        private static async Task<string> ResolveStaffIdForLoginAsync(IDb db, UserRow user)
        {
            if (!IsStaffLinkedUserRole(user.role))
                return "";

            var fromEmail = await GetStaffIdByEmailAndOrg(db, user.email, user.organizationId);
            if (!string.IsNullOrWhiteSpace(fromEmail))
                return fromEmail;

            if (!string.IsNullOrWhiteSpace(user.profileId))
                return user.profileId.Trim();

            return "";
        }

        private static async Task<string?> GetStaffJobRoleAsync(IDb db, string organizationId, string staffId, string email)
        {
            if (!string.IsNullOrWhiteSpace(staffId))
            {
                const string byId = @"
                    SELECT role
                    FROM staff
                    WHERE staff_id = @staff_id
                      AND organization_id = @organization_id
                      AND is_active = true
                    LIMIT 1";

                var cmd = db.GetCommand(byId);
                db.AddParameter(cmd, "staff_id", DbTypes.Types.String).Value = staffId;
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;

                using var reader = await db.Execute(cmd);
                if (await reader.ReadAsync())
                    return reader["role"]?.ToString()?.Trim();
            }

            if (string.IsNullOrWhiteSpace(email))
                return null;

            const string byEmail = @"
                SELECT role
                FROM staff
                WHERE lower(email) = lower(@email)
                  AND organization_id = @organization_id
                  AND is_active = true
                LIMIT 1";

            var emailCmd = db.GetCommand(byEmail);
            db.AddParameter(emailCmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(emailCmd, "organization_id", DbTypes.Types.String).Value = organizationId;

            using var emailReader = await db.Execute(emailCmd);
            if (await emailReader.ReadAsync())
                return emailReader["role"]?.ToString()?.Trim();

            return null;
        }

        private static async Task PersistUserRoleAsync(IDb db, string userId, string role)
        {
            const string sql = @"
                UPDATE users
                SET role = @role, updated_at = @updated_at
                WHERE id = @id";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = role;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private static async Task<string> ResolveEffectiveLoginRoleAsync(IDb db, UserRow user, string staffId)
        {
            if (user.isFactory)
                return user.role;

            if (string.Equals(user.role, "admin", StringComparison.OrdinalIgnoreCase))
                return "admin";

            if (string.Equals(user.role, "student", StringComparison.OrdinalIgnoreCase)
                || string.Equals(user.role, "parent", StringComparison.OrdinalIgnoreCase))
            {
                return user.role;
            }

            if (!IsStaffLinkedUserRole(user.role))
                return user.role;

            var jobRole = await GetStaffJobRoleAsync(db, user.organizationId, staffId, user.email);
            var effective = StaffUserRoleMapper.ResolveUserRoleForStaffSync(user.role, jobRole);

            if (!string.Equals(effective, user.role, StringComparison.OrdinalIgnoreCase))
                await PersistUserRoleAsync(db, user.id, effective);

            return effective;
        }

        public async Task<UserSuperAdminFlagRes> GetSuperAdminFlag(string email)
        {
            var trimmed = email?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(trimmed))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Email is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            return new UserSuperAdminFlagRes
            {
                isfactory = await IsSuperAdminByEmailAsync(db, trimmed),
            };
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
    }
}
