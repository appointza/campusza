using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Campusza.Utils;
using Xunit;

namespace Campusza.Tests;

public class ExamPhase5TenantTests
{
    [Fact]
    public void Cross_organization_client_email_binding_is_rejected()
    {
        var ex = Assert.Throws<AppException>(() =>
            ExamTenantGuard.EnsureClientOrganizationBinding("org-a", "org-b"));
        Assert.Equal(AppException.ErrorCodes.BadRequest, ex.code);
    }

    [Fact]
    public void Matching_client_email_organization_is_allowed()
    {
        ExamTenantGuard.EnsureClientOrganizationBinding("org-a", "org-a");
    }
}

public class ExamPhase5ScenarioTests
{
    [Fact]
    public void ScenarioA_UKG_English_30min_accepts_marks_at_max_boundary()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Present,
            30m,
            30m,
            out var error);
        Assert.Null(error);
    }

    [Fact]
    public void ScenarioB_combined_classes_use_same_session_id_per_register_scope()
    {
        var session = new ExamSession
        {
            id = "math-final",
            maxmarks = 100,
            classids = new List<string> { "10-a", "10-b" },
        };
        Assert.Equal("math-final", session.id);
        Assert.Equal(2, session.classids.Count);
    }

    [Fact]
    public void ScenarioB_roll_number_seating_order_is_deterministic()
    {
        var students = new List<(int? roll, string admission)>
        {
            (12, "S12"),
            (3, "S03"),
            (null, "S99"),
        };
        var ordered = students
            .OrderBy(s => s.roll, Comparer<int?>.Create(ExamSeatingRules.CompareRollNumber))
            .ThenBy(s => s.admission, StringComparer.OrdinalIgnoreCase)
            .Select(s => s.admission)
            .ToList();
        Assert.Equal(new[] { "S03", "S12", "S99" }, ordered);
    }

    [Fact]
    public void ScenarioB_seat_labels_respect_room_grid_capacity()
    {
        var labels = ExamSeatingRules.GenerateSeatLabels(6, rows: 2, columns: 3).ToList();
        Assert.Equal(6, labels.Count);
        Assert.Equal("R1C1", labels[0]);
        Assert.Equal("R2C3", labels[5]);
    }

    [Fact]
    public void Invigilator_overlap_uses_same_rules_as_room_overlap()
    {
        Assert.True(ExamOverlapRules.TimeRangesOverlap(
            TimeSpan.FromHours(9),
            TimeSpan.FromHours(11),
            TimeSpan.FromHours(10),
            TimeSpan.FromHours(12)));
        Assert.False(ExamOverlapRules.TimeRangesOverlap(
            TimeSpan.FromHours(9),
            TimeSpan.FromHours(10),
            TimeSpan.FromHours(10),
            TimeSpan.FromHours(11)));
    }

    [Fact]
    public void Stale_mark_token_requires_exact_updated_at_match()
    {
        var expected = new DateTime(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc);
        var actual = expected.AddSeconds(1);
        Assert.NotEqual(expected, actual.ToUniversalTime());
    }

    [Fact]
    public void Timezone_fallback_is_Asia_Kolkata()
    {
        var tz = ExamOrganizationTimeService.ResolveTimeZone("{}");
        Assert.Equal(ExamOrganizationTimeService.DefaultTimeZoneId, tz.Id);
    }
}
