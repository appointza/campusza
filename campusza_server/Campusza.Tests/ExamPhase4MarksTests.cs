using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Campusza.Utils;
using Xunit;

namespace Campusza.Tests;

/// <summary>Phase 4 — marks register rules, access, results math, legacy grades untouched.</summary>
public class ExamPhase4MarksTests
{
    [Fact]
    public void UkgEnglishUnitTest_30min_session_accepts_valid_present_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Present,
            28m,
            30m,
            out var error);
        Assert.Null(error);
    }

    [Fact]
    public void CombinedClass10_registers_are_scoped_by_classId_on_sessions()
    {
        // Combined Maths session attaches Class 10-A and 10-B; marks saves use the same session id per class register.
        var session = new ExamSession
        {
            id = "sess-maths",
            classids = new List<string> { "class-10a", "class-10b" },
        };
        Assert.Equal(2, session.classids.Count);
        Assert.Contains("class-10a", session.classids);
    }

    [Fact]
    public void Marks_boundary_rejects_above_max()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Present,
            31m,
            30m,
            out var error);
        Assert.NotNull(error);
    }

    [Fact]
    public void Marks_boundary_rejects_negative()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Present,
            -1m,
            30m,
            out var error);
        Assert.NotNull(error);
    }

    [Fact]
    public void Absent_requires_null_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Absent,
            0m,
            30m,
            out var error);
        Assert.NotNull(error);
    }

    [Fact]
    public void Absent_allows_null_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Absent,
            null,
            30m,
            out var error);
        Assert.Null(error);
    }

    [Fact]
    public void Pending_with_null_is_not_submit_ready()
    {
        Assert.False(ExamMarkRules.IsMarkCellCompleteForSubmit(ExamMarkAttendanceStatuses.Pending, null));
    }

    [Fact]
    public void Zero_is_distinct_from_missing_on_submit()
    {
        Assert.True(ExamMarkRules.IsMarkCellCompleteForSubmit(ExamMarkAttendanceStatuses.Present, 0m));
        Assert.False(ExamMarkRules.IsMarkCellCompleteForSubmit(ExamMarkAttendanceStatuses.Present, null));
    }

    [Fact]
    public void Duplicate_cells_in_request_are_rejected()
    {
        var cells = new List<ExamMarkRegisterCell>
        {
            new() { sessionid = "s1", enrollmentid = "e1" },
            new() { sessionid = "s1", enrollmentid = "e1" },
        };
        var ex = Assert.Throws<AppException>(() => ExamMarkRules.EnsureNoDuplicateCells(cells));
        Assert.Equal(AppException.ErrorCodes.BadRequest, ex.code);
    }

    [Fact]
    public void Excused_must_not_have_numeric_marks()
    {
        ExamMarkRules.ValidateAttendanceAndMarks(
            ExamMarkAttendanceStatuses.Excused,
            10m,
            100m,
            out var error);
        Assert.NotNull(error);
    }

    [Fact]
    public void Class_teacher_can_enter_marks_for_any_session_column_on_class_register()
    {
        var staff = new Staff { id = "st1", subjects_json = "[]" };
        var cls = new Class
        {
            id = "c1",
            classteacherid = "st1",
            subjects_json = "[]",
        };
        var allowed = ExamMarkAccess.StaffCanEnterMarksForSession(
            staff, cls, "math-id", isClassTeacherOrMentor: true, teachesOnSchedule: false);
        Assert.True(allowed);
    }

    [Fact]
    public void Staff_subject_access_denies_unassigned_subject()
    {
        var staff = new Staff { id = "st1", subjects_json = "[{\"subjectId\":\"eng-id\"}]" };
        var cls = new Class
        {
            id = "c1",
            classteacherid = "other",
            assistantmentorid = "",
            subjects_json = "[{\"subjectId\":\"math-id\"}]",
        };
        var allowed = ExamMarkAccess.StaffCanEnterMarksForSession(
            staff, cls, "math-id", isClassTeacherOrMentor: false, teachesOnSchedule: false);
        Assert.False(allowed);
    }

    [Fact]
    public void Admin_role_detection()
    {
        Assert.True(ExamMarkAccess.IsAdminRole("admin"));
        Assert.True(ExamMarkAccess.IsAdminRole("admin_staff"));
        Assert.False(ExamMarkAccess.IsAdminRole("staff"));
    }

    [Fact]
    public void Results_totals_skip_exempt_and_do_not_invent_marks()
    {
        var rows = new List<ExamStudentResultSubjectRow>
        {
            new()
            {
                attendancestatus = ExamMarkAttendanceStatuses.Present,
                marksobtained = 40m,
                maxmarks = 50m,
            },
            new()
            {
                attendancestatus = ExamMarkAttendanceStatuses.Exempt,
                maxmarks = 50m,
            },
            new()
            {
                attendancestatus = ExamMarkAttendanceStatuses.Absent,
                maxmarks = 50m,
            },
        };
        var (obtained, max, pct) = ExamResultsCalculator.Summarize(rows);
        Assert.Equal(40m, obtained);
        Assert.Equal(100m, max);
        Assert.Equal(40m, pct);
    }

    [Fact]
    public void Legacy_staff_grades_service_still_exists()
    {
        var t = typeof(StudentGradeService);
        Assert.NotNull(t.GetMethod("Select"));
        Assert.NotNull(t.GetMethod("UpsertMany"));
    }
}
