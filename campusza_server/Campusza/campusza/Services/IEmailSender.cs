namespace Campusza.Services.Campusza
{
    public interface IEmailSender
    {
        bool IsConfigured();
        string? GetConfigurationError();
        Task SendAsync(string toEmail, string subject, string htmlBody, string textBody, CancellationToken cancellationToken = default);
    }
}
