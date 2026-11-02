using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Campusza.Utils;
using Xunit;

namespace Campusza.Tests;

public class ExamMarkRulesTests
{
    [Fact]
    public void Absent_requires_null_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Absent,
            50m,
            100m,
            out var error);
        Assert.NotNull(error);
        Assert.Contains("Absent", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Absent_allows_null_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Absent,
            null,
            100m,
            out var error);
        Assert.Null(error);
    }

    [Fact]
    public void Present_rejects_marks_above_max()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Present,
            101m,
            100m,
            out var error);
        Assert.NotNull(error);
    }

    [Fact]
    public void Pending_allows_null_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Pending,
            null,
            100m,
            out var error);
        Assert.Null(error);
    }
}

public class ExamTenantGuardTests
{
    [Fact]
    public void Rejects_cross_organization_ids()
    {
        var ex = Assert.Throws<AppException>(() =>
            ExamTenantGuard.EnsureSameOrganization("org-a", "org-b", "Exam series"));
        Assert.Equal(AppException.ErrorCodes.BadRequest, ex.code);
    }

    [Fact]
    public void Accepts_matching_organization_ids()
    {
        ExamTenantGuard.EnsureSameOrganization("org-a", "org-a", "Exam series");
    }
}

public class ExamOrganizationTimeTests
{
    [Fact]
    public void Reads_timezone_from_settings_json()
    {
        var tz = ExamOrganizationTimeService.ResolveTimeZone("{\"timezone\":\"Asia/Kolkata\"}");
        Assert.Equal("Asia/Kolkata", tz.Id);
    }

    [Fact]
    public void Falls_back_when_settings_missing()
    {
        var tz = ExamOrganizationTimeService.ResolveTimeZone("{}");
        Assert.Equal(ExamOrganizationTimeService.DefaultTimeZoneId, tz.Id);
    }
}
