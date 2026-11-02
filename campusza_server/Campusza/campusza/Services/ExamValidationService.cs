using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamValidationService
    {
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly TermService termService;
        private readonly StudentEnrollmentService studentEnrollmentService;
        private readonly ExamOrganizationTimeService examOrganizationTimeService;

        public ExamValidationService(
            IQueryBuilderProvider querybuilderprovider,
            TermService termService,
            StudentEnrollmentService studentEnrollmentService,
            ExamOrganizationTimeService examOrganizationTimeService)
        {
            this.querybuilderprovider = querybuilderprovider;
            this.termService = termService;
            this.studentEnrollmentService = studentEnrollmentService;
            this.examOrganizationTimeService = examOrganizationTimeService;
        }

        public ExamValidationResult ValidateSeriesDatesAgainstTerm(ExamSeries series, Term term)
        {
            var result = new ExamValidationResult();
            if (series.startdate.Date < term.startdate.Date || series.enddate.Date > term.enddate.Date)
            {
                result.errors.Add("Exam series dates must fall within the selected term.");
            }

            if (!string.IsNullOrWhiteSpace(term.academicyear)
                && !string.IsNullOrWhiteSpace(series.academicyear)
                && !string.Equals(term.academicyear.Trim(), series.academicyear.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                result.errors.Add("Academic year must match the selected term.");
            }

            return result;
        }

        public void EnsureSeriesTransition(string currentStatus, string targetStatus)
        {
            var current = (currentStatus ?? "").Trim();
            var target = (targetStatus ?? "").Trim();

            if (string.Equals(target, ExamSeriesStatuses.Scheduled, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.Equals(current, ExamSeriesStatuses.Draft, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only draft exam series can be scheduled.");
                return;
            }

            if (string.Equals(target, ExamSeriesStatuses.Published, StringComparison.OrdinalIgnoreCase))
            {
                if (!string.Equals(current, ExamSeriesStatuses.Scheduled, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only scheduled exam series can be published.");
                return;
            }

            if (string.Equals(target, ExamSeriesStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(current, ExamSeriesStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series is already cancelled.");
                return;
            }

            if (string.Equals(target, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(current, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Results are already published.");
                if (!string.Equals(current, ExamSeriesStatuses.Published, StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(current, ExamSeriesStatuses.InProgress, StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(current, ExamSeriesStatuses.Completed, StringComparison.OrdinalIgnoreCase))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "Exam series must be published or completed before publishing results.");
                }
                return;
            }

            if (string.Equals(target, ExamSeriesStatuses.Completed, StringComparison.OrdinalIgnoreCase)
                && string.Equals(current, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            throw new AppException(AppException.ErrorCodes.BadRequest, $"Invalid exam series status transition to {target}.");
        }

        public async Task<ExamValidationResult> ValidateSeriesAsync(IDb db, string orgId, string seriesId)
        {
            var result = new ExamValidationResult();
            var series = await LoadSeriesTransaction(db, orgId, seriesId);
            if (series == null)
            {
                result.errors.Add("Exam series not found.");
                return result;
            }

            var terms = await termService.SelectTransaction(db, new TermSelectReq { id = series.termid, organizationid = orgId });
            var term = terms.FirstOrDefault();
            if (term == null)
            {
                result.errors.Add("Term not found for this exam series.");
                return result;
            }

            result.Merge(ValidateSeriesDatesAgainstTerm(series, term));

            var sessions = await LoadSessionsForSeriesTransaction(db, orgId, seriesId);

            if (sessions.Count == 0)
                result.errors.Add("Add at least one exam session before scheduling or publishing.");

            var calendar = await LoadCalendarContextTransaction(db, orgId, series.termid);
            var halfDayLatestEnd = await examOrganizationTimeService.GetExamHalfDayLatestEndAsync(db, orgId);
            foreach (var session in sessions)
            {
                var sessionResult = await ValidateSessionCoreAsync(
                    db, orgId, series, term, session, calendar, sessions, session.id, halfDayLatestEnd);
                result.Merge(sessionResult);
            }

            return result;
        }

        public async Task<ExamValidationResult> ValidateSessionForSaveAsync(IDb db, string orgId, ExamSession session)
        {
            var result = await ValidateSessionAsync(db, orgId, session);
            if (!result.isvalid)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, string.Join(" ", result.errors));
            }

            return result;
        }

        public async Task<ExamValidationResult> ValidateSessionAsync(IDb db, string orgId, ExamSession session)
        {
            var series = await LoadSeriesTransaction(db, orgId, session.examseriesid);
            if (series == null)
            {
                return new ExamValidationResult { errors = { "Exam series not found." } };
            }

            var terms = await termService.SelectTransaction(db, new TermSelectReq { id = series.termid, organizationid = orgId });
            var term = terms.FirstOrDefault();
            if (term == null)
            {
                return new ExamValidationResult { errors = { "Term not found for this exam series." } };
            }

            var calendar = await LoadCalendarContextTransaction(db, orgId, series.termid);
            var halfDayLatestEnd = await examOrganizationTimeService.GetExamHalfDayLatestEndAsync(db, orgId);
            var peerSessions = await LoadSessionsForSeriesTransaction(db, orgId, series.id);

            return await ValidateSessionCoreAsync(
                db, orgId, series, term, session, calendar, peerSessions, session.id, halfDayLatestEnd);
        }

        public async Task AssertSeriesReadyForLifecycleAsync(IDb db, string orgId, string seriesId)
        {
            var validation = await ValidateSeriesAsync(db, orgId, seriesId);
            if (!validation.isvalid)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, string.Join(" ", validation.errors));
            }
        }

        private async Task<ExamValidationResult> ValidateSessionCoreAsync(
            IDb db,
            string orgId,
            ExamSeries series,
            Term term,
            ExamSession session,
            ExamCalendarContext calendar,
            List<ExamSession> peerSessions,
            string? excludeSessionId,
            TimeSpan halfDayLatestEnd)
        {
            var result = new ExamValidationResult();

            if (session.examdate.Date < series.startdate.Date || session.examdate.Date > series.enddate.Date)
                result.errors.Add("Exam date must fall within the exam series date range.");

            if (session.examdate.Date < term.startdate.Date || session.examdate.Date > term.enddate.Date)
                result.errors.Add("Exam date must fall within the term date range.");

            var dayType = ExamCalendarRules.ResolveDayTypeForDate(
                session.examdate, calendar.dayOverrides, calendar.weeklyRules);
            var calendarError = ExamCalendarRules.ValidateSessionAgainstDayType(
                dayType, session.starttime, session.endtime, halfDayLatestEnd);
            if (calendarError != null)
                result.errors.Add(calendarError);

            if (!ExamSessionDurationRules.DurationMatchesTimeRange(session.starttime, session.endtime, session.durationminutes))
            {
                result.errors.Add("Duration must match the difference between start and end time.");
            }

            var overlapErrors = await DetectStudentOverlapsAsync(
                db, orgId, session, peerSessions, excludeSessionId);
            result.errors.AddRange(overlapErrors);

            return result;
        }

        private async Task<List<string>> DetectStudentOverlapsAsync(
            IDb db,
            string orgId,
            ExamSession session,
            List<ExamSession> peerSessions,
            string? excludeSessionId)
        {
            var errors = new List<string>();
            var classIds = session.classids.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (classIds.Count == 0)
                return errors;

            var studentsInSession = await LoadCurrentStudentIdsByClassesTransaction(db, orgId, classIds);
            if (studentsInSession.Count == 0)
                return errors;

            foreach (var other in peerSessions)
            {
                if (!string.IsNullOrWhiteSpace(excludeSessionId)
                    && string.Equals(other.id, excludeSessionId, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (string.Equals(other.status, ExamSessionStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!ExamOverlapRules.SessionsOverlapOnDate(session, other))
                    continue;

                var otherClassIds = other.classids.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                if (otherClassIds.Count == 0)
                    continue;

                var studentsOther = await LoadCurrentStudentIdsByClassesTransaction(db, orgId, otherClassIds);
                var overlap = studentsInSession.Intersect(studentsOther, StringComparer.OrdinalIgnoreCase).Take(3).ToList();
                if (overlap.Count == 0)
                    continue;

                var sample = string.Join(", ", overlap);
                errors.Add(
                    $"Student timetable conflict on {session.examdate:yyyy-MM-dd} with another exam session ({other.subjectid}). Overlapping students include: {sample}.");
            }

            return errors;
        }

        private async Task<HashSet<string>> LoadCurrentStudentIdsByClassesTransaction(IDb db, string orgId, List<string> classIds)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var classId in classIds)
            {
                var rows = await studentEnrollmentService.SelectTransaction(db, new StudentEnrollmentSelectReq
                {
                    organizationid = orgId,
                    classid = classId,
                    iscurrent = true,
                });
                foreach (var row in rows)
                {
                    if (!string.IsNullOrWhiteSpace(row.studentid))
                        set.Add(row.studentid.Trim());
                }
            }
            return set;
        }

        private async Task<ExamCalendarContext> LoadCalendarContextTransaction(IDb db, string orgId, string termId)
        {
            var weekly = new List<(int weekday, string dayType)>();
            const string weeklyQuery = @"
                SELECT weekday, day_type FROM school_calendar_weekly_rules
                WHERE organization_id = @organization_id AND term_id = @term_id AND is_active = true";
            var weeklyCmd = db.GetCommand(weeklyQuery);
            db.AddParameter(weeklyCmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(weeklyCmd, "term_id", DbTypes.Types.String).Value = termId;
            using (var reader = await db.Execute(weeklyCmd))
            {
                while (await reader.ReadAsync())
                {
                    weekly.Add((
                        reader["weekday"] == DBNull.Value ? 0 : Convert.ToInt32(reader["weekday"]),
                        reader["day_type"]?.ToString() ?? ""));
                }
            }

            var overrides = new List<(DateTime date, string dayType)>();
            const string overrideQuery = @"
                SELECT calendar_date, day_type FROM school_calendar_day_overrides
                WHERE organization_id = @organization_id AND term_id = @term_id AND is_active = true";
            var overrideCmd = db.GetCommand(overrideQuery);
            db.AddParameter(overrideCmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(overrideCmd, "term_id", DbTypes.Types.String).Value = termId;
            using (var reader = await db.Execute(overrideCmd))
            {
                while (await reader.ReadAsync())
                {
                    overrides.Add((
                        reader["calendar_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["calendar_date"]),
                        reader["day_type"]?.ToString() ?? ""));
                }
            }

            return new ExamCalendarContext { weeklyRules = weekly, dayOverrides = overrides };
        }

        private async Task<ExamSeries?> LoadSeriesTransaction(IDb db, string orgId, string seriesId)
        {
            const string query = @"
                SELECT id, organization_id, term_id, academic_year, name, exam_type_ref_id,
                       start_date, end_date, status, instructions,
                       published_at, published_by, cancelled_at, cancelled_by, cancel_reason,
                       is_active, created_at, updated_at, created_by, updated_by
                FROM exam_series
                WHERE id = @id AND organization_id = @organization_id AND is_active = true
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = seriesId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;
            return new ExamSeries
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                termid = reader["term_id"]?.ToString() ?? "",
                academicyear = reader["academic_year"]?.ToString() ?? "",
                name = reader["name"]?.ToString() ?? "",
                examtyperefid = reader["exam_type_ref_id"]?.ToString() ?? "",
                startdate = reader["start_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["start_date"]),
                enddate = reader["end_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["end_date"]),
                status = reader["status"]?.ToString() ?? "",
                instructions = reader["instructions"]?.ToString() ?? "",
            };
        }

        private async Task<List<ExamSession>> LoadSessionsForSeriesTransaction(IDb db, string orgId, string seriesId)
        {
            const string query = @"
                SELECT id, organization_id, exam_series_id, subject_id, exam_date,
                       start_time, end_time, duration_minutes, max_marks, passing_marks,
                       instructions, status, marks_status,
                       created_at, updated_at, created_by, updated_by
                FROM exam_sessions
                WHERE organization_id = @organization_id AND exam_series_id = @exam_series_id
                ORDER BY exam_date, start_time";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_series_id", DbTypes.Types.String).Value = seriesId;
            var list = new List<ExamSession>();
            using (var reader = await db.Execute(cmd))
            {
                while (await reader.ReadAsync())
                    list.Add(MapSessionRow(reader));
            }
            foreach (var session in list)
                session.classids = new List<string>();
            await ExamSessionClassIds.AttachBatchAsync(db, orgId, list);
            return list;
        }

        private static ExamSession MapSessionRow(DbDataReader reader)
        {
            return new ExamSession
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                examseriesid = reader["exam_series_id"]?.ToString() ?? "",
                subjectid = reader["subject_id"]?.ToString() ?? "",
                examdate = reader["exam_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["exam_date"]),
                starttime = ExamDbReader.ReadTimeSpan(reader, "start_time"),
                endtime = ExamDbReader.ReadTimeSpan(reader, "end_time"),
                durationminutes = reader["duration_minutes"] == DBNull.Value ? 0 : Convert.ToInt32(reader["duration_minutes"]),
                maxmarks = reader["max_marks"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["max_marks"]),
                passingmarks = reader["passing_marks"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["passing_marks"]),
                instructions = reader["instructions"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "",
                marksstatus = reader["marks_status"]?.ToString() ?? "",
            };
        }

        private async Task<List<string>> LoadSessionClassIdsTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                SELECT class_id FROM exam_session_classes
                WHERE organization_id = @organization_id AND exam_session_id = @exam_session_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            var list = new List<string>();
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
                list.Add(reader["class_id"]?.ToString() ?? "");
            return list;
        }

        private sealed class ExamCalendarContext
        {
            public List<(int weekday, string dayType)> weeklyRules { get; set; } = new();
            public List<(DateTime date, string dayType)> dayOverrides { get; set; } = new();
        }
    }
}
