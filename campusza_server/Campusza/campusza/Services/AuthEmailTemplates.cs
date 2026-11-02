namespace Campusza.Services.Campusza
{
    public static class AuthEmailTemplates
    {
        public static (string subject, string html, string text) InitialSetup(string displayName, string setupUrl, int expiryMinutes)
        {
            string name = string.IsNullOrWhiteSpace(displayName) ? "there" : displayName.Trim();
            string subject = "Set up your Campusza account";
            string html = $@"
<!DOCTYPE html>
<html><body style=""margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;"">
    <tr><td style=""background:#1e3a5f;color:#fff;padding:20px 24px;font-size:20px;font-weight:600;"">Campusza</td></tr>
    <tr><td style=""padding:24px;color:#18181b;font-size:15px;line-height:1.5;"">
      <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
      <p>Your Campusza account has been created. Set your password using the button below. This link expires in {expiryMinutes} minutes.</p>
      <p style=""text-align:center;margin:28px 0;"">
        <a href=""{System.Net.WebUtility.HtmlEncode(setupUrl)}"" style=""background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-weight:600;"">Set your password</a>
      </p>
      <p style=""font-size:13px;color:#71717a;"">If you did not expect this email, you can ignore it. No changes will be made unless you use the link.</p>
    </td></tr>
  </table>
</body></html>";
            string text = $"Hi {name},\n\nYour Campusza account has been created. Set your password here (expires in {expiryMinutes} minutes):\n{setupUrl}\n\nIf you did not expect this email, ignore it.\n";
            return (subject, html, text);
        }

        public static (string subject, string html, string text) Otp(string displayName, string otp, int validityMinutes)
        {
            string name = string.IsNullOrWhiteSpace(displayName) ? "there" : displayName.Trim();
            string subject = "Your Campusza verification code";
            string html = $@"
<!DOCTYPE html>
<html><body style=""margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;margin:24px auto;background:#fff;border-radius:8px;"">
    <tr><td style=""background:#1e3a5f;color:#fff;padding:20px 24px;font-size:20px;font-weight:600;"">Campusza</td></tr>
    <tr><td style=""padding:24px;color:#18181b;font-size:15px;line-height:1.5;"">
      <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
      <p>Your verification code is:</p>
      <p style=""font-size:28px;font-weight:700;letter-spacing:4px;text-align:center;margin:20px 0;"">{System.Net.WebUtility.HtmlEncode(otp)}</p>
      <p>This code is valid for {validityMinutes} minutes. Do not share it with anyone.</p>
    </td></tr>
  </table>
</body></html>";
            string text = $"Hi {name},\n\nYour Campusza verification code is {otp}. It expires in {validityMinutes} minutes. Do not share this code.\n";
            return (subject, html, text);
        }

        public static (string subject, string html, string text) PasswordReset(string displayName, string resetUrl, int expiryMinutes)
        {
            string name = string.IsNullOrWhiteSpace(displayName) ? "there" : displayName.Trim();
            string subject = "Reset your Campusza password";
            string html = $@"
<!DOCTYPE html>
<html><body style=""margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;margin:24px auto;background:#fff;border-radius:8px;"">
    <tr><td style=""background:#1e3a5f;font-size:20px;font-weight:600;color:#fff;padding:20px 24px;"">Campusza</td></tr>
    <tr><td style=""padding:24px;color:#18181b;font-size:15px;line-height:1.5;"">
      <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
      <p>We received a request to reset your password. Your password will not change until you use the link below (expires in {expiryMinutes} minutes).</p>
      <p style=""text-align:center;margin:28px 0;"">
        <a href=""{System.Net.WebUtility.HtmlEncode(resetUrl)}"" style=""background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-weight:600;"">Reset password</a>
      </p>
      <p style=""font-size:13px;color:#71717a;"">If you did not request this, ignore this email.</p>
    </td></tr>
  </table>
</body></html>";
            string text = $"Hi {name},\n\nReset your Campusza password (expires in {expiryMinutes} minutes):\n{resetUrl}\n\nIf you did not request this, ignore this email.\n";
            return (subject, html, text);
        }

        public static (string subject, string html, string text) PasswordChanged(string displayName)
        {
            string name = string.IsNullOrWhiteSpace(displayName) ? "there" : displayName.Trim();
            string subject = "Your Campusza password was changed";
            string html = $@"
<!DOCTYPE html>
<html><body style=""margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Arial,sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;margin:24px auto;background:#fff;border-radius:8px;"">
    <tr><td style=""background:#1e3a5f;color:#fff;padding:20px 24px;font-size:20px;font-weight:600;"">Campusza</td></tr>
    <tr><td style=""padding:24px;color:#18181b;font-size:15px;line-height:1.5;"">
      <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
      <p>Your Campusza password was changed successfully. If you did not make this change, contact your school administrator immediately.</p>
    </td></tr>
  </table>
</body></html>";
            string text = $"Hi {name},\n\nYour Campusza password was changed. If you did not make this change, contact your school administrator.\n";
            return (subject, html, text);
        }
    }
}
