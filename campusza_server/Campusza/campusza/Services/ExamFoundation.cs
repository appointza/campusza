using System.Globalization;
using System.Text.Json;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class ExamOrganizationTimeService
    {
        public const string DefaultTimeZoneId = "Asia/Kolkata";

        public static TimeZoneInfo ResolveTimeZone(string? settingsJson)
        {
            string tzId = DefaultTimeZoneId;
            if (!string.IsNullOrWhiteSpace(settingsJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(settingsJson);
                    if (doc.RootElement.TryGetProperty("timezone", out var tzEl))
                    {
                        var raw = tzEl.GetString()?.Trim();
                        if (!string.IsNullOrWhiteSpace(raw))
                            tzId = raw;
                    }
                }
                catch
                {
                    // fall through to default
                }
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(tzId);
            }
            catch
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(DefaultTimeZoneId);
                }
                catch
                {
                    return TimeZoneInfo.Utc;
                }
            }
        }

        public async Task<string> GetOrganizationSettingsJsonAsync(IDb db, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                return "{}";

            const string query = @"
                SELECT settings FROM organizations
                WHERE id = @id AND is_active = true
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = organizationId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return "{}";
            return reader["settings"] == DBNull.Value ? "{}" : reader["settings"].ToString() ?? "{}";
        }

        public async Task<TimeZoneInfo> GetOrganizationTimeZoneAsync(IDb db, string organizationId)
        {
            var json = await GetOrganizationSettingsJsonAsync(db, organizationId);
            return ResolveTimeZone(json);
        }

        /// <summary>
        /// Organization setting key: <c>organizations.settings</c> JSON
        /// <c>{ "exams": { "halfDayLatestEnd": "12:00:00" } }</c>.
        /// When absent, <see cref="ExamCalendarRules.DefaultHalfDayLatestEnd"/> applies (documented in bussines.md).
        /// </summary>
        public static TimeSpan ResolveExamHalfDayLatestEnd(string? settingsJson)
        {
            return ExamCalendarRules.ResolveHalfDayLatestEnd(settingsJson);
        }

        public async Task<TimeSpan> GetExamHalfDayLatestEndAsync(IDb db, string organizationId)
        {
            var json = await GetOrganizationSettingsJsonAsync(db, organizationId);
            return ResolveExamHalfDayLatestEnd(json);
        }
    }

    public static class ExamMarkRules
    {
        public static void ValidateAttendanceAndMarks(
            string attendanceStatus,
            decimal? marksObtained,
            decimal maxMarks,
            out string? error)
        {
            error = null;
            if (!ExamMarkAttendanceStatuses.All.Contains(attendanceStatus))
            {
                error = $"Invalid attendance status: {attendanceStatus}";
                return;
            }

            if (string.Equals(attendanceStatus, ExamMarkAttendanceStatuses.Absent, StringComparison.OrdinalIgnoreCase)
                || string.Equals(attendanceStatus, ExamMarkAttendanceStatuses.Excused, StringComparison.OrdinalIgnoreCase)
                || string.Equals(attendanceStatus, ExamMarkAttendanceStatuses.Exempt, StringComparison.OrdinalIgnoreCase))
            {
                if (marksObtained.HasValue)
                {
                    error = $"{attendanceStatus} students must not have numeric marks.";
                    return;
                }
            }

            if (marksObtained.HasValue)
            {
                if (marksObtained.Value < 0)
                {
                    error = "Marks cannot be negative.";
                    return;
                }
                if (marksObtained.Value > maxMarks)
                {
                    error = $"Marks cannot exceed maximum ({maxMarks.ToString(CultureInfo.InvariantCulture)}).";
                }
            }
        }

        public static bool IsMarkCellCompleteForSubmit(string attendanceStatus, decimal? marksObtained)
        {
            if (string.Equals(attendanceStatus, ExamMarkAttendanceStatuses.Pending, StringComparison.OrdinalIgnoreCase))
                return false;
            if (string.Equals(attendanceStatus, ExamMarkAttendanceStatuses.Present, StringComparison.OrdinalIgnoreCase))
                return marksObtained.HasValue;
            return true;
        }

        public static void EnsureNoDuplicateCells(IReadOnlyList<ExamMarkRegisterCell> cells)
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var cell in cells)
            {
                var key = $"{cell.sessionid}|{cell.enrollmentid}";
                if (!seen.Add(key))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Duplicate mark cells in request.");
            }
        }

        public static bool IsPublishedSeriesStatus(string status) =>
            string.Equals(status, ExamSeriesStatuses.Published, StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, ExamSeriesStatuses.InProgress, StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, ExamSeriesStatuses.Completed, StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase);
    }

    public static class ExamTenantGuard
    {
        public static void EnsureSameOrganization(string expectedOrgId, string? actualOrgId, string entityLabel)
        {
            if (string.IsNullOrWhiteSpace(expectedOrgId) || string.IsNullOrWhiteSpace(actualOrgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, $"{entityLabel}: organization is required.");

            if (!string.Equals(expectedOrgId.Trim(), actualOrgId.Trim(), StringComparison.OrdinalIgnoreCase))
                throw new AppException(AppException.ErrorCodes.BadRequest, $"{entityLabel} does not belong to this organization.");
        }

        /// <summary>
        /// When the client sends both organizationId and email, the email must resolve to the same organization.
        /// Empty emailOrg skips check (unknown user).
        /// </summary>
        public static void EnsureClientOrganizationBinding(string clientOrganizationId, string? organizationIdFromEmail)
        {
            if (string.IsNullOrWhiteSpace(clientOrganizationId) || string.IsNullOrWhiteSpace(organizationIdFromEmail))
                return;
            if (!string.Equals(clientOrganizationId.Trim(), organizationIdFromEmail.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Organization does not match authenticated user.");
            }
        }
    }

    /// <summary>
    /// School calendar rules for exam scheduling.
    /// Half-day exams: session end must be on or before the org-configured latest end
    /// (<c>exams.halfDayLatestEnd</c> in <c>organizations.settings</c>, default 12:00:00).
    /// </summary>
    public static class ExamCalendarRules
    {
        public static readonly TimeSpan DefaultHalfDayLatestEnd = new(12, 0, 0);

        public static TimeSpan ResolveHalfDayLatestEnd(string? settingsJson)
        {
            if (string.IsNullOrWhiteSpace(settingsJson))
                return DefaultHalfDayLatestEnd;
            try
            {
                using var doc = JsonDocument.Parse(settingsJson);
                if (doc.RootElement.TryGetProperty("exams", out var examsEl)
                    && examsEl.TryGetProperty("halfDayLatestEnd", out var endEl))
                {
                    var raw = endEl.GetString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(raw) && TimeSpan.TryParse(raw, CultureInfo.InvariantCulture, out var parsed))
                        return parsed;
                }
            }
            catch
            {
                // use default
            }
            return DefaultHalfDayLatestEnd;
        }

        public static string NormalizeDayType(string? raw)
        {
            var t = (raw ?? "").Trim().ToLowerInvariant();
            if (t is "leave" or "holiday" or "closed") return "closed";
            if (t is "half_day" or "halfday" or "half") return "half_day";
            if (t is "open" or "working" or "") return "open";
            return t;
        }

        public static string? ValidateSessionAgainstDayType(
            string dayType,
            TimeSpan startTime,
            TimeSpan endTime,
            TimeSpan? halfDayLatestEnd = null)
        {
            var latestEnd = halfDayLatestEnd ?? DefaultHalfDayLatestEnd;
            var normalized = NormalizeDayType(dayType);
            if (normalized == "closed")
                return "Exam cannot be scheduled on a closed school day.";
            if (normalized == "half_day" && endTime > latestEnd)
            {
                return $"Half-day sessions must end by {latestEnd:hh\\:mm} (configure exams.halfDayLatestEnd in organization settings).";
            }
            if (endTime <= startTime)
                return "End time must be after start time.";
            return null;
        }

        public static string ResolveDayTypeForDate(
            DateTime calendarDate,
            IReadOnlyList<(DateTime date, string dayType)> dayOverrides,
            IReadOnlyList<(int weekday, string dayType)> weeklyRules)
        {
            var ymd = calendarDate.Date;
            foreach (var o in dayOverrides)
            {
                if (o.date.Date == ymd)
                    return NormalizeDayType(o.dayType);
            }

            var dow = (int)ymd.DayOfWeek;
            var dotnetDow = dow == 0 ? 7 : dow;
            foreach (var rule in weeklyRules)
            {
                if (rule.weekday == dotnetDow)
                    return NormalizeDayType(rule.dayType);
            }

            return "open";
        }
    }

    public static class ExamOverlapRules
    {
        public static bool TimeRangesOverlap(TimeSpan startA, TimeSpan endA, TimeSpan startB, TimeSpan endB) =>
            startA < endB && startB < endA;

        public static bool SessionsOverlapOnDate(ExamSession a, ExamSession b)
        {
            if (a.examdate.Date != b.examdate.Date)
                return false;
            return TimeRangesOverlap(a.starttime, a.endtime, b.starttime, b.endtime);
        }
    }

    public static class ExamStudentVisibilityRules
    {
        public static bool IsSessionVisibleToStudent(string seriesStatus, string sessionStatus) =>
            string.Equals(seriesStatus, ExamSeriesStatuses.Published, StringComparison.OrdinalIgnoreCase)
            && string.Equals(sessionStatus, ExamSessionStatuses.Published, StringComparison.OrdinalIgnoreCase);
    }

    public static class ExamSubjectEligibilityRules
    {
        public static bool IsSubjectAllowed(string? classSubjectsJson, string? gradeMetadataJson, string subjectId)
        {
            if (string.IsNullOrWhiteSpace(subjectId))
                return false;
            if (SubjectOnClass(classSubjectsJson, subjectId))
                return true;
            return GradeMetadataContainsSubject(gradeMetadataJson, subjectId);
        }

        public static bool SubjectOnClass(string? subjectsJson, string subjectId)
        {
            if (string.IsNullOrWhiteSpace(subjectsJson) || subjectsJson == "[]")
                return false;
            try
            {
                using var doc = JsonDocument.Parse(subjectsJson);
                foreach (var el in doc.RootElement.EnumerateArray())
                {
                    if (el.TryGetProperty("subjectId", out var sid)
                        && string.Equals(sid.GetString(), subjectId, StringComparison.OrdinalIgnoreCase))
                        return true;
                    if (el.TryGetProperty("subjectid", out var sid2)
                        && string.Equals(sid2.GetString(), subjectId, StringComparison.OrdinalIgnoreCase))
                        return true;
                }
            }
            catch
            {
                return false;
            }
            return false;
        }

        public static bool GradeMetadataContainsSubject(string? metadataJson, string subjectId)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
                return false;
            try
            {
                using var doc = JsonDocument.Parse(metadataJson);
                if (!doc.RootElement.TryGetProperty("subjectIds", out var arr))
                    return false;
                foreach (var el in arr.EnumerateArray())
                {
                    if (string.Equals(el.GetString(), subjectId, StringComparison.OrdinalIgnoreCase))
                        return true;
                }
            }
            catch
            {
                return false;
            }
            return false;
        }
    }

    public static class ExamSessionDurationRules
    {
        public static int MinutesBetween(TimeSpan start, TimeSpan end) =>
            (int)(end - start).TotalMinutes;

        public static bool DurationMatchesTimeRange(TimeSpan start, TimeSpan end, int durationMinutes) =>
            MinutesBetween(start, end) == durationMinutes;
    }

    public static class ExamSeatingRules
    {
        public static IEnumerable<string> GenerateSeatLabels(int capacity, int? rows, int? columns)
        {
            if (rows > 0 && columns > 0 && rows * columns >= capacity)
            {
                var n = 0;
                for (var r = 1; r <= rows && n < capacity; r++)
                {
                    for (var c = 1; c <= columns && n < capacity; c++)
                    {
                        yield return $"R{r}C{c}";
                        n++;
                    }
                }
                yield break;
            }

            for (var i = 1; i <= capacity; i++)
                yield return $"S{i:D3}";
        }

        public static int CompareRollNumber(int? a, int? b)
        {
            if (!a.HasValue && !b.HasValue) return 0;
            if (!a.HasValue) return 1;
            if (!b.HasValue) return -1;
            return a.Value.CompareTo(b.Value);
        }

        public static int CompareAdmissionNumber(string? a, string? b) =>
            string.Compare(a ?? "", b ?? "", StringComparison.OrdinalIgnoreCase);
    }

    public static class ExamMarkAccess
    {
        public static bool IsAdminRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role)) return false;
            return string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "admin_staff", StringComparison.OrdinalIgnoreCase);
        }

        public static bool StaffCanEnterMarksForSession(
            Staff? staff,
            Class cls,
            string sessionSubjectId,
            bool isClassTeacherOrMentor,
            bool teachesOnSchedule)
        {
            if (string.IsNullOrWhiteSpace(sessionSubjectId))
                return false;
            // Class mentor / assistant mentor: full register for this class (sessions already scoped to class).
            if (isClassTeacherOrMentor)
                return true;
            if (teachesOnSchedule)
                return true;
            if (staff == null)
                return false;
            // Subject on staff profile; session is already for this class register.
            return ExamSubjectEligibilityRules.SubjectOnClass(staff.subjects_json, sessionSubjectId);
        }
    }

    public static class ExamResultsCalculator
    {
        public static (decimal? totalObtained, decimal? totalMax, decimal? percentage) Summarize(
            IReadOnlyList<ExamStudentResultSubjectRow> rows)
        {
            decimal obtained = 0;
            decimal max = 0;
            var counted = false;
            foreach (var row in rows)
            {
                if (string.Equals(row.attendancestatus, ExamMarkAttendanceStatuses.Exempt, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(row.attendancestatus, ExamMarkAttendanceStatuses.Excused, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (string.Equals(row.attendancestatus, ExamMarkAttendanceStatuses.Present, StringComparison.OrdinalIgnoreCase)
                    && row.marksobtained.HasValue)
                {
                    obtained += row.marksobtained.Value;
                    max += row.maxmarks;
                    counted = true;
                }
                else if (string.Equals(row.attendancestatus, ExamMarkAttendanceStatuses.Absent, StringComparison.OrdinalIgnoreCase))
                {
                    max += row.maxmarks;
                    counted = true;
                }
            }

            if (!counted)
                return (null, null, null);

            decimal? pct = max > 0 ? Math.Round(obtained / max * 100m, 2) : null;
            return (obtained, max, pct);
        }
    }
}
