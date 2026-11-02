using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class PageService
    {
        private static readonly string[] Weekdays =
        {
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        };

        private static readonly string[] DefaultTimeSlots =
        {
            "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
            "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
        };

        private static readonly string[] ScheduleColors = { "primary", "secondary", "accent", "purple" };

        private static readonly string[] RequiredOnboardingCategories =
        {
            "academic_year", "grade", "class_section", "subject", "department"
        };

        private readonly IDbProvider dbprovider;
        private readonly RequestState requeststate;
        private readonly ClassService classService;
        private readonly StaffService staffService;
        private readonly StudentService studentService;
        private readonly StudentEnrollmentService studentEnrollmentService;
        private readonly StaffScheduleService staffScheduleService;
        private readonly ReferenceValueService referenceValueService;
        private readonly TermService termService;
        private readonly AttendanceService attendanceService;
        private readonly DashboardService dashboardService;
        private readonly StaffLeaveService staffLeaveService;
        private readonly StaffReplacementService staffReplacementService;
        private readonly GradePeriodService gradePeriodService;
        private readonly AdmissionNumberService admissionNumberService;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamSeriesService examSeriesService;
        private readonly ExamSessionService examSessionService;
        private readonly ExamOrganizationTimeService examOrganizationTimeService;

        public PageService(
            IDbProvider dbprovider,
            RequestState requeststate,
            ClassService classService,
            StaffService staffService,
            StudentService studentService,
            StudentEnrollmentService studentEnrollmentService,
            StaffScheduleService staffScheduleService,
            ReferenceValueService referenceValueService,
            TermService termService,
            AttendanceService attendanceService,
            DashboardService dashboardService,
            StaffLeaveService staffLeaveService,
            StaffReplacementService staffReplacementService,
            GradePeriodService gradePeriodService,
            AdmissionNumberService admissionNumberService,
            OrganizationIdResolver organizationIdResolver,
            ExamSeriesService examSeriesService,
            ExamSessionService examSessionService,
            ExamOrganizationTimeService examOrganizationTimeService)
        {
            this.dbprovider = dbprovider;
            this.requeststate = requeststate;
            this.classService = classService;
            this.staffService = staffService;
            this.studentService = studentService;
            this.studentEnrollmentService = studentEnrollmentService;
            this.staffScheduleService = staffScheduleService;
            this.referenceValueService = referenceValueService;
            this.termService = termService;
            this.attendanceService = attendanceService;
            this.dashboardService = dashboardService;
            this.staffLeaveService = staffLeaveService;
            this.staffReplacementService = staffReplacementService;
            this.gradePeriodService = gradePeriodService;
            this.admissionNumberService = admissionNumberService;
            this.organizationIdResolver = organizationIdResolver;
            this.examSeriesService = examSeriesService;
            this.examSessionService = examSessionService;
            this.examOrganizationTimeService = examOrganizationTimeService;
        }

        public async Task<StaffDashboardPageRes> GetStaffDashboardPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);
            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);

            var assignedClasses = await classService.GetAssignedToStaff(new ClassAssignedToStaffReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var allSchedules = await staffScheduleService.Select(new StaffScheduleSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var (schedules, classById) = FilterSchedulesForStaff(assignedClasses, allSchedules);

            var now = DateTime.Now;
            var todayKey = NormalizeWeekday(now.ToString("dddd", CultureInfo.InvariantCulture));
            var todaySchedules = schedules
                .Where(s => string.Equals(NormalizeWeekday(s.day), todayKey, StringComparison.OrdinalIgnoreCase))
                .OrderBy(s => s.starttime)
                .ToList();

            var todayClasses = todaySchedules.Select(slot =>
            {
                classById.TryGetValue(slot.classid ?? "", out var cls);
                var status = ResolveClassSlotStatus(now, slot.starttime, slot.endtime);
                return new StaffTodayClassItem
                {
                    subject = slot.subject ?? "Lesson",
                    classname = cls?.name ?? slot.classname ?? "Class",
                    time = FormatTimeRange(FormatTimeSpan(slot.starttime), FormatTimeSpan(slot.endtime)),
                    status = status,
                };
            }).ToList();

            var assignedClassIds = classById.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var enrollments = await GetCurrentEnrollmentsForClasses(orgId, assignedClassIds);
            var totalStudents = enrollments
                .Select(e => e.studentid)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .LongCount();

            var classesToday = todaySchedules.Count;
            var attendanceMarked = await BuildAttendanceMarkedAsync(orgId, todaySchedules);
            var nextClassIn = BuildNextClassIn(now, todaySchedules);

            return new StaffDashboardPageRes
            {
                totalstudents = totalStudents,
                classestoday = classesToday,
                attendancemarked = attendanceMarked,
                nextclassin = nextClassIn,
                todayclasses = todayClasses,
            };
        }

        public Task<AdminDashboardPageRes> GetAdminDashboardPage(PageReq req) =>
            dashboardService.GetAdminDashboardPage(new AdminDashboardPageReq
            {
                organizationid = ResolveOrganizationId(req.organizationid),
            });

        public Task<PlatformDashboardPageRes> GetPlatformDashboardPage(PageReq req) =>
            dashboardService.GetPlatformDashboardPage(req.email ?? "");

        public Task<PlatformStudentPricingConfig> SavePlatformStudentPricing(PlatformStudentPricingSaveReq req) =>
            dashboardService.SavePlatformStudentPricing(req ?? new PlatformStudentPricingSaveReq());

        public async Task<StaffClassesPageRes> GetStaffClassesPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);
            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);

            var assignedClasses = await classService.GetAssignedToStaff(new ClassAssignedToStaffReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var schedules = await staffScheduleService.Select(new StaffScheduleSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var assignedClassIds = assignedClasses
                .Select(c => c.id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var scheduleClassIds = schedules
                .Select(s => s.classid)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var allOrgClasses = await classService.Select(new ClassSelectReq { organizationid = orgId });
            var visibleClasses = allOrgClasses
                .Where(c =>
                    !string.IsNullOrWhiteSpace(c.id)
                    && (assignedClassIds.Contains(c.id) || scheduleClassIds.Contains(c.id)))
                .OrderBy(c => c.name ?? "", StringComparer.OrdinalIgnoreCase)
                .ToList();

            var enrollments = await GetCurrentEnrollmentsForClasses(
                orgId,
                visibleClasses.Select(c => c.id).ToHashSet(StringComparer.OrdinalIgnoreCase));
            var studentsByClass = enrollments
                .GroupBy(e => e.classid ?? "", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

            var cards = assignedClasses.Select(cls =>
            {
                var classSchedules = schedules
                    .Where(s => string.Equals(s.classid, cls.id, StringComparison.OrdinalIgnoreCase))
                    .ToList();
                var subjects = classSchedules
                    .Select(s => s.subject)
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Distinct(StringComparer.OrdinalIgnoreCase);
                var scheduleDays = classSchedules
                    .Select(s => s.day)
                    .Where(d => !string.IsNullOrWhiteSpace(d))
                    .Distinct(StringComparer.OrdinalIgnoreCase);
                var firstTimeRange = classSchedules.FirstOrDefault() is { } first
                    ? FormatTimeRange(FormatTimeSpan(first.starttime), FormatTimeSpan(first.endtime))
                    : "";

                return new StaffClassCardItem
                {
                    id = cls.id ?? "",
                    name = cls.name ?? "",
                    subject = string.Join(", ", subjects).Trim().Length > 0 ? string.Join(", ", subjects) : "N/A",
                    students = studentsByClass.TryGetValue(cls.id ?? "", out var count) ? count : 0,
                    room = string.IsNullOrWhiteSpace(cls.room) ? "N/A" : cls.room,
                    schedule = scheduleDays.Any()
                        ? $"{string.Join(", ", scheduleDays)}{(string.IsNullOrWhiteSpace(firstTimeRange) ? "" : $" - {firstTimeRange}")}"
                        : "N/A",
                };
            }).ToList();

            var totalMinutes = schedules.Sum(s => Math.Max(0, (s.endtime - s.starttime).TotalMinutes));
            var totalStudents = cards.Sum(c => c.students);

            return new StaffClassesPageRes
            {
                totalstudents = totalStudents,
                totalhours = (long)Math.Round(totalMinutes / 60.0, MidpointRounding.AwayFromZero),
                classes = cards,
            };
        }

        public async Task<StaffStudentsPageRes> GetStaffStudentsPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);
            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);

            var assignedClasses = await classService.GetAssignedToStaff(new ClassAssignedToStaffReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var assignedClassIds = assignedClasses
                .Select(c => c.id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var allEnrollments = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                iscurrent = true,
            });

            var students = allEnrollments
                .Where(e => assignedClassIds.Contains(e.classid ?? ""))
                .GroupBy(e => e.enrollmentid ?? "", StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .Select(e => new StaffStudentRowItem
                {
                    enrollmentid = e.enrollmentid,
                    studentid = e.studentid,
                    admissionnumber = e.admissionnumber,
                    firstname = e.firstname,
                    lastname = e.lastname,
                    fullname = e.fullname,
                    email = e.email,
                    phone = e.phone,
                    academicyear = e.academicyear,
                    classid = e.classid,
                    classname = e.classname,
                    grade = e.grade,
                    section = e.section,
                    rollnumber = e.rollnumber,
                    enrollmentstatus = e.enrollmentstatus,
                    status = e.status,
                    iscurrent = e.iscurrent,
                    studentstatus = e.studentstatus,
                    admissiondate = e.admissiondate,
                    joineddate = e.joineddate,
                    displayname = ResolveDisplayName(e.firstname, e.lastname, e.fullname, e.email),
                })
                .ToList();

            var classOptions = assignedClasses.Select(c => new StaffClassOptionItem
            {
                id = c.id ?? "",
                name = c.name ?? "",
                grade = ResolveRefName(refs, "grade", c.grade) is var gradeName && !string.IsNullOrWhiteSpace(gradeName)
                    ? gradeName
                    : c.grade ?? "",
                section = ResolveRefName(refs, "class_section", c.section) is var sectionName && !string.IsNullOrWhiteSpace(sectionName)
                    ? sectionName
                    : c.section ?? "",
                academicyear = ResolveRefName(refs, "academic_year", c.academicyear) is var yearName && !string.IsNullOrWhiteSpace(yearName)
                    ? yearName
                    : c.academicyear ?? "",
            }).ToList();

            return new StaffStudentsPageRes
            {
                staffid = staffId,
                students = students,
                classes = classOptions,
                referencevalues = refs,
                academicyears = assignedClasses
                    .Select(c => c.academicyear)
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(v => v, StringComparer.OrdinalIgnoreCase)
                    .ToList(),
                sections = assignedClasses
                    .Select(c => c.section)
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(v => v, StringComparer.OrdinalIgnoreCase)
                    .ToList(),
            };
        }

        public async Task<StaffSchedulePageRes> GetStaffSchedulePage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);
            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);

            var schedules = await staffScheduleService.Select(new StaffScheduleSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var leaves = await staffLeaveService.Select(new StaffLeaveSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var replacements = await staffReplacementService.Select(new StaffReplacementSelectReq
            {
                organizationid = orgId,
            });

            var classes = await classService.Select(new ClassSelectReq { organizationid = orgId });
            var classById = classes.ToDictionary(
                c => c.id ?? "",
                c => c,
                StringComparer.OrdinalIgnoreCase);

            var timeSlots = new List<string>();

            string ResolveTimeSlot(StaffSchedule schedule)
            {
                return ResolveScheduleGridTimeSlot(timeSlots, schedule.starttime, schedule.endtime);
            }

            var now = DateTime.Now;
            var selectedDate = ParsePageDate(req.date, now.Date);
            var viewDay = NormalizeWeekday(selectedDate.ToString("dddd", CultureInfo.InvariantCulture));
            var selectedYmd = selectedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

            var onLeaveForDate = leaves.FirstOrDefault(l =>
                string.Equals(l.status, "approved", StringComparison.OrdinalIgnoreCase) &&
                l.isactive &&
                selectedDate >= l.startdate.Date &&
                selectedDate <= l.enddate.Date);

            var dateReplacements = replacements
                .Where(r =>
                    r.isactive &&
                    string.Equals(r.status, "active", StringComparison.OrdinalIgnoreCase) &&
                    DatesEqual(r.date, selectedDate))
                .ToList();

            var replacementByScheduleId = dateReplacements
                .GroupBy(r => r.scheduleid ?? "", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var substituteReplacements = dateReplacements
                .Where(r => string.Equals(r.replacementteacherid, staffId, StringComparison.OrdinalIgnoreCase))
                .ToList();

            var substituteSchedulesById = new Dictionary<string, StaffSchedule>(StringComparer.OrdinalIgnoreCase);
            foreach (var replacement in substituteReplacements)
            {
                var scheduleId = replacement.scheduleid ?? "";
                if (string.IsNullOrWhiteSpace(scheduleId) ||
                    substituteSchedulesById.ContainsKey(scheduleId))
                    continue;

                var substituteSchedules = await staffScheduleService.Select(new StaffScheduleSelectReq
                {
                    id = scheduleId,
                    organizationid = orgId,
                });
                var schedule = substituteSchedules.FirstOrDefault();
                if (schedule == null)
                    continue;
                if (!string.Equals(NormalizeWeekday(schedule.day), viewDay, StringComparison.OrdinalIgnoreCase))
                    continue;

                substituteSchedulesById[scheduleId] = schedule;
            }

            var schedulesForTimeSlots = schedules
                .Concat(substituteSchedulesById.Values)
                .GroupBy(s => s.id ?? "", StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .ToList();

            timeSlots = await BuildStaffScheduleTimeSlots(orgId, schedulesForTimeSlots, classById);

            // Weekly template grid (default timetable — unchanged by date)
            var cells = new List<StaffScheduleGridCell>();
            foreach (var schedule in schedules)
            {
                var day = NormalizeWeekday(schedule.day);
                if (string.IsNullOrWhiteSpace(day))
                    continue;

                var slot = ResolveTimeSlot(schedule);
                if (string.IsNullOrWhiteSpace(slot))
                    continue;

                var isViewDay = string.Equals(day, viewDay, StringComparison.OrdinalIgnoreCase);
                cells.Add(new StaffScheduleGridCell
                {
                    scheduleid = schedule.id ?? "",
                    day = day,
                    timeslot = slot,
                    subject = string.IsNullOrWhiteSpace(schedule.subject) ? "Lesson" : schedule.subject,
                    classname = schedule.classname ?? "N/A",
                    room = string.IsNullOrWhiteSpace(schedule.room) ? "N/A" : schedule.room,
                    color = ResolveScheduleColor(schedule.classid),
                    istoday = isViewDay,
                    itemtype = "regular",
                });
            }

            // Effective timetable for the selected date (default + leave + substitute)
            var todayItems = new List<StaffScheduleTodayItem>();

            foreach (var schedule in schedules
                .Where(s => string.Equals(NormalizeWeekday(s.day), viewDay, StringComparison.OrdinalIgnoreCase))
                .OrderBy(s => s.starttime))
            {
                replacementByScheduleId.TryGetValue(schedule.id ?? "", out var replacement);

                var itemType = "regular";
                var replacementTeacher = "";
                var note = "";

                if (replacement != null)
                {
                    itemType = "covered";
                    replacementTeacher = replacement.replacementteachername ?? "";
                    note = string.IsNullOrWhiteSpace(replacementTeacher)
                        ? "Substitute assigned"
                        : $"Covered by {replacementTeacher}";
                }
                else if (onLeaveForDate != null)
                {
                    itemType = "on_leave";
                    note = $"{onLeaveForDate.leavetype} leave — awaiting substitute";
                }

                var coveredSubject = replacement != null && !string.IsNullOrWhiteSpace(replacement.subject)
                    ? replacement.subject
                    : null;
                todayItems.Add(BuildStaffScheduleTodayItem(
                    schedule,
                    timeSlots,
                    selectedDate,
                    now,
                    itemType,
                    replacementTeacher,
                    "",
                    onLeaveForDate?.leavetype ?? "",
                    note,
                    coveredSubject));
            }

            var todayItemScheduleIds = todayItems
                .Select(t => t.scheduleid ?? "")
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var replacement in substituteReplacements)
            {
                var scheduleId = replacement.scheduleid ?? "";
                if (string.IsNullOrWhiteSpace(scheduleId) ||
                    !substituteSchedulesById.TryGetValue(scheduleId, out var schedule) ||
                    todayItemScheduleIds.Contains(scheduleId))
                    continue;

                var originalTeacher = replacement.originalteachername ?? schedule.staffname ?? "Teacher";
                var substituteSubject = string.IsNullOrWhiteSpace(replacement.subject) ? null : replacement.subject;
                todayItems.Add(BuildStaffScheduleTodayItem(
                    schedule,
                    timeSlots,
                    selectedDate,
                    now,
                    "substitute",
                    "",
                    originalTeacher,
                    "",
                    $"Substitute for {originalTeacher}",
                    substituteSubject));
                todayItemScheduleIds.Add(scheduleId);
            }

            todayItems = todayItems
                .OrderBy(i => i.sortorder)
                .ThenBy(i => i.time, StringComparer.OrdinalIgnoreCase)
                .ToList();

            MergeStaffScheduleDateOverlays(cells, todayItems, viewDay);

            return new StaffSchedulePageRes
            {
                date = selectedYmd,
                todayday = viewDay,
                onleavetoday = onLeaveForDate != null,
                leavetype = onLeaveForDate?.leavetype ?? "",
                weekdays = Weekdays.ToList(),
                timeslots = timeSlots,
                cells = cells,
                todayitems = todayItems,
            };
        }

        public async Task<StudentTimetablePageRes> GetStudentTimetablePage(StudentTimetablePageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);
            var studentId = req.studentid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(studentId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Student ID is required.");

            var enrollmentRows = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                studentid = studentId,
                iscurrent = true,
            });
            var enrollment = enrollmentRows.FirstOrDefault();

            var selectedDate = ParsePageDate(req.date, DateTime.Now.Date);
            var viewDay = NormalizeWeekday(selectedDate.ToString("dddd", CultureInfo.InvariantCulture));
            var selectedYmd = selectedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (enrollment == null || string.IsNullOrWhiteSpace(enrollment.classid))
            {
                return new StudentTimetablePageRes
                {
                    studentid = studentId,
                    date = selectedYmd,
                    todayday = viewDay,
                    weekdays = Weekdays.ToList(),
                    timeslots = DefaultTimeSlots.ToList(),
                };
            }

            var classId = enrollment.classid ?? "";
            var schedules = await staffScheduleService.Select(new StaffScheduleSelectReq
            {
                organizationid = orgId,
                classid = classId,
            });

            var classes = await classService.Select(new ClassSelectReq { organizationid = orgId });
            var classById = classes.ToDictionary(
                c => c.id ?? "",
                c => c,
                StringComparer.OrdinalIgnoreCase);

            var timeSlots = await BuildStaffScheduleTimeSlots(orgId, schedules, classById);

            var replacements = await staffReplacementService.Select(new StaffReplacementSelectReq
            {
                organizationid = orgId,
            });
            var dateReplacements = replacements
                .Where(r =>
                    r.isactive &&
                    string.Equals(r.status, "active", StringComparison.OrdinalIgnoreCase) &&
                    DatesEqual(r.date, selectedDate))
                .ToList();
            var replacementByScheduleId = dateReplacements
                .GroupBy(r => r.scheduleid ?? "", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var leaves = await staffLeaveService.Select(new StaffLeaveSelectReq
            {
                organizationid = orgId,
                status = "approved",
            });

            var cells = new List<StudentTimetableGridCell>();
            foreach (var schedule in schedules)
            {
                var day = NormalizeWeekday(schedule.day);
                if (string.IsNullOrWhiteSpace(day))
                    continue;

                var slot = ResolveScheduleGridTimeSlot(timeSlots, schedule.starttime, schedule.endtime);
                if (string.IsNullOrWhiteSpace(slot))
                    continue;

                cells.Add(new StudentTimetableGridCell
                {
                    scheduleid = schedule.id ?? "",
                    day = day,
                    timeslot = slot,
                    time = FormatDisplayTimeRange(schedule.starttime, schedule.endtime),
                    subject = string.IsNullOrWhiteSpace(schedule.subject) ? "Lesson" : schedule.subject,
                    staffname = schedule.staffname ?? "",
                    room = string.IsNullOrWhiteSpace(schedule.room) ? "N/A" : schedule.room,
                    istoday = string.Equals(day, viewDay, StringComparison.OrdinalIgnoreCase),
                    itemtype = "regular",
                });
            }

            var todayItems = new List<StudentTimetableTodayItem>();
            foreach (var schedule in schedules
                .Where(s => string.Equals(NormalizeWeekday(s.day), viewDay, StringComparison.OrdinalIgnoreCase))
                .OrderBy(s => s.starttime))
            {
                replacementByScheduleId.TryGetValue(schedule.id ?? "", out var replacement);
                var leave = FindApprovedLeaveForDate(leaves, schedule.staffid, selectedDate);

                var itemType = "regular";
                var staffName = schedule.staffname ?? "";
                var replacementTeacher = "";
                var originalTeacher = "";
                var leaveType = "";
                var note = "";
                var subject = string.IsNullOrWhiteSpace(schedule.subject) ? "Lesson" : schedule.subject;

                if (replacement != null)
                {
                    itemType = "covered";
                    replacementTeacher = replacement.replacementteachername ?? "";
                    originalTeacher = replacement.originalteachername ?? schedule.staffname ?? "";
                    staffName = string.IsNullOrWhiteSpace(replacementTeacher) ? staffName : replacementTeacher;
                    if (!string.IsNullOrWhiteSpace(replacement.subject))
                        subject = replacement.subject!;
                    note = string.IsNullOrWhiteSpace(replacementTeacher)
                        ? "Substitute assigned"
                        : $"Covered by {replacementTeacher}";
                }
                else if (leave != null)
                {
                    itemType = "on_leave";
                    leaveType = leave.leavetype ?? "";
                    note = $"{leave.leavetype} leave — substitute may be assigned";
                }

                todayItems.Add(new StudentTimetableTodayItem
                {
                    scheduleid = schedule.id ?? "",
                    subject = subject,
                    staffname = staffName,
                    room = string.IsNullOrWhiteSpace(schedule.room) ? "N/A" : schedule.room,
                    timeslot = ResolveScheduleGridTimeSlot(timeSlots, schedule.starttime, schedule.endtime),
                    time = FormatDisplayTimeRange(schedule.starttime, schedule.endtime),
                    itemtype = itemType,
                    replacementteachername = replacementTeacher,
                    originalteachername = originalTeacher,
                    leavetype = leaveType,
                    note = note,
                    status = ResolveSlotStatusForDate(selectedDate, DateTime.Now, schedule.starttime, schedule.endtime),
                    sortorder = (int)schedule.starttime.TotalMinutes,
                });
            }

            todayItems = todayItems
                .OrderBy(i => i.sortorder)
                .ThenBy(i => i.time, StringComparer.OrdinalIgnoreCase)
                .ToList();

            MergeStudentTimetableDateOverlays(cells, todayItems, viewDay);

            var studentName = enrollment.fullname?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(studentName))
                studentName = $"{enrollment.firstname} {enrollment.lastname}".Trim();

            return new StudentTimetablePageRes
            {
                studentid = studentId,
                studentname = studentName,
                classid = classId,
                classname = enrollment.classname ?? "",
                grade = enrollment.grade ?? "",
                section = enrollment.section ?? "",
                date = selectedYmd,
                todayday = viewDay,
                weekdays = Weekdays.ToList(),
                timeslots = timeSlots,
                cells = cells,
                todayitems = todayItems,
            };
        }

        private static StaffLeave? FindApprovedLeaveForDate(List<StaffLeave> leaves, string staffId, DateTime date)
        {
            if (string.IsNullOrWhiteSpace(staffId))
                return null;

            return leaves.FirstOrDefault(l =>
                l.isactive &&
                string.Equals(l.staffid, staffId, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(l.status, "approved", StringComparison.OrdinalIgnoreCase) &&
                date.Date >= l.startdate.Date &&
                date.Date <= l.enddate.Date);
        }

        private static void MergeStudentTimetableDateOverlays(
            List<StudentTimetableGridCell> cells,
            List<StudentTimetableTodayItem> todayItems,
            string viewDay)
        {
            foreach (var item in todayItems)
            {
                var scheduleId = item.scheduleid ?? "";
                var existing = cells.FirstOrDefault(c =>
                    string.Equals(c.day, viewDay, StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(scheduleId) &&
                    string.Equals(c.scheduleid, scheduleId, StringComparison.OrdinalIgnoreCase));

                if (existing == null)
                    continue;

                existing.itemtype = item.itemtype;
                existing.subject = item.subject;
                existing.staffname = item.staffname;
                existing.replacementteachername = item.replacementteachername;
                existing.originalteachername = item.originalteachername;
                existing.note = item.note;
                existing.istoday = true;
            }
        }

        private static void MergeStaffScheduleDateOverlays(
            List<StaffScheduleGridCell> cells,
            List<StaffScheduleTodayItem> todayItems,
            string viewDay)
        {
            foreach (var item in todayItems)
            {
                var slot = item.timeslot;
                if (string.IsNullOrWhiteSpace(slot))
                    continue;

                var scheduleId = item.scheduleid ?? "";
                var existing = cells.FirstOrDefault(c =>
                    string.Equals(c.day, viewDay, StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(scheduleId) &&
                    string.Equals(c.scheduleid, scheduleId, StringComparison.OrdinalIgnoreCase));

                if (existing != null)
                {
                    ApplyStaffScheduleOverlayToCell(existing, item);
                    continue;
                }

                if (!string.Equals(item.itemtype, "substitute", StringComparison.OrdinalIgnoreCase))
                    continue;

                var slotOccupied = cells.Any(c =>
                    string.Equals(c.day, viewDay, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(c.timeslot, slot, StringComparison.OrdinalIgnoreCase));
                if (slotOccupied)
                    continue;

                cells.Add(new StaffScheduleGridCell
                {
                    scheduleid = scheduleId,
                    day = viewDay,
                    timeslot = slot,
                    subject = item.subject,
                    classname = item.classname,
                    room = item.room,
                    color = item.color,
                    istoday = true,
                    itemtype = item.itemtype,
                    replacementteachername = item.replacementteachername,
                    originalteachername = item.originalteachername,
                    note = item.note,
                });
            }
        }

        private static void ApplyStaffScheduleOverlayToCell(StaffScheduleGridCell cell, StaffScheduleTodayItem item)
        {
            cell.itemtype = item.itemtype;
            cell.subject = item.subject;
            cell.replacementteachername = item.replacementteachername;
            cell.originalteachername = item.originalteachername;
            cell.note = item.note;
            cell.istoday = true;
            if (string.Equals(item.itemtype, "substitute", StringComparison.OrdinalIgnoreCase))
                cell.color = item.color;
            else if (string.Equals(item.itemtype, "covered", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(item.itemtype, "on_leave", StringComparison.OrdinalIgnoreCase))
                cell.color = item.color;
        }

        private static DateTime ParsePageDate(string? dateValue, DateTime fallback)
        {
            if (!string.IsNullOrWhiteSpace(dateValue) &&
                DateTime.TryParse(dateValue, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return parsed.Date;
            }

            return fallback.Date;
        }

        private static bool DatesEqual(DateTime left, DateTime right)
        {
            return left.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ==
                   right.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }

        private static StaffScheduleTodayItem BuildStaffScheduleTodayItem(
            StaffSchedule schedule,
            List<string> timeSlots,
            DateTime selectedDate,
            DateTime now,
            string itemType,
            string replacementTeacher,
            string originalTeacher,
            string leaveType,
            string note,
            string? subjectOverride = null)
        {
            var slot = ResolveScheduleGridTimeSlot(timeSlots, schedule.starttime, schedule.endtime);
            var subject = !string.IsNullOrWhiteSpace(subjectOverride)
                ? subjectOverride!
                : string.IsNullOrWhiteSpace(schedule.subject) ? "Lesson" : schedule.subject;
            return new StaffScheduleTodayItem
            {
                scheduleid = schedule.id ?? "",
                subject = subject,
                classname = schedule.classname ?? "N/A",
                room = string.IsNullOrWhiteSpace(schedule.room) ? "N/A" : schedule.room,
                timeslot = slot,
                time = FormatDisplayTimeRange(schedule.starttime, schedule.endtime),
                color = itemType switch
                {
                    "substitute" => "accent",
                    "covered" => "accent",
                    "on_leave" => "secondary",
                    _ => ResolveScheduleColor(schedule.classid),
                },
                itemtype = itemType,
                replacementteachername = replacementTeacher,
                originalteachername = originalTeacher,
                leavetype = leaveType,
                note = note,
                status = ResolveSlotStatusForDate(selectedDate, now, schedule.starttime, schedule.endtime),
                sortorder = (int)schedule.starttime.TotalMinutes,
            };
        }

        private static string ResolveSlotStatusForDate(DateTime selectedDate, DateTime now, TimeSpan start, TimeSpan end)
        {
            if (selectedDate.Date < now.Date)
                return "completed";
            if (selectedDate.Date > now.Date)
                return "scheduled";
            return ResolveClassSlotStatus(now, start, end);
        }

        public async Task<AdminStudentsPageRes> GetAdminStudentsPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var enrollments = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                iscurrent = true,
            });

            var classes = await classService.Select(new ClassSelectReq { organizationid = orgId });

            var rows = enrollments.Select(e =>
            {
                var gradeLabel = !string.IsNullOrWhiteSpace(e.classname)
                    ? e.classname
                    : string.Join("-", new[] { e.grade, e.section }.Where(x => !string.IsNullOrWhiteSpace(x)));
                var yearLabel = ResolveRefName(refs, "academic_year", e.academicyear);
                if (string.IsNullOrWhiteSpace(yearLabel))
                    yearLabel = e.academicyear ?? "";
                if (!string.IsNullOrWhiteSpace(yearLabel))
                    gradeLabel = $"{gradeLabel} ({yearLabel})";

                return new AdminStudentRowItem
                {
                    id = e.studentid ?? "",
                    studentid = !string.IsNullOrWhiteSpace(e.admissionnumber) ? e.admissionnumber : e.studentid ?? "",
                    name = ResolveDisplayName(e.firstname, e.lastname, e.fullname, e.email),
                    grade = gradeLabel.Trim(),
                    email = e.email ?? "",
                    phone = e.phone ?? "",
                    status = string.IsNullOrWhiteSpace(e.status) ? "current" : e.status,
                    enrollmentid = e.enrollmentid ?? "",
                    classid = e.classid ?? "",
                    classname = e.classname ?? "",
                    classgrade = e.grade ?? "",
                    section = e.section ?? "",
                    academicyear = e.academicyear ?? "",
                    rollnumber = e.rollnumber,
                    firstname = e.firstname ?? "",
                    lastname = e.lastname ?? "",
                    admissionnumber = e.admissionnumber ?? "",
                };
            }).ToList();

            var classOptions = classes.Select(c => new StaffClassOptionItem
            {
                id = c.id ?? "",
                name = c.name ?? "",
                grade = ResolveRefName(refs, "grade", c.grade) is var gradeName && !string.IsNullOrWhiteSpace(gradeName)
                    ? gradeName
                    : c.grade ?? "",
                section = ResolveRefName(refs, "class_section", c.section) is var sectionName && !string.IsNullOrWhiteSpace(sectionName)
                    ? sectionName
                    : c.section ?? "",
                academicyear = c.academicyear ?? "",
            }).ToList();

            return new AdminStudentsPageRes
            {
                rows = rows,
                classoptions = classOptions,
                referencevalues = refs,
            };
        }

        public async Task<AdminStaffPageRes> GetAdminStaffPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var staffList = await staffService.Select(new StaffSelectReq { organizationid = orgId });

            var staffRows = staffList.Select(s => new AdminStaffRowItem
            {
                id = s.id ?? "",
                staffid = s.staffid ?? s.id ?? "",
                firstname = s.firstname ?? "",
                lastname = s.lastname ?? "",
                fullname = ResolveDisplayName(s.firstname, s.lastname, s.fullname, s.email),
                email = s.email ?? "",
                phone = s.phone ?? "",
                role = s.role ?? "",
                rolename = ResolveRefName(refs, "staff_role", s.role),
                department = s.department ?? "",
                departmentname = ResolveRefName(refs, "department", s.department),
                status = s.status ?? "",
                subjects = s.subjects_json ?? "",
            }).ToList();

            return new AdminStaffPageRes
            {
                staff = staffRows,
                referencevalues = refs,
            };
        }

        public async Task<AdminTermsPageRes> GetAdminTermsPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var terms = await termService.Select(new TermSelectReq { organizationid = orgId });

            var rows = terms.Select(t => new AdminTermRowItem
            {
                id = t.id ?? "",
                name = t.name ?? "",
                startdate = t.startdate == DateTime.MinValue
                    ? ""
                    : t.startdate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                enddate = t.enddate == DateTime.MinValue
                    ? ""
                    : t.enddate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                status = t.status ?? "",
                academicyear = t.academicyear ?? "",
                academicyearname = ResolveRefName(refs, "academic_year", t.academicyear),
                description = t.description ?? "",
            }).ToList();

            return new AdminTermsPageRes
            {
                terms = rows,
                referencevalues = refs,
            };
        }

        public async Task<AdminExamsPageRes> GetAdminExamsPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var terms = await termService.Select(new TermSelectReq { organizationid = orgId });
            var termOptions = terms.Select(t => new AdminTermOptionItem
            {
                id = t.id ?? "",
                name = t.name ?? "",
                academicyear = t.academicyear ?? "",
                academicyearname = ResolveRefName(refs, "academic_year", t.academicyear),
            }).ToList();

            var classes = await classService.Select(new ClassSelectReq { organizationid = orgId });
            var classOptions = classes.Select(c => new AdminClassOptionItem
            {
                id = c.id ?? "",
                name = c.name ?? "",
                grade = ResolveRefName(refs, "grade", c.grade) is var g && !string.IsNullOrWhiteSpace(g) ? g : c.grade ?? "",
                graderefid = c.grade ?? "",
                section = ResolveRefName(refs, "class_section", c.section) is var s && !string.IsNullOrWhiteSpace(s) ? s : c.section ?? "",
                termid = c.termid ?? "",
            }).ToList();

            var seriesList = await examSeriesService.Select(new ExamSeriesSelectReq { organizationid = orgId });
            var sessions = await examSessionService.Select(new ExamSessionSelectReq { organizationid = orgId });
            var sessionCountBySeries = sessions
                .GroupBy(s => s.examseriesid ?? "", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

            var termById = terms.ToDictionary(t => t.id ?? "", t => t, StringComparer.OrdinalIgnoreCase);
            var seriesRows = seriesList.Select(s =>
            {
                termById.TryGetValue(s.termid ?? "", out var term);
                sessionCountBySeries.TryGetValue(s.id ?? "", out var count);
                return new AdminExamSeriesRowItem
                {
                    id = s.id ?? "",
                    name = s.name ?? "",
                    termid = s.termid ?? "",
                    termname = term?.name ?? "",
                    academicyear = s.academicyear ?? "",
                    startdate = s.startdate == DateTime.MinValue ? "" : s.startdate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    enddate = s.enddate == DateTime.MinValue ? "" : s.enddate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    status = s.status ?? "",
                    examtypename = ResolveRefName(refs, "assessment", s.examtyperefid),
                    sessioncount = count,
                };
            }).ToList();

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            var halfDayEnd = await examOrganizationTimeService.GetExamHalfDayLatestEndAsync(db, orgId);
            var halfDayStr = halfDayEnd.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);

            return new AdminExamsPageRes
            {
                series = seriesRows,
                termoptions = termOptions,
                classoptions = classOptions,
                referencevalues = refs,
                schedulingpolicy = new AdminExamSchedulingPolicyItem
                {
                    halfdaylatestend = halfDayStr,
                    halfdaypolicy =
                        "On school calendar half-days, exam sessions must end on or before the configured latest end time. Set organizations.settings JSON: { \"exams\": { \"halfDayLatestEnd\": \"12:00:00\" } }.",
                },
            };
        }

        public async Task<StudentExamTimetablePageRes> GetStudentExamTimetablePage(StudentExamTimetablePageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);
            var studentId = req.studentid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(studentId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Student ID is required.");

            var enrollmentRows = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                studentid = studentId,
                iscurrent = true,
            });
            var enrollment = enrollmentRows.FirstOrDefault();
            if (enrollment == null || string.IsNullOrWhiteSpace(enrollment.classid))
            {
                return new StudentExamTimetablePageRes { studentid = studentId };
            }

            if (!string.Equals(enrollment.studentid, studentId, StringComparison.OrdinalIgnoreCase))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Student enrollment does not match.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var sessions = await examSessionService.SelectPublishedForClassTransaction(db, orgId, enrollment.classid);
            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var seriesList = await examSeriesService.Select(new ExamSeriesSelectReq { organizationid = orgId });
            var seriesById = seriesList.ToDictionary(s => s.id ?? "", s => s, StringComparer.OrdinalIgnoreCase);

            var exams = sessions.Select(s =>
            {
                seriesById.TryGetValue(s.examseriesid ?? "", out var series);
                return new StudentExamTimetableItem
                {
                    sessionid = s.id ?? "",
                    seriesid = s.examseriesid ?? "",
                    seriesname = series?.name ?? "",
                    subjectid = s.subjectid ?? "",
                    subjectname = ResolveRefName(refs, "subject", s.subjectid),
                    examdate = s.examdate == DateTime.MinValue ? "" : s.examdate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    starttime = FormatTimeOfDay(s.starttime),
                    endtime = FormatTimeOfDay(s.endtime),
                    durationminutes = s.durationminutes,
                    instructions = s.instructions ?? "",
                };
            }).ToList();

            return new StudentExamTimetablePageRes
            {
                studentid = studentId,
                studentname = ResolveDisplayName(enrollment.firstname, enrollment.lastname, enrollment.fullname, enrollment.email),
                classid = enrollment.classid ?? "",
                classname = enrollment.classname ?? "",
                grade = enrollment.grade ?? "",
                section = enrollment.section ?? "",
                exams = exams,
            };
        }

        private static string FormatTimeOfDay(TimeSpan time) =>
            DateTime.Today.Add(time).ToString("h:mm tt", CultureInfo.InvariantCulture);

        public async Task<AdminClassesPageRes> GetAdminClassesPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var classes = await classService.Select(new ClassSelectReq { organizationid = orgId });
            var staffList = await staffService.Select(new StaffSelectReq { organizationid = orgId });
            var terms = await termService.Select(new TermSelectReq { organizationid = orgId });

            var classIds = classes
                .Select(c => c.id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var enrollments = await GetCurrentEnrollmentsForClasses(orgId, classIds);
            var studentsByClass = enrollments
                .GroupBy(e => e.classid ?? "", StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

            var staffById = staffList.ToDictionary(
                s => s.staffid ?? s.id ?? "",
                s => ResolveDisplayName(s.firstname, s.lastname, s.fullname, s.email),
                StringComparer.OrdinalIgnoreCase);

            var classRows = classes.Select(c =>
            {
                staffById.TryGetValue(c.classteacherid ?? "", out var teacherName);
                staffById.TryGetValue(c.classteacherid ?? "", out var mentorName);
                staffById.TryGetValue(c.assistantmentorid ?? "", out var assistantName);

                return new AdminClassRowItem
                {
                    id = c.id ?? "",
                    name = c.name ?? "",
                    subject = "All Subjects",
                    teacher = !string.IsNullOrWhiteSpace(c.classteachername) ? c.classteachername : teacherName ?? "Not Assigned",
                    students = studentsByClass.TryGetValue(c.id ?? "", out var count)
                        ? count
                        : c.currentenrollment,
                    room = c.room ?? "",
                    schedule = "Mon-Fri, 8:00 AM - 3:00 PM",
                    mentorid = c.classteacherid ?? "",
                    mentorname = !string.IsNullOrWhiteSpace(c.classteachername) ? c.classteachername : mentorName ?? "",
                    assistantmentorid = c.assistantmentorid ?? "",
                    assistantmentorname = !string.IsNullOrWhiteSpace(c.assistantmentorname) ? c.assistantmentorname : assistantName ?? "",
                    grade = c.grade ?? "",
                    section = c.section ?? "",
                    capacity = c.capacity,
                    academicyear = c.academicyear ?? "",
                    termid = c.termid ?? "",
                    status = c.status ?? "",
                };
            }).ToList();

            return new AdminClassesPageRes
            {
                classes = classRows,
                referencevalues = refs,
                staffoptions = staffList.Select(s => new AdminStaffOptionItem
                {
                    id = s.staffid ?? s.id ?? "",
                    name = ResolveDisplayName(s.firstname, s.lastname, s.fullname, s.email),
                }).ToList(),
                termoptions = terms.Select(t => new AdminTermOptionItem
                {
                    id = t.id ?? "",
                    name = t.name ?? "",
                    academicyear = t.academicyear ?? "",
                    academicyearname = ResolveRefName(refs, "academic_year", t.academicyear),
                }).ToList(),
            };
        }

        public async Task<AdminSettingsPageRes> GetAdminSettingsPage(PageReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var categoryCounts = refs
                .GroupBy(r => NormalizeCategory(r.category))
                .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

            var admissionNumber = await admissionNumberService.GetSettings(orgId, req.email);

            var organization = await GetOrganizationBranding(orgId);

            return new AdminSettingsPageRes
            {
                referencevalues = refs,
                categorycounts = categoryCounts,
                admissionnumber = admissionNumber,
                organization = organization,
            };
        }

        public async Task<OrganizationBrandingItem> GetOrganizationBranding(string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                return new OrganizationBrandingItem();

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string query = @"
                SELECT
                    id, name, slug, email, phone,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    logo_url, logo_asset_id, website, brand_primary_color
                FROM organizations
                WHERE id = @id AND is_active = true
                LIMIT 1
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = organizationId.Trim();

            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return new OrganizationBrandingItem { id = organizationId };

            return MapOrganizationBranding(reader);
        }

        public async Task<OrganizationBrandingItem> GetOrganizationBrandingPage(PageReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);
            return await GetOrganizationBranding(orgId);
        }

        public async Task<OrganizationBrandingItem> SaveOrganizationBranding(SaveOrganizationBrandingReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);
            if (string.IsNullOrWhiteSpace(req.name))
                throw new AppException(AppException.ErrorCodes.BadRequest, "School name is required.");

            var logoAssetId = (req.logoassetid ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(logoAssetId))
                await EnsureOrganizationAssetBelongsToOrg(orgId, logoAssetId);

            var brandColor = NormalizeBrandPrimaryColor(req.brandprimarycolor);

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string query = @"
                UPDATE organizations
                SET
                    name = @name,
                    email = @email,
                    phone = @phone,
                    address_street = @address_street,
                    address_city = @address_city,
                    address_state = @address_state,
                    address_zip_code = @address_zip_code,
                    address_country = @address_country,
                    website = @website,
                    logo_asset_id = @logo_asset_id,
                    brand_primary_color = @brand_primary_color,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id AND is_active = true
            ";

            var cmd = db.GetCommand(query);
            var now = DateTime.UtcNow;
            var actor = string.IsNullOrWhiteSpace(req.email) ? "admin" : req.email.Trim();

            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = req.name.Trim();
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = req.organizationemail?.Trim() ?? "";
            db.AddParameter(cmd, "phone", DbTypes.Types.String).Value = req.phone?.Trim() ?? "";
            db.AddParameter(cmd, "address_street", DbTypes.Types.String).Value = req.addressstreet?.Trim() ?? "";
            db.AddParameter(cmd, "address_city", DbTypes.Types.String).Value = req.addresscity?.Trim() ?? "";
            db.AddParameter(cmd, "address_state", DbTypes.Types.String).Value = req.addressstate?.Trim() ?? "";
            db.AddParameter(cmd, "address_zip_code", DbTypes.Types.String).Value = req.addresszipcode?.Trim() ?? "";
            db.AddParameter(cmd, "address_country", DbTypes.Types.String).Value = req.addresscountry?.Trim() ?? "";
            db.AddParameter(cmd, "website", DbTypes.Types.String).Value = req.website?.Trim() ?? "";
            db.AddParameter(cmd, "logo_asset_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(logoAssetId) ? DBNull.Value : logoAssetId;
            db.AddParameter(cmd, "brand_primary_color", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(brandColor) ? DBNull.Value : brandColor;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;

            var rows = await db.ExecuteNonQuery(cmd);
            if (rows <= 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization not found or could not be updated.");

            return await GetOrganizationBranding(orgId);
        }

        private async Task EnsureOrganizationAssetBelongsToOrg(string orgId, string assetId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string query = @"
                SELECT 1 FROM organization_assets
                WHERE id = @id AND organization_id = @organization_id AND is_active = true
                LIMIT 1
            ";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = assetId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;

            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid logo asset for this organization.");
        }

        private static OrganizationBrandingItem MapOrganizationBranding(DbDataReader reader)
        {
            string ReadStr(string col) =>
                reader[col] == DBNull.Value ? "" : reader[col]?.ToString()?.Trim() ?? "";

            return new OrganizationBrandingItem
            {
                id = ReadStr("id"),
                name = ReadStr("name"),
                slug = ReadStr("slug"),
                email = ReadStr("email"),
                phone = ReadStr("phone"),
                addressstreet = ReadStr("address_street"),
                addresscity = ReadStr("address_city"),
                addressstate = ReadStr("address_state"),
                addresszipcode = ReadStr("address_zip_code"),
                addresscountry = ReadStr("address_country"),
                website = ReadStr("website"),
                logourl = ReadStr("logo_url"),
                logoassetid = ReadStr("logo_asset_id"),
                brandprimarycolor = ReadStr("brand_primary_color"),
            };
        }

        private static string NormalizeBrandPrimaryColor(string? value)
        {
            var v = (value ?? "").Trim();
            if (string.IsNullOrEmpty(v))
                return "";

            if (!v.StartsWith("#", StringComparison.Ordinal))
                v = "#" + v;

            if (v.Length == 4)
            {
                v = "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
            }

            if (v.Length != 7)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Brand color must be a hex value like #RRGGBB.");

            for (var i = 1; i < 7; i++)
            {
                var c = v[i];
                var isHex = (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
                if (!isHex)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Brand color must be a hex value like #RRGGBB.");
            }

            return v.ToUpperInvariant();
        }

        public async Task<AdmissionNumberSettings> GetAdmissionNumberSettings(PageReq req)
        {
            return await admissionNumberService.GetSettings(req.organizationid, req.email);
        }

        public async Task<AdmissionNumberSettings> SaveAdmissionNumberSettings(AdmissionNumberSettingsSaveReq req)
        {
            return await admissionNumberService.SaveSettings(req);
        }

        public async Task<AdminOnboardingPageRes> GetAdminOnboardingPage(PageReq req)
        {
            var orgId = ResolveOrganizationId(req.organizationid);

            var refs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
            }));

            var terms = await termService.Select(new TermSelectReq { organizationid = orgId });

            var categoryCounts = refs
                .GroupBy(r => NormalizeCategory(r.category))
                .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

            var completedSteps = RequiredOnboardingCategories.Count(cat => (categoryCounts.TryGetValue(cat, out var count) ? count : 0) > 0);
            if (terms.Count > 0)
                completedSteps++;

            var totalSteps = RequiredOnboardingCategories.Length + 1;
            var isComplete = completedSteps == totalSteps;

            var termRows = terms.Select(t => new AdminTermRowItem
            {
                id = t.id ?? "",
                name = t.name ?? "",
                startdate = t.startdate == DateTime.MinValue
                    ? ""
                    : t.startdate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                enddate = t.enddate == DateTime.MinValue
                    ? ""
                    : t.enddate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                status = t.status ?? "",
                academicyear = t.academicyear ?? "",
                academicyearname = ResolveRefName(refs, "academic_year", t.academicyear),
                description = t.description ?? "",
            }).ToList();

            return new AdminOnboardingPageRes
            {
                referencevalues = refs,
                terms = termRows,
                iscomplete = isComplete,
                progresspercent = (int)Math.Round(100.0 * completedSteps / totalSteps, MidpointRounding.AwayFromZero),
            };
        }

        private string ResolveOrganizationId(string orgId)
        {
            var org = orgId?.Trim() ?? "";
            if (!string.IsNullOrWhiteSpace(org))
                return org;
            if (requeststate.usercontext?.organisationid > 0)
                return requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
        }

        private static List<ReferenceValueItem> MapReferenceValues(List<ReferenceValue> values)
        {
            return values.Select(v => new ReferenceValueItem
            {
                id = v.id ?? "",
                category = v.category ?? "",
                code = v.code ?? "",
                name = v.name ?? "",
                displayorder = v.displayorder,
                status = v.status ?? "",
            }).ToList();
        }

        private static string ResolveRefName(List<ReferenceValueItem> refs, string category, string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return "";

            var normalizedCategory = NormalizeCategory(category);
            var match = refs.FirstOrDefault(r =>
                string.Equals(NormalizeCategory(r.category), normalizedCategory, StringComparison.OrdinalIgnoreCase) &&
                (string.Equals(r.id, id, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(r.code, id, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(r.name, id, StringComparison.OrdinalIgnoreCase)));

            return match?.name ?? id;
        }

        private static string FormatTimeRange(string start, string end)
        {
            var formattedStart = FormatClockTime(start);
            var formattedEnd = FormatClockTime(end);
            if (string.IsNullOrWhiteSpace(formattedStart) && string.IsNullOrWhiteSpace(formattedEnd))
                return "";
            if (string.IsNullOrWhiteSpace(formattedEnd))
                return formattedStart;
            return $"{formattedStart} - {formattedEnd}";
        }

        private static string FormatClockTime(string time)
        {
            if (string.IsNullOrWhiteSpace(time))
                return "";

            if (DateTime.TryParse(time, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                return parsed.ToString("h:mm tt", CultureInfo.InvariantCulture);

            var parts = time.Split(':');
            if (parts.Length < 2 || !int.TryParse(parts[0], out var hours))
                return time;

            var minutes = parts[1].Length >= 2 ? parts[1][..2] : parts[1];
            var ampm = hours >= 12 ? "PM" : "AM";
            var displayHours = hours % 12;
            if (displayHours == 0)
                displayHours = 12;

            return $"{displayHours}:{minutes} {ampm}";
        }

        private static string ResolveDisplayName(string first, string last, string full, string fallback)
        {
            if (!string.IsNullOrWhiteSpace(full))
                return full.Trim();

            var combined = string.Join(" ", new[] { first, last }.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
            if (!string.IsNullOrWhiteSpace(combined))
                return combined;

            return fallback?.Trim() ?? "";
        }

        private async Task<List<StudentEnrollmentWithProfile>> GetCurrentEnrollmentsForClasses(string orgId, HashSet<string> classIds)
        {
            if (classIds.Count == 0)
                return new List<StudentEnrollmentWithProfile>();

            var all = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                iscurrent = true,
            });

            return all.Where(e => classIds.Contains(e.classid ?? "")).ToList();
        }

        private static (List<StaffSchedule> schedules, Dictionary<string, Class> classById) FilterSchedulesForStaff(
            List<Class> assignedClasses,
            List<StaffSchedule> allSchedules)
        {
            var classById = new Dictionary<string, Class>(StringComparer.OrdinalIgnoreCase);

            if (assignedClasses.Count > 0)
            {
                var allowedClassIds = assignedClasses
                    .Select(c => c.id)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                foreach (var cls in assignedClasses)
                {
                    if (!string.IsNullOrWhiteSpace(cls.id))
                        classById[cls.id] = cls;
                }

                var schedules = allSchedules
                    .Where(s => allowedClassIds.Contains(s.classid ?? ""))
                    .ToList();
                return (schedules, classById);
            }

            var scheduleClassIds = allSchedules
                .Select(s => s.classid)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var schedule in allSchedules)
            {
                if (string.IsNullOrWhiteSpace(schedule.classid) || classById.ContainsKey(schedule.classid))
                    continue;

                classById[schedule.classid] = new Class
                {
                    id = schedule.classid,
                    name = schedule.classname ?? "",
                };
            }

            return (allSchedules.Where(s => scheduleClassIds.Contains(s.classid ?? "")).ToList(), classById);
        }

        private static string ResolveClassSlotStatus(DateTime now, TimeSpan start, TimeSpan end)
        {
            var startDt = now.Date.Add(start);
            var endDt = now.Date.Add(end);
            if (now > endDt)
                return "completed";
            if (now >= startDt && now <= endDt)
                return "ongoing";
            return "upcoming";
        }

        private async Task<string> BuildAttendanceMarkedAsync(string orgId, List<StaffSchedule> todaySchedules)
        {
            if (todaySchedules.Count == 0)
                return "0/0";

            var today = DateTime.Now.Date;
            var classIdsToday = todaySchedules
                .Select(s => s.classid)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var attendance = await attendanceService.Select(new AttendanceSelectReq
            {
                organizationid = orgId,
                type = "student",
                fromdate = today,
                todate = today,
            });

            var markedCount = attendance
                .Where(a => classIdsToday.Contains(a.classid ?? ""))
                .Select(a => a.classid)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            return $"{markedCount}/{classIdsToday.Count}";
        }

        private static string BuildNextClassIn(DateTime now, List<StaffSchedule> todaySchedules)
        {
            var upcoming = todaySchedules
                .Where(s => now.Date.Add(s.starttime) > now)
                .OrderBy(s => s.starttime)
                .ToList();

            if (upcoming.Count == 0)
                return "—";

            var diff = now.Date.Add(upcoming[0].starttime) - now;
            var totalMinutes = (int)Math.Round(diff.TotalMinutes, MidpointRounding.AwayFromZero);
            if (totalMinutes <= 0)
                return "—";

            var hours = totalMinutes / 60;
            var minutes = totalMinutes % 60;
            return hours > 0 ? $"{hours}h {minutes}m" : $"{minutes} min";
        }

        private static string FormatTimeSpan(TimeSpan time)
        {
            return time.ToString(@"hh\:mm\:ss", CultureInfo.InvariantCulture);
        }

        private static string NormalizeWeekday(string day)
        {
            if (string.IsNullOrWhiteSpace(day))
                return "";

            var trimmed = day.Trim().ToLower(CultureInfo.InvariantCulture);
            return trimmed switch
            {
                "monday" or "mon" => "Monday",
                "tuesday" or "tue" or "tues" => "Tuesday",
                "wednesday" or "wed" => "Wednesday",
                "thursday" or "thu" or "thur" or "thurs" => "Thursday",
                "friday" or "fri" => "Friday",
                "saturday" or "sat" => "Saturday",
                "sunday" or "sun" => "Sunday",
                _ => char.ToUpper(trimmed[0], CultureInfo.InvariantCulture) + trimmed[1..],
            };
        }

        private static string NormalizeCategory(string category)
        {
            return (category ?? "").Trim().ToLower(CultureInfo.InvariantCulture);
        }

        private static string ResolveScheduleColor(string classId)
        {
            if (string.IsNullOrWhiteSpace(classId))
                return ScheduleColors[0];

            var index = Math.Abs(classId[0]) % ScheduleColors.Length;
            return ScheduleColors[index];
        }

        private async Task<List<string>> BuildStaffScheduleTimeSlots(
            string orgId,
            List<StaffSchedule> schedules,
            Dictionary<string, Class> classById)
        {
            var gradeIds = schedules
                .Select(s => s.classid ?? "")
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => classById.TryGetValue(id, out var cls) ? cls.grade ?? "" : "")
                .Where(g => !string.IsNullOrWhiteSpace(g))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var slotMinutes = new SortedDictionary<int, string>();
            foreach (var gradeId in gradeIds)
            {
                var periods = await gradePeriodService.Select(new GradePeriodSelectReq
                {
                    organizationid = orgId,
                    gradeid = gradeId,
                });
                foreach (var period in periods.Where(p => p.isactive).OrderBy(p => p.displayorder).ThenBy(p => p.starttime))
                {
                    var label = FormatClockTime(FormatTimeSpan(period.starttime));
                    if (string.IsNullOrWhiteSpace(label))
                        continue;
                    var minutes = (int)period.starttime.TotalMinutes;
                    if (!slotMinutes.ContainsKey(minutes))
                        slotMinutes[minutes] = label;
                }
            }

            if (slotMinutes.Count > 0)
                return slotMinutes.Values.ToList();

            var periodRefs = MapReferenceValues(await referenceValueService.Select(new ReferenceValueSelectReq
            {
                organizationid = orgId,
                category = "period",
            }))
            .OrderBy(r => r.displayorder)
            .ToList();

            if (periodRefs.Count > 0)
                return periodRefs.Select(r => r.name).ToList();

            return DefaultTimeSlots.ToList();
        }

        private static string ResolveScheduleGridTimeSlot(List<string> timeSlots, TimeSpan start, TimeSpan end)
        {
            var startLabel = FormatClockTime(FormatTimeSpan(start));
            if (!string.IsNullOrWhiteSpace(startLabel))
            {
                var exact = timeSlots.FirstOrDefault(s =>
                    string.Equals(s, startLabel, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrWhiteSpace(exact))
                    return exact;
            }

            var matched = FindMatchingTimeSlot(timeSlots, start, end);
            if (!string.IsNullOrWhiteSpace(matched))
                return matched;

            if (!string.IsNullOrWhiteSpace(startLabel))
            {
                if (!timeSlots.Contains(startLabel, StringComparer.OrdinalIgnoreCase))
                {
                    timeSlots.Add(startLabel);
                    timeSlots.Sort((a, b) =>
                        ParseMinutesFromTimeString(a).CompareTo(ParseMinutesFromTimeString(b)));
                }
                return startLabel;
            }

            return "";
        }

        private static string FormatDisplayTimeRange(TimeSpan start, TimeSpan end)
        {
            return FormatTimeRange(FormatTimeSpan(start), FormatTimeSpan(end));
        }

        private static string? FindMatchingTimeSlot(IReadOnlyList<string> timeSlots, TimeSpan start, TimeSpan end)
        {
            var startMinutes = (int)start.TotalMinutes;
            var endMinutes = (int)end.TotalMinutes;

            foreach (var slot in timeSlots)
            {
                var slotMinutes = ParseMinutesFromTimeString(slot);
                if (slotMinutes == startMinutes)
                    return slot;
                if (slotMinutes >= startMinutes && slotMinutes < endMinutes)
                    return slot;
            }

            return null;
        }

        private static int ParseMinutesFromTimeString(string time)
        {
            if (string.IsNullOrWhiteSpace(time))
                return 0;

            if (DateTime.TryParse(time, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
                return parsed.Hour * 60 + parsed.Minute;

            var parts = time.Split(':');
            if (parts.Length < 2)
                return 0;

            if (!int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var hours))
                return 0;

            var minutePart = parts[1].Trim();
            var minuteDigits = new string(minutePart.TakeWhile(char.IsDigit).ToArray());
            if (!int.TryParse(minuteDigits, NumberStyles.Integer, CultureInfo.InvariantCulture, out var minutes))
                minutes = 0;

            var upper = time.ToUpper(CultureInfo.InvariantCulture);
            if (upper.Contains("PM", StringComparison.Ordinal) && hours < 12)
                hours += 12;
            if (upper.Contains("AM", StringComparison.Ordinal) && hours == 12)
                hours = 0;

            return hours * 60 + minutes;
        }
    }
}
