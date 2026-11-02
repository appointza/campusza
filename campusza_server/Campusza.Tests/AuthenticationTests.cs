using Campusza.Services.Campusza;
using Campusza.Utils;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Campusza.Tests;

public class AuthVerificationHelpersTests
{
    private readonly CustomCryptography crypto = new();

    [Fact]
    public void GenerateSixDigitOtp_is_six_digits()
    {
        string otp = AuthVerificationHelpers.GenerateSixDigitOtp();
        Assert.Equal(6, otp.Length);
        Assert.True(otp.All(char.IsDigit));
    }

    [Fact]
    public void HashSecret_is_deterministic()
    {
        string a = AuthVerificationHelpers.HashSecret(crypto, "abc");
        string b = AuthVerificationHelpers.HashSecret(crypto, "abc");
        Assert.Equal(a, b);
    }

    [Fact]
    public void FixedTimeEqualsHash_rejects_mismatch()
    {
        string hash = AuthVerificationHelpers.HashSecret(crypto, "token");
        Assert.False(AuthVerificationHelpers.FixedTimeEqualsHash(hash, "other"));
        Assert.True(AuthVerificationHelpers.FixedTimeEqualsHash(hash, hash));
    }

    [Fact]
    public void ValidatePasswordPair_enforces_length_and_match()
    {
        Assert.Contains("8", AuthVerificationHelpers.ValidatePasswordPair("short", "short") ?? "");
        Assert.NotNull(AuthVerificationHelpers.ValidatePasswordPair("longenough", "different"));
        Assert.Null(AuthVerificationHelpers.ValidatePasswordPair("longenough", "longenough"));
    }

    [Theory]
    [InlineData("admin", true)]
    [InlineData("staff", true)]
    [InlineData("parent", true)]
    [InlineData("student", false)]
    public void Password_recovery_roles(string role, bool allowed)
    {
        Assert.Equal(allowed, AuthVerificationHelpers.IsPasswordRecoveryRole(role));
    }

    [Fact]
    public void BuildFrontendPath_joins_base_and_path()
    {
        string url = AuthVerificationHelpers.BuildFrontendPath("https://app.example.com", "/auth/reset?token=x");
        Assert.Equal("https://app.example.com/auth/reset?token=x", url);
    }
}

public class FakeEmailSenderTests
{
    private sealed class FakeEmailSender : IEmailSender
    {
        public List<(string to, string subject)> Sent { get; } = new();
        public bool IsConfigured() => true;
        public string? GetConfigurationError() => null;
        public Task SendAsync(string toEmail, string subject, string htmlBody, string textBody, CancellationToken cancellationToken = default)
        {
            Sent.Add((toEmail, subject));
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task Fake_sender_records_messages_without_network()
    {
        var fake = new FakeEmailSender();
        await fake.SendAsync("user@school.test", "Subject", "<p>Hi</p>", "Hi");
        Assert.Single(fake.Sent);
        Assert.Equal("user@school.test", fake.Sent[0].to);
    }
}

public class EmailServiceConfigurationTests
{
    [Fact]
    public void Missing_app_password_reports_configuration_error()
    {
        var config = new ConfigurationBuilder().Build();
        var svc = new EmailService(config);
        Environment.SetEnvironmentVariable("CAMPUSZA_SMTP_APP_PASSWORD", null);
        var error = svc.GetConfigurationError();
        Assert.NotNull(error);
        Assert.Contains("CAMPUSZA_SMTP_APP_PASSWORD", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Mail_section_password_marks_service_configured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mail:Password"] = "test-app-password",
            })
            .Build();
        var svc = new EmailService(config);
        Assert.True(svc.IsConfigured());
        Assert.Null(svc.GetConfigurationError());
    }

    [Fact]
    public void Env_app_password_marks_service_configured()
    {
        var config = new ConfigurationBuilder().Build();
        var svc = new EmailService(config);
        Environment.SetEnvironmentVariable("CAMPUSZA_SMTP_APP_PASSWORD", "test-secret-not-real");
        try
        {
            Assert.True(svc.IsConfigured());
            Assert.Null(svc.GetConfigurationError());
        }
        finally
        {
            Environment.SetEnvironmentVariable("CAMPUSZA_SMTP_APP_PASSWORD", null);
        }
    }
}
