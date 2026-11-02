using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Campusza.Services.Campusza
{
    public class EmailService : IEmailSender
    {
        private readonly IConfiguration config;

        public EmailService(IConfiguration config)
        {
            this.config = config;
        }

        private string? Resolve(string envKey, string configKey, string? defaultValue = null, params string[] alternateConfigKeys)
        {
            var fromEnv = Environment.GetEnvironmentVariable(envKey);
            if (!string.IsNullOrWhiteSpace(fromEnv))
                return fromEnv.Trim();

            var keys = new[] { configKey }.Concat(alternateConfigKeys ?? Array.Empty<string>());
            foreach (var key in keys)
            {
                var fromConfig = config[key];
                if (!string.IsNullOrWhiteSpace(fromConfig))
                    return fromConfig.Trim();
            }

            return defaultValue;
        }

        public bool IsConfigured()
            => string.IsNullOrWhiteSpace(GetConfigurationError());

        public string? GetConfigurationError()
        {
            if (string.IsNullOrWhiteSpace(Resolve("CAMPUSZA_SMTP_HOST", "Email:SmtpHost", "smtp.gmail.com", "Mail:Host")))
                return "SMTP host is not configured.";
            if (string.IsNullOrWhiteSpace(Resolve("CAMPUSZA_SMTP_USERNAME", "Email:Username", "appointza@gmail.com", "Mail:User")))
                return "SMTP username is not configured.";
            if (string.IsNullOrWhiteSpace(Resolve("CAMPUSZA_SMTP_APP_PASSWORD", "Email:Password", null, "Mail:Password")))
                return "SMTP app password is not configured. Set CAMPUSZA_SMTP_APP_PASSWORD or Mail:Password.";
            if (string.IsNullOrWhiteSpace(Resolve("CAMPUSZA_SMTP_FROM_EMAIL", "Email:FromEmail", "appointza@gmail.com", "Mail:From")))
                return "SMTP from email is not configured.";
            return null;
        }

        public async Task SendAsync(string toEmail, string subject, string htmlBody, string textBody = "", CancellationToken cancellationToken = default)
        {
            var configError = GetConfigurationError();
            if (configError != null)
                throw new InvalidOperationException(configError);

            string host = Resolve("CAMPUSZA_SMTP_HOST", "Email:SmtpHost", "smtp.gmail.com", "Mail:Host")!;
            int port = int.TryParse(Resolve("CAMPUSZA_SMTP_PORT", "Email:Port", "587", "Mail:Port"), out int parsedPort) ? parsedPort : 587;
            bool enableSsl = !string.Equals(Resolve("CAMPUSZA_SMTP_ENABLE_SSL", "Email:EnableSsl", "true", "Mail:EnableSsl"), "false", StringComparison.OrdinalIgnoreCase);
            string username = Resolve("CAMPUSZA_SMTP_USERNAME", "Email:Username", "appointza@gmail.com", "Mail:User")!;
            string password = Resolve("CAMPUSZA_SMTP_APP_PASSWORD", "Email:Password", null, "Mail:Password")!;
            string fromEmail = Resolve("CAMPUSZA_SMTP_FROM_EMAIL", "Email:FromEmail", "appointza@gmail.com", "Mail:From")!;
            string fromName = Resolve("CAMPUSZA_SMTP_FROM_NAME", "Email:FromName", "Campusza", "Mail:FromName")!;

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            if (!string.IsNullOrWhiteSpace(textBody))
            {
                var plainView = AlternateView.CreateAlternateViewFromString(textBody, null, "text/plain");
                message.AlternateViews.Add(plainView);
            }

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(username, password),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            await client.SendMailAsync(message, cancellationToken);
        }

        public string ResolveFrontendBaseUrl()
        {
            var fromEnv = Environment.GetEnvironmentVariable("CAMPUSZA_FRONTEND_BASE_URL");
            if (!string.IsNullOrWhiteSpace(fromEnv))
                return fromEnv.Trim().TrimEnd('/');
            var fromConfig = config["ApplicationSettings:frontendBaseUrl"]
                ?? config["Frontend:BaseUrl"]
                ?? config["ApplicationSettings:baseUrl"];
            if (!string.IsNullOrWhiteSpace(fromConfig))
                return fromConfig.Trim().TrimEnd('/');
            return "";
        }
    }
}
