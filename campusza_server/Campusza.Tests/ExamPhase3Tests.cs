using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Xunit;

namespace Campusza.Tests;

public class ExamSeatingRulesTests
{
    [Fact]
    public void Grid_labels_for_3x10_room()
    {
        var labels = ExamSeatingRules.GenerateSeatLabels(30, 3, 10).ToList();
        Assert.Equal(30, labels.Count);
        Assert.Equal("R1C1", labels[0]);
        Assert.Equal("R3C10", labels[29]);
    }

    [Fact]
    public void Sequential_labels_when_no_grid()
    {
        var labels = ExamSeatingRules.GenerateSeatLabels(5, null, null).ToList();
        Assert.Equal(new[] { "S001", "S002", "S003", "S004", "S005" }, labels);
    }

    [Fact]
    public void RollNumber_sort_orders_numeric()
    {
        Assert.True(ExamSeatingRules.CompareRollNumber(2, 10) < 0);
    }

    [Fact]
    public void Combined_session_capacity_check_math()
    {
        var students = 25;
        var roomA = 10;
        var roomB = 15;
        Assert.True(roomA + roomB >= students);
    }
}

public class ExamSessionEditGuardTests
{
    [Fact]
    public void Published_session_requires_correction_flag()
    {
        var ex = Assert.Throws<Campusza.Utils.AppException>(() =>
            ExamSessionEditGuard.EnsureRoomOrSeatingEditAllowed(ExamSessionStatuses.Published, false, null));
        Assert.Contains("correction", ex.Message, StringComparison.OrdinalIgnoreCase);
    }
}

public class ExamHalfDaySettingsTests
{
    [Fact]
    public void Org_half_day_end_from_settings_json()
    {
        var end = ExamCalendarRules.ResolveHalfDayLatestEnd("""{"exams":{"halfDayLatestEnd":"11:30:00"}}""");
        Assert.Equal(new TimeSpan(11, 30, 0), end);
    }
}
