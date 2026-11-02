using System;
using System.Data.Common;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Campusza.Models.Campusza;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public class StudentUserService
    {
        private readonly IDbProvider dbprovider;
        private readonly CustomCryptography cryptography;

        public StudentUserService(IDbProvider dbprovider, CustomCryptography cryptography)
        {
            this.dbprovider = dbprovider;
            this.cryptography = cryptography;
        }

        /// <summary>
        /// Creates or updates student login: mobile + password (date of birth, yyyy-MM-dd).
        /// </summary>
        public Task CreateUserForStudentTransaction(IDb db, Student student, string actor)
            => SyncStudentLoginTransaction(db, student, actor);

        public async Task SyncStudentLogin(Student student, string actor)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await SyncStudentLoginTransaction(db, student, actor);
        }

        public async Task SyncStudentLoginTransaction(IDb db, Student student, string actor)
        {
            string mobile = NormalizeMobile(student.phone);
            if (string.IsNullOrWhiteSpace(mobile))
                return;

            if (string.IsNullOrWhiteSpace(student.id) || string.IsNullOrWhiteSpace(student.organizationid))
                return;

            if (!TryFormatDobPassword(student.dateofbirth, out string dobPassword))
                return;

            string passwordHash = cryptography.CalculateSHA256Hash(dobPassword);
            string email = BuildStudentEmail(student.id);
            string username = mobile;
            DateTime now = DateTime.UtcNow;

            string? existingUserId = await FindUserIdByProfileTransaction(db, student.id);
            if (string.IsNullOrWhiteSpace(existingUserId))
                existingUserId = await FindUserIdByMobileTransaction(db, mobile, student.organizationid);

            if (!string.IsNullOrWhiteSpace(existingUserId))
            {
                string updateQuery = @"
                    UPDATE users
                    SET email = @email,
                        username = @username,
                        password_hash = @password_hash,
                        mobile = @mobile,
                        profile_id = @profile_id,
                        role = 'student',
                        status = 'active',
                        otp_expires_at = NULL,
                        updated_at = @updated_at
                    WHERE id = @id
                      AND is_active = true;
                ";
                var updateCmd = db.GetCommand(updateQuery);
                db.AddParameter(updateCmd, "id", DbTypes.Types.String).Value = existingUserId;
                db.AddParameter(updateCmd, "email", DbTypes.Types.String).Value = email;
                db.AddParameter(updateCmd, "username", DbTypes.Types.String).Value = username;
                db.AddParameter(updateCmd, "password_hash", DbTypes.Types.String).Value = passwordHash;
                db.AddParameter(updateCmd, "mobile", DbTypes.Types.String).Value = mobile;
                db.AddParameter(updateCmd, "profile_id", DbTypes.Types.String).Value = student.id;
                db.AddParameter(updateCmd, "updated_at", DbTypes.Types.DateTime).Value = now;
                await db.ExecuteNonQuery(updateCmd);
                student.loginmobile = mobile;
                return;
            }

            string userId = Guid.NewGuid().ToString();
            string insertQuery = @"
                INSERT INTO users (
                    id, email, username, password_hash,
                    role, status, organization_id, profile_id,
                    mobile, otp_expires_at,
                    last_login_at, last_login_ip,
                    email_verified, email_verified_at, two_factor_enabled,
                    is_active, created_at, updated_at, created_by
                )
                VALUES (
                    @id, @email, @username, @password_hash,
                    @role, @status, @organization_id, @profile_id,
                    @mobile, @otp_expires_at,
                    @last_login_at, @last_login_ip,
                    @email_verified, @email_verified_at, @two_factor_enabled,
                    @is_active, @created_at, @updated_at, @created_by
                );
            ";

            var cmd = db.GetCommand(insertQuery);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = username;
            db.AddParameter(cmd, "password_hash", DbTypes.Types.String).Value = passwordHash;
            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = "student";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = "active";
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = student.organizationid;
            db.AddParameter(cmd, "profile_id", DbTypes.Types.String).Value = student.id;
            db.AddParameter(cmd, "mobile", DbTypes.Types.String).Value = mobile;
            db.AddParameter(cmd, "otp_expires_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "last_login_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "last_login_ip", DbTypes.Types.String).Value = "";
            db.AddParameter(cmd, "email_verified", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(cmd, "email_verified_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "two_factor_enabled", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = actor ?? "system";

            await db.ExecuteNonQuery(cmd);
            student.loginmobile = mobile;
        }

        public static string NormalizeMobile(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return "";

            string digits = Regex.Replace(phone, @"\D", "");
            if (digits.Length >= 10)
                return digits[^10..];
            return digits;
        }

        public static string FormatDobPassword(DateTime dob)
        {
            return dob.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }

        public static bool TryFormatDobPassword(DateTime dob, out string normalized)
        {
            normalized = "";
            if (dob == DateTime.MinValue || dob.Year < 1900)
                return false;
            normalized = FormatDobPassword(dob);
            return true;
        }

        public static bool TryNormalizeDobPassword(string? input, out string normalized)
        {
            normalized = "";
            if (string.IsNullOrWhiteSpace(input))
                return false;

            string trimmed = input.Trim();
            string[] formats =
            {
                "yyyy-MM-dd",
                "dd-MM-yyyy",
                "dd/MM/yyyy",
                "d-M-yyyy",
                "d/M/yyyy",
            };

            if (DateTime.TryParseExact(trimmed, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsed)
                || DateTime.TryParse(trimmed, CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
            {
                if (parsed.Year < 1900)
                    return false;
                normalized = FormatDobPassword(parsed);
                return true;
            }

            return false;
        }

        private static string BuildStudentEmail(string studentInternalId)
        {
            return $"student.{studentInternalId}@campusza.local";
        }

        private static async Task<string?> FindUserIdByProfileTransaction(IDb db, string profileId)
        {
            string query = @"
                SELECT id FROM users
                WHERE profile_id = @profile_id AND role = 'student' AND is_active = true
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "profile_id", DbTypes.Types.String).Value = profileId;
            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return reader["id"]?.ToString();
            return null;
        }

        private static async Task<string?> FindUserIdByMobileTransaction(IDb db, string mobile, string organizationId)
        {
            string query = @"
                SELECT id FROM users
                WHERE mobile = @mobile
                  AND organization_id = @organization_id
                  AND role = 'student'
                  AND is_active = true
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "mobile", DbTypes.Types.String).Value = mobile;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return reader["id"]?.ToString();
            return null;
        }
    }
}
