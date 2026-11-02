using System.Security.Cryptography;
using System.Text;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public static class AuthVerificationHelpers
    {
        public const int MaxOtpAttempts = 5;
        public const int OtpValidityMinutes = 10;
        public const int SetupTokenValidityMinutes = 30;
        public const int ResetTokenValidityMinutes = 30;
        public const int MinPasswordLength = 8;
        public const int MaxSendsPerHourPerScope = 5;
        public const int OtpResendCooldownSeconds = 60;

        private static readonly HashSet<string> PasswordRecoveryRoles = new(StringComparer.OrdinalIgnoreCase)
        {
            "admin", "admin_staff", "staff", "parent"
        };

        public static bool IsPasswordRecoveryRole(string role)
            => !string.IsNullOrWhiteSpace(role) && PasswordRecoveryRoles.Contains(role.Trim());

        public static string GenerateUrlSafeToken(int byteLength = 32)
        {
            Span<byte> bytes = stackalloc byte[byteLength];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        public static string GenerateSixDigitOtp()
        {
            int value = RandomNumberGenerator.GetInt32(0, 1_000_000);
            return value.ToString("D6");
        }

        public static string HashSecret(CustomCryptography crypto, string secret)
            => crypto.CalculateSHA256Hash(secret.Trim());

        public static bool FixedTimeEqualsHash(string expectedHash, string actualHash)
        {
            if (string.IsNullOrEmpty(expectedHash) || string.IsNullOrEmpty(actualHash))
                return false;
            if (expectedHash.Length != actualHash.Length)
                return false;

            int diff = 0;
            for (int i = 0; i < expectedHash.Length; i++)
                diff |= expectedHash[i] ^ actualHash[i];
            return diff == 0;
        }

        public static string? ValidatePasswordPair(string newPassword, string confirmPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword))
                return "Password is required.";
            if (newPassword.Length < MinPasswordLength)
                return $"Password must be at least {MinPasswordLength} characters.";
            if (!string.Equals(newPassword, confirmPassword, StringComparison.Ordinal))
                return "Password and confirmation do not match.";
            return null;
        }

        public static string BuildFrontendPath(string baseUrl, string pathAndQuery)
        {
            string baseTrim = (baseUrl ?? "").Trim().TrimEnd('/');
            string path = pathAndQuery.StartsWith('/') ? pathAndQuery : "/" + pathAndQuery;
            if (string.IsNullOrWhiteSpace(baseTrim))
                return path;
            return baseTrim + path;
        }
    }
}
