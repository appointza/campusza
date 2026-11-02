using Campusza.Models.Campusza;
using Campusza.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Campusza.Services.Campusza
{
    public class AuthenticationService
    {
        private const string GenericForgotMessage =
            "If an account exists for that email, you will receive password reset instructions shortly.";

        private readonly IDbProvider dbprovider;
        private readonly CustomCryptography cryptography;
        private readonly IEmailSender emailSender;
        private readonly EmailService emailService;
        private readonly IHttpContextAccessor httpContextAccessor;
        private readonly ILogger<AuthenticationService> logger;

        public AuthenticationService(
            IDbProvider dbprovider,
            CustomCryptography cryptography,
            IEmailSender emailSender,
            EmailService emailService,
            IHttpContextAccessor httpContextAccessor,
            ILogger<AuthenticationService> logger)
        {
            this.dbprovider = dbprovider;
            this.cryptography = cryptography;
            this.emailSender = emailSender;
            this.emailService = emailService;
            this.httpContextAccessor = httpContextAccessor;
            this.logger = logger;
        }

        public async Task IssueInitialSetupForUserAsync(
            IDb db,
            string userId,
            string email,
            string organizationId,
            string displayName,
            CancellationToken cancellationToken = default)
        {
            await InvalidateActiveChallengesAsync(db, userId, AuthVerificationPurposes.InitialSetup);
            string rawToken = AuthVerificationHelpers.GenerateUrlSafeToken();
            string hash = AuthVerificationHelpers.HashSecret(cryptography, rawToken);
            DateTime expires = DateTime.UtcNow.AddMinutes(AuthVerificationHelpers.SetupTokenValidityMinutes);
            await InsertChallengeAsync(db, userId, organizationId, email, AuthVerificationPurposes.InitialSetup, hash, expires, ResolveClientIp());

            if (!emailSender.IsConfigured())
            {
                logger.LogWarning("Initial setup email skipped for user {UserId}: SMTP not configured.", userId);
                return;
            }

            string frontendBase = emailService.ResolveFrontendBaseUrl();
            if (string.IsNullOrWhiteSpace(frontendBase))
                logger.LogWarning("ApplicationSettings:frontendBaseUrl is not set; setup links in email may be invalid.");

            string url = AuthVerificationHelpers.BuildFrontendPath(
                emailService.ResolveFrontendBaseUrl(),
                $"/auth/setup-password?token={Uri.EscapeDataString(rawToken)}");
            var tpl = AuthEmailTemplates.InitialSetup(displayName, url, AuthVerificationHelpers.SetupTokenValidityMinutes);
            try
            {
                await emailSender.SendAsync(email.Trim(), tpl.subject, tpl.html, tpl.text, cancellationToken);
                await MarkEmailVerifiedAsync(db, userId);
                logger.LogInformation("Initial setup email queued for user {UserId}.", userId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send initial setup email for user {UserId}.", userId);
            }
        }

        public async Task<ForgotPasswordRes> ForgotPasswordAsync(ForgotPasswordReq req, CancellationToken cancellationToken = default)
        {
            string email = req.email?.Trim() ?? "";
            if (email.Length < 3 || email.IndexOf('@') < 1)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Enter a valid email address.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var user = await FindPasswordRecoveryUserByEmailAsync(db, email);
            if (user != null)
            {
                await EnforceSendRateLimitAsync(db, $"email:{email.ToLowerInvariant()}:{AuthVerificationPurposes.PasswordReset}");
                await EnforceSendRateLimitAsync(db, $"ip:{ResolveClientIp()}:{AuthVerificationPurposes.PasswordReset}");

                await InvalidateActiveChallengesAsync(db, user.id, AuthVerificationPurposes.PasswordReset);
                string rawToken = AuthVerificationHelpers.GenerateUrlSafeToken();
                string hash = AuthVerificationHelpers.HashSecret(cryptography, rawToken);
                DateTime expires = DateTime.UtcNow.AddMinutes(AuthVerificationHelpers.ResetTokenValidityMinutes);
                await InsertChallengeAsync(db, user.id, user.organizationId, user.email, AuthVerificationPurposes.PasswordReset, hash, expires, ResolveClientIp());

                if (emailSender.IsConfigured())
                {
                    string url = AuthVerificationHelpers.BuildFrontendPath(
                        emailService.ResolveFrontendBaseUrl(),
                        $"/auth/reset-password?token={Uri.EscapeDataString(rawToken)}");
                    var tpl = AuthEmailTemplates.PasswordReset(user.displayName, url, AuthVerificationHelpers.ResetTokenValidityMinutes);
                    try
                    {
                        await emailSender.SendAsync(user.email, tpl.subject, tpl.html, tpl.text, cancellationToken);
                        logger.LogInformation("Password reset email sent for user {UserId}.", user.id);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Password reset email failed for user {UserId}.", user.id);
                    }
                }
                else
                {
                    logger.LogWarning("Password reset email skipped: SMTP not configured.");
                }
            }

            return new ForgotPasswordRes { message = GenericForgotMessage };
        }

        public async Task<CheckSignInEmailRes> CheckSignInEmailAsync(CheckSignInEmailReq req)
        {
            string email = req.email?.Trim() ?? "";
            if (email.Length < 3 || email.IndexOf('@') < 1)
                return new CheckSignInEmailRes { status = "none", message = "" };

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var user = await FindPasswordRecoveryUserByEmailAsync(db, email);
            if (user == null)
                return new CheckSignInEmailRes { status = "none", message = "" };

            if (user.passwordSetupRequired)
            {
                return new CheckSignInEmailRes
                {
                    status = "setup_required",
                    message = "",
                };
            }

            return new CheckSignInEmailRes
            {
                status = "ready",
                message = "",
            };
        }

        public async Task<ResetPasswordRes> ResetPasswordAsync(ResetPasswordReq req, CancellationToken cancellationToken = default)
        {
            string? passwordError = AuthVerificationHelpers.ValidatePasswordPair(req.newPassword, req.confirmPassword);
            if (passwordError != null)
                throw new AppException(AppException.ErrorCodes.BadRequest, passwordError);

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var challenge = await ResolveLinkChallengeAsync(db, req.token?.Trim() ?? "", AuthVerificationPurposes.PasswordReset);
            if (challenge == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This reset link is invalid or has expired.");

            bool consumed = await ConsumeChallengeAndUpdatePasswordAsync(
                db,
                challenge.id,
                challenge.userId,
                req.newPassword,
                invalidatePurposes: new[] { AuthVerificationPurposes.PasswordReset });
            if (!consumed)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This reset link is invalid or has already been used.");

            await SendPasswordChangedEmailAsync(challenge.email, challenge.displayName, cancellationToken);
            logger.LogInformation("Password reset completed for user {UserId}.", challenge.userId);

            return new ResetPasswordRes { message = "Your password has been reset. You can sign in with your new password." };
        }

        public async Task<CompleteInitialSetupRes> CompleteInitialSetupAsync(CompleteInitialSetupReq req, CancellationToken cancellationToken = default)
        {
            string? passwordError = AuthVerificationHelpers.ValidatePasswordPair(req.newPassword, req.confirmPassword);
            if (passwordError != null)
                throw new AppException(AppException.ErrorCodes.BadRequest, passwordError);

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var challenge = await ResolveLinkChallengeAsync(db, req.token?.Trim() ?? "", AuthVerificationPurposes.InitialSetup);
            if (challenge == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This setup link is invalid or has expired.");

            if (!challenge.emailVerified)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Verify your email with the code we sent before setting your password.");

            if (!challenge.passwordSetupRequired)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This account is not awaiting initial password setup.");

            bool consumed = await ConsumeChallengeAndUpdatePasswordAsync(
                db,
                challenge.id,
                challenge.userId,
                req.newPassword,
                invalidatePurposes: new[] { AuthVerificationPurposes.InitialSetup, AuthVerificationPurposes.EmailVerificationOtp },
                completeSetup: true);
            if (!consumed)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This setup link is invalid or has already been used.");

            await SendPasswordChangedEmailAsync(challenge.email, challenge.displayName, cancellationToken);
            logger.LogInformation("Initial setup completed for user {UserId}.", challenge.userId);

            return new CompleteInitialSetupRes { message = "Your password has been set. You can sign in now." };
        }

        public async Task<ValidateAuthTokenRes> ValidateAuthTokenAsync(ValidateAuthTokenReq req)
        {
            string purpose = NormalizeLinkPurpose(req.purpose);
            if (purpose == null)
                return InvalidToken("Unsupported token type.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var challenge = await ResolveLinkChallengeAsync(db, req.token?.Trim() ?? "", purpose);
            if (challenge == null)
                return InvalidToken("This link is invalid or has expired.");

            bool requiresOtp = purpose == AuthVerificationPurposes.InitialSetup && !challenge.emailVerified;
            return new ValidateAuthTokenRes
            {
                valid = true,
                email = MaskEmail(challenge.email),
                emailVerified = challenge.emailVerified,
                requiresEmailOtp = requiresOtp,
                message = requiresOtp ? "Verify your email to continue." : "Enter a new password to continue."
            };
        }

        public async Task<SendEmailOtpRes> SendEmailOtpAsync(SendEmailOtpReq req, CancellationToken cancellationToken = default)
        {
            if (!string.Equals(req.purpose, AuthVerificationPurposes.EmailVerificationOtp, StringComparison.Ordinal))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Unsupported verification purpose.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var link = await ResolveLinkChallengeAsync(db, req.token?.Trim() ?? "", AuthVerificationPurposes.InitialSetup);
            if (link == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This setup link is invalid or has expired.");
            if (link.emailVerified)
                return new SendEmailOtpRes { message = "Email is already verified.", cooldownSeconds = 0 };

            await EnforceSendRateLimitAsync(db, $"email:{link.email.ToLowerInvariant()}:{AuthVerificationPurposes.EmailVerificationOtp}");
            await EnforceOtpResendCooldownAsync(db, link.userId);

            await InvalidateActiveChallengesAsync(db, link.userId, AuthVerificationPurposes.EmailVerificationOtp);
            string otp = AuthVerificationHelpers.GenerateSixDigitOtp();
            string hash = AuthVerificationHelpers.HashSecret(cryptography, otp);
            DateTime expires = DateTime.UtcNow.AddMinutes(AuthVerificationHelpers.OtpValidityMinutes);
            await InsertChallengeAsync(db, link.userId, link.organizationId, link.email, AuthVerificationPurposes.EmailVerificationOtp, hash, expires, ResolveClientIp());

            if (!emailSender.IsConfigured())
                throw new AppException(AppException.ErrorCodes.BadRequest, "Email is not configured on the server. Contact your administrator.");

            var tpl = AuthEmailTemplates.Otp(link.displayName, otp, AuthVerificationHelpers.OtpValidityMinutes);
            try
            {
                await emailSender.SendAsync(link.email, tpl.subject, tpl.html, tpl.text, cancellationToken);
            }
            catch
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Unable to send verification email. Try again later.");
            }

            return new SendEmailOtpRes
            {
                message = "Verification code sent.",
                cooldownSeconds = AuthVerificationHelpers.OtpResendCooldownSeconds
            };
        }

        public async Task<VerifyEmailOtpRes> VerifyEmailOtpAsync(VerifyEmailOtpReq req)
        {
            if (!string.Equals(req.purpose, AuthVerificationPurposes.EmailVerificationOtp, StringComparison.Ordinal))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Unsupported verification purpose.");

            string otp = req.otp?.Trim() ?? "";
            if (otp.Length != 6 || !otp.All(char.IsDigit))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Enter the 6-digit verification code.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var link = await ResolveLinkChallengeAsync(db, req.token?.Trim() ?? "", AuthVerificationPurposes.InitialSetup);
            if (link == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This setup link is invalid or has expired.");

            var otpChallenge = await GetActiveOtpChallengeAsync(db, link.userId, AuthVerificationPurposes.EmailVerificationOtp);
            if (otpChallenge == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "No active verification code. Request a new code.");

            if (otpChallenge.expiresAt <= DateTime.UtcNow)
                throw new AppException(AppException.ErrorCodes.BadRequest, "This verification code has expired. Request a new code.");

            string hash = AuthVerificationHelpers.HashSecret(cryptography, otp);
            if (!AuthVerificationHelpers.FixedTimeEqualsHash(otpChallenge.secretHash, hash))
            {
                int attempts = await IncrementOtpAttemptsAsync(db, otpChallenge.id);
                if (attempts >= AuthVerificationHelpers.MaxOtpAttempts)
                    await ConsumeChallengeByIdAsync(db, otpChallenge.id);
                throw new AppException(AppException.ErrorCodes.BadRequest, "Incorrect verification code.");
            }

            await ConsumeChallengeByIdAsync(db, otpChallenge.id);
            await MarkEmailVerifiedAsync(db, link.userId);
            logger.LogInformation("Email verified for user {UserId}.", link.userId);

            return new VerifyEmailOtpRes { message = "Email verified.", emailVerified = true };
        }

        private async Task SendPasswordChangedEmailAsync(string email, string displayName, CancellationToken cancellationToken)
        {
            if (!emailSender.IsConfigured())
                return;
            var tpl = AuthEmailTemplates.PasswordChanged(displayName);
            try
            {
                await emailSender.SendAsync(email, tpl.subject, tpl.html, tpl.text, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Password-changed notification failed.");
            }
        }

        private static ValidateAuthTokenRes InvalidToken(string message) =>
            new() { valid = false, message = message };

        private static string? NormalizeLinkPurpose(string purpose)
        {
            if (string.IsNullOrWhiteSpace(purpose))
                return AuthVerificationPurposes.InitialSetup;
            if (string.Equals(purpose, AuthVerificationPurposes.InitialSetup, StringComparison.OrdinalIgnoreCase))
                return AuthVerificationPurposes.InitialSetup;
            if (string.Equals(purpose, AuthVerificationPurposes.PasswordReset, StringComparison.OrdinalIgnoreCase))
                return AuthVerificationPurposes.PasswordReset;
            return null;
        }

        private static string MaskEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return "";
            int at = email.IndexOf('@');
            if (at <= 1)
                return "***" + email.Substring(Math.Max(0, at));
            return email[0] + "***" + email.Substring(at);
        }

        private string ResolveClientIp()
        {
            var ctx = httpContextAccessor.HttpContext;
            if (ctx == null)
                return "unknown";
            string? forwarded = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
                return forwarded.Split(',')[0].Trim();
            return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private sealed class AuthUserRow
        {
            public string id { get; set; } = "";
            public string email { get; set; } = "";
            public string role { get; set; } = "";
            public string organizationId { get; set; } = "";
            public string displayName { get; set; } = "";
            public bool emailVerified { get; set; }
            public bool passwordSetupRequired { get; set; }
        }

        private sealed class LinkChallengeContext
        {
            public string id { get; set; } = "";
            public string userId { get; set; } = "";
            public string organizationId { get; set; } = "";
            public string email { get; set; } = "";
            public string displayName { get; set; } = "";
            public bool emailVerified { get; set; }
            public bool passwordSetupRequired { get; set; }
        }

        private sealed class OtpChallengeRow
        {
            public string id { get; set; } = "";
            public string secretHash { get; set; } = "";
            public DateTime expiresAt { get; set; }
        }

        private async Task<AuthUserRow?> FindPasswordRecoveryUserByEmailAsync(IDb db, string email)
        {
            const string query = @"
                SELECT id, email, role, organization_id, username,
                       COALESCE(email_verified, false) AS email_verified,
                       COALESCE(password_setup_required, false) AS password_setup_required
                FROM users
                WHERE lower(email) = lower(@email)
                  AND is_active = true
                  AND lower(status) = 'active'
                  AND lower(role) IN ('admin', 'admin_staff', 'staff', 'parent')
                ORDER BY created_at ASC
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                string role = reader["role"]?.ToString() ?? "";
                return new AuthUserRow
                {
                    id = reader["id"]?.ToString() ?? "",
                    email = reader["email"]?.ToString() ?? "",
                    role = role,
                    organizationId = reader["organization_id"]?.ToString() ?? "",
                    displayName = reader["username"]?.ToString() ?? "",
                    emailVerified = reader["email_verified"] != DBNull.Value && Convert.ToBoolean(reader["email_verified"]),
                    passwordSetupRequired = TryReadBool(reader, "password_setup_required")
                };
            }
            return null;
        }

        private async Task<LinkChallengeContext?> ResolveLinkChallengeAsync(IDb db, string rawToken, string purpose)
        {
            if (string.IsNullOrWhiteSpace(rawToken))
                return null;
            string hash = AuthVerificationHelpers.HashSecret(cryptography, rawToken);

            const string query = @"
                SELECT c.id, c.user_id, c.organization_id, c.email, c.secret_hash, c.expires_at, c.consumed_at,
                       u.username, COALESCE(u.email_verified, false) AS email_verified,
                       COALESCE(u.password_setup_required, false) AS password_setup_required
                FROM auth_verification_challenges c
                INNER JOIN users u ON u.id = c.user_id
                WHERE c.purpose = @purpose
                  AND c.consumed_at IS NULL
                  AND c.expires_at > @now
                  AND u.is_active = true
                ORDER BY c.created_at DESC;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "purpose", DbTypes.Types.String).Value = purpose;
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                string storedHash = reader["secret_hash"]?.ToString() ?? "";
                if (!AuthVerificationHelpers.FixedTimeEqualsHash(storedHash, hash))
                    continue;
                return new LinkChallengeContext
                {
                    id = reader["id"]?.ToString() ?? "",
                    userId = reader["user_id"]?.ToString() ?? "",
                    organizationId = reader["organization_id"]?.ToString() ?? "",
                    email = reader["email"]?.ToString() ?? "",
                    displayName = reader["username"]?.ToString() ?? "",
                    emailVerified = reader["email_verified"] != DBNull.Value && Convert.ToBoolean(reader["email_verified"]),
                    passwordSetupRequired = TryReadBool(reader, "password_setup_required")
                };
            }
            return null;
        }

        private async Task InvalidateActiveChallengesAsync(IDb db, string userId, string purpose)
        {
            const string query = @"
                UPDATE auth_verification_challenges
                SET consumed_at = @now
                WHERE user_id = @user_id
                  AND purpose = @purpose
                  AND consumed_at IS NULL;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "user_id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "purpose", DbTypes.Types.String).Value = purpose;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task InsertChallengeAsync(
            IDb db,
            string userId,
            string organizationId,
            string email,
            string purpose,
            string secretHash,
            DateTime expiresAt,
            string createdIp)
        {
            const string query = @"
                INSERT INTO auth_verification_challenges (
                    id, user_id, organization_id, email, purpose, secret_hash,
                    expires_at, attempt_count, consumed_at, created_at, created_ip
                ) VALUES (
                    @id, @user_id, @organization_id, @email, @purpose, @secret_hash,
                    @expires_at, 0, NULL, @created_at, @created_ip
                );
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(cmd, "user_id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "purpose", DbTypes.Types.String).Value = purpose;
            db.AddParameter(cmd, "secret_hash", DbTypes.Types.String).Value = secretHash;
            db.AddParameter(cmd, "expires_at", DbTypes.Types.DateTime).Value = expiresAt;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "created_ip", DbTypes.Types.String).Value = createdIp ?? "";
            await db.ExecuteNonQuery(cmd);
        }

        private async Task<bool> ConsumeChallengeAndUpdatePasswordAsync(
            IDb db,
            string challengeId,
            string userId,
            string newPassword,
            string[] invalidatePurposes,
            bool completeSetup = false)
        {
            string passwordHash = cryptography.CalculateSHA256Hash(newPassword);
            DateTime now = DateTime.UtcNow;

            const string consumeQuery = @"
                UPDATE auth_verification_challenges
                SET consumed_at = @now
                WHERE id = @id
                  AND consumed_at IS NULL
                  AND expires_at > @now;
            ";
            var consumeCmd = db.GetCommand(consumeQuery);
            db.AddParameter(consumeCmd, "now", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(consumeCmd, "id", DbTypes.Types.String).Value = challengeId;
            if (await db.ExecuteNonQuery(consumeCmd) <= 0)
                return false;

            string userUpdate = completeSetup
                ? @"
                    UPDATE users
                    SET password_hash = @password_hash,
                        password_setup_required = false,
                        setup_completed_at = @now,
                        updated_at = @now
                    WHERE id = @user_id
                      AND is_active = true
                      AND COALESCE(password_setup_required, false) = true;
                  "
                : @"
                    UPDATE users
                    SET password_hash = @password_hash,
                        password_setup_required = false,
                        updated_at = @now
                    WHERE id = @user_id
                      AND is_active = true;
                  ";

            var userCmd = db.GetCommand(userUpdate);
            db.AddParameter(userCmd, "password_hash", DbTypes.Types.String).Value = passwordHash;
            db.AddParameter(userCmd, "now", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(userCmd, "user_id", DbTypes.Types.String).Value = userId;
            if (await db.ExecuteNonQuery(userCmd) <= 0)
                return false;

            foreach (string purpose in invalidatePurposes)
                await InvalidateActiveChallengesAsync(db, userId, purpose);

            return true;
        }

        private async Task<OtpChallengeRow?> GetActiveOtpChallengeAsync(IDb db, string userId, string purpose)
        {
            const string query = @"
                SELECT id, secret_hash, expires_at, attempt_count
                FROM auth_verification_challenges
                WHERE user_id = @user_id
                  AND purpose = @purpose
                  AND consumed_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "user_id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "purpose", DbTypes.Types.String).Value = purpose;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;
            return new OtpChallengeRow
            {
                id = reader["id"]?.ToString() ?? "",
                secretHash = reader["secret_hash"]?.ToString() ?? "",
                expiresAt = Convert.ToDateTime(reader["expires_at"])
            };
        }

        private async Task<int> IncrementOtpAttemptsAsync(IDb db, string challengeId)
        {
            const string query = @"
                UPDATE auth_verification_challenges
                SET attempt_count = attempt_count + 1
                WHERE id = @id
                RETURNING attempt_count;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = challengeId;
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return Convert.ToInt32(reader["attempt_count"]);
            return AuthVerificationHelpers.MaxOtpAttempts;
        }

        private async Task ConsumeChallengeByIdAsync(IDb db, string challengeId)
        {
            const string query = @"
                UPDATE auth_verification_challenges
                SET consumed_at = @now
                WHERE id = @id AND consumed_at IS NULL;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = challengeId;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task MarkEmailVerifiedAsync(IDb db, string userId)
        {
            const string query = @"
                UPDATE users
                SET email_verified = true,
                    email_verified_at = @now,
                    updated_at = @now
                WHERE id = @user_id;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "user_id", DbTypes.Types.String).Value = userId;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task EnforceSendRateLimitAsync(IDb db, string scopeKey)
        {
            DateTime now = DateTime.UtcNow;
            DateTime windowStart = now.AddHours(-1);

            const string selectQuery = @"
                SELECT send_count, window_start
                FROM auth_send_rate_limits
                WHERE scope_key = @scope_key
                LIMIT 1;
            ";
            var selectCmd = db.GetCommand(selectQuery);
            db.AddParameter(selectCmd, "scope_key", DbTypes.Types.String).Value = scopeKey;
            int sendCount = 0;
            DateTime existingWindow = now;
            using (var reader = await db.Execute(selectCmd))
            {
                if (await reader.ReadAsync())
                {
                    sendCount = Convert.ToInt32(reader["send_count"]);
                    existingWindow = Convert.ToDateTime(reader["window_start"]);
                }
            }

            if (existingWindow < windowStart)
            {
                sendCount = 0;
                existingWindow = now;
            }

            if (sendCount >= AuthVerificationHelpers.MaxSendsPerHourPerScope)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Too many requests. Try again later.");

            const string upsertQuery = @"
                INSERT INTO auth_send_rate_limits (scope_key, window_start, send_count, updated_at)
                VALUES (@scope_key, @window_start, 1, @updated_at)
                ON CONFLICT (scope_key) DO UPDATE
                SET send_count = CASE
                        WHEN auth_send_rate_limits.window_start < @window_cutoff THEN 1
                        ELSE auth_send_rate_limits.send_count + 1
                    END,
                    window_start = CASE
                        WHEN auth_send_rate_limits.window_start < @window_cutoff THEN @window_start
                        ELSE auth_send_rate_limits.window_start
                    END,
                    updated_at = @updated_at;
            ";
            var upsertCmd = db.GetCommand(upsertQuery);
            db.AddParameter(upsertCmd, "scope_key", DbTypes.Types.String).Value = scopeKey;
            db.AddParameter(upsertCmd, "window_start", DbTypes.Types.DateTime).Value = existingWindow < windowStart ? now : existingWindow;
            db.AddParameter(upsertCmd, "window_cutoff", DbTypes.Types.DateTime).Value = windowStart;
            db.AddParameter(upsertCmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(upsertCmd);
        }

        private async Task EnforceOtpResendCooldownAsync(IDb db, string userId)
        {
            const string query = @"
                SELECT created_at
                FROM auth_verification_challenges
                WHERE user_id = @user_id
                  AND purpose = @purpose
                ORDER BY created_at DESC
                LIMIT 1;
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "user_id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "purpose", DbTypes.Types.String).Value = AuthVerificationPurposes.EmailVerificationOtp;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return;
            DateTime created = Convert.ToDateTime(reader["created_at"]);
            if (created.AddSeconds(AuthVerificationHelpers.OtpResendCooldownSeconds) > DateTime.UtcNow)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Please wait before requesting another code.");
        }

        private static bool TryReadBool(System.Data.Common.DbDataReader reader, string column)
        {
            try
            {
                int idx = reader.GetOrdinal(column);
                if (reader[idx] == DBNull.Value)
                    return false;
                return Convert.ToBoolean(reader[idx]);
            }
            catch (IndexOutOfRangeException)
            {
                return false;
            }
        }
    }
}
