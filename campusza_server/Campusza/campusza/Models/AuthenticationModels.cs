namespace Campusza.Models.Campusza
{
    public static class AuthVerificationPurposes
    {
        public const string InitialSetup = "initial_setup";
        public const string PasswordReset = "password_reset";
        public const string EmailVerificationOtp = "email_verification_otp";
    }

    public class ForgotPasswordReq
    {
        public string email { get; set; } = "";
    }

    public class ForgotPasswordRes
    {
        public string message { get; set; } = "";
    }

    public class CheckSignInEmailReq
    {
        public string email { get; set; } = "";
    }

    /// <summary>ready = password login; setup_required = must use email link or forgot password first; none = no hint.</summary>
    public class CheckSignInEmailRes
    {
        public string status { get; set; } = "none";
        public string message { get; set; } = "";
    }

    public class ResetPasswordReq
    {
        public string token { get; set; } = "";
        public string newPassword { get; set; } = "";
        public string confirmPassword { get; set; } = "";
    }

    public class ResetPasswordRes
    {
        public string message { get; set; } = "";
    }

    public class CompleteInitialSetupReq
    {
        public string token { get; set; } = "";
        public string newPassword { get; set; } = "";
        public string confirmPassword { get; set; } = "";
    }

    public class CompleteInitialSetupRes
    {
        public string message { get; set; } = "";
    }

    public class ValidateAuthTokenReq
    {
        public string token { get; set; } = "";
        public string purpose { get; set; } = "";
    }

    public class ValidateAuthTokenRes
    {
        public bool valid { get; set; }
        public string email { get; set; } = "";
        public bool emailVerified { get; set; }
        public bool requiresEmailOtp { get; set; }
        public string message { get; set; } = "";
    }

    public class SendEmailOtpReq
    {
        /// <summary>Initial-setup link token or password-reset token that scopes the OTP request.</summary>
        public string token { get; set; } = "";
        public string purpose { get; set; } = AuthVerificationPurposes.EmailVerificationOtp;
    }

    public class SendEmailOtpRes
    {
        public string message { get; set; } = "";
        public int cooldownSeconds { get; set; }
    }

    public class VerifyEmailOtpReq
    {
        public string token { get; set; } = "";
        public string otp { get; set; } = "";
        public string purpose { get; set; } = AuthVerificationPurposes.EmailVerificationOtp;
    }

    public class VerifyEmailOtpRes
    {
        public string message { get; set; } = "";
        public bool emailVerified { get; set; }
    }
}
