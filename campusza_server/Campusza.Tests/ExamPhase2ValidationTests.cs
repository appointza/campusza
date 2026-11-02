using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Campusza.Utils;
using Xunit;

namespace Campusza.Tests;

public class ExamCalendarRulesTests
{
    [Fact]
    public void Closed_day_rejects_exams()
    {
        var error = ExamCalendarRules.ValidateSessionAgainstDayType(
            "closed",
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 0, 0));
        Assert.NotNull(error);
    }

    [Fact]
    public void Half_day_rejects_afternoon_end_with_default_policy()
    {
        var error = ExamCalendarRules.ValidateSessionAgainstDayType(
            "half_day",
            new TimeSpan(13, 0, 0),
            new TimeSpan(15, 0, 0));
        Assert.NotNull(error);
        Assert.Contains("halfDayLatestEnd", error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void UKG_English_30_minutes_valid_on_half_day()
    {
        var start = new TimeSpan(9, 0, 0);
        var end = new TimeSpan(9, 30, 0);
        Assert.Equal(30, ExamSessionDurationRules.MinutesBetween(start, end));
        Assert.True(ExamSessionDurationRules.DurationMatchesTimeRange(start, end, 30));
        Assert.Null(ExamCalendarRules.ValidateSessionAgainstDayType("half_day", start, end));
    }

    [Fact]
    public void Combined_Maths_10A_10B_two_hours_duration()
    {
        var start = new TimeSpan(10, 0, 0);
        var end = new TimeSpan(12, 0, 0);
        Assert.Equal(120, ExamSessionDurationRules.MinutesBetween(start, end));
        Assert.True(ExamSessionDurationRules.DurationMatchesTimeRange(start, end, 120));
    }

    [Fact]
    public void Org_settings_override_half_day_latest_end()
    {
        var settings = """{"exams":{"halfDayLatestEnd":"13:30:00"}}""";
        var latest = ExamCalendarRules.ResolveHalfDayLatestEnd(settings);
        Assert.Equal(new TimeSpan(13, 30, 0), latest);
        Assert.Null(ExamCalendarRules.ValidateSessionAgainstDayType(
            "half_day",
            new TimeSpan(12, 0, 0),
            new TimeSpan(13, 0, 0),
            latest));
    }
}

public class ExamOverlapRulesTests
{
    [Fact]
    public void Student_exam_overlap_rejection_scenario()
    {
        var maths = new ExamSession
        {
            examdate = new DateTime(2026, 6, 10),
            starttime = new TimeSpan(10, 0, 0),
            endtime = new TimeSpan(12, 0, 0),
        };
        var english = new ExamSession
        {
            examdate = new DateTime(2026, 6, 10),
            starttime = new TimeSpan(11, 0, 0),
            endtime = new TimeSpan(11, 30, 0),
        };
        Assert.True(ExamOverlapRules.SessionsOverlapOnDate(maths, english));
    }
}

public class ExamSubjectEligibilityRulesTests
{
    [Fact]
    public void Subject_eligibility_rejection_when_not_on_class_or_grade()
    {
        var classJson = """[{"subjectId":"sub-math"}]""";
        var gradeJson = """{"subjectIds":["sub-english"]}""";
        Assert.False(ExamSubjectEligibilityRules.IsSubjectAllowed(classJson, gradeJson, "sub-science"));
    }

    [Fact]
    public void Subject_eligibility_accepts_class_subject()
    {
        var classJson = """[{"subjectId":"sub-english"}]""";
        Assert.True(ExamSubjectEligibilityRules.IsSubjectAllowed(classJson, null, "sub-english"));
    }
}

public class ExamPhase2TenantIsolationTests
{
    [Fact]
    public void Tenant_isolation_rejects_cross_organization()
    {
        var ex = Assert.Throws<AppException>(() =>
            ExamTenantGuard.EnsureSameOrganization("org-a", "org-b", "Exam session"));
        Assert.Equal(AppException.ErrorCodes.BadRequest, ex.code);
    }
}

public class ExamStudentVisibilityRulesTests
{
    [Fact]
    public void Student_cannot_see_unpublished_exams()
    {
        Assert.False(ExamStudentVisibilityRules.IsSessionVisibleToStudent(
            ExamSeriesStatuses.Draft, ExamSessionStatuses.Draft));
        Assert.False(ExamStudentVisibilityRules.IsSessionVisibleToStudent(
            ExamSeriesStatuses.Scheduled, ExamSessionStatuses.Scheduled));
        Assert.False(ExamStudentVisibilityRules.IsSessionVisibleToStudent(
            ExamSeriesStatuses.Published, ExamSessionStatuses.Scheduled));
        Assert.True(ExamStudentVisibilityRules.IsSessionVisibleToStudent(
            ExamSeriesStatuses.Published, ExamSessionStatuses.Published));
    }
}

public class ExamSeriesTransitionTests
{
    [Fact]
    public void Publish_requires_scheduled_status()
    {
        var svc = new ExamValidationService(null!, null!, null!, null!);
        var ex = Assert.Throws<AppException>(() =>
            svc.EnsureSeriesTransition(ExamSeriesStatuses.Draft, ExamSeriesStatuses.Published));
        Assert.Contains("scheduled", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}
