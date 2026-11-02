using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class HomeworkService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;
        private readonly StaffService staffService;
        private readonly ClassService classService;
        private readonly StaffScheduleService staffScheduleService;
        private readonly StudentEnrollmentService studentEnrollmentService;

        public HomeworkService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            StaffService staffService,
            ClassService classService,
            StaffScheduleService staffScheduleService,
            StudentEnrollmentService studentEnrollmentService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.staffService = staffService;
            this.classService = classService;
            this.staffScheduleService = staffScheduleService;
            this.studentEnrollmentService = studentEnrollmentService;
        }

        public async Task<List<HomeworkAssignment>> Select(HomeworkSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<HomeworkAssignment>> SelectTransaction(IDb db, HomeworkSelectReq req)
        {
            var result = new List<HomeworkAssignment>();
            const string query = @"
                SELECT
                    id, organization_id, staff_id, staff_name, class_id, class_name, subject,
                    title, description, assigned_date, due_date, status,
                    is_active, created_at, updated_at, created_by
                FROM homework_assignments
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.staffid))
                queryBuilder.AddParameter("staff_id", "=", "staff_id", req.staffid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.classid))
                queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
            if (req.fromdate.HasValue)
                queryBuilder.AddParameter("assigned_date", ">=", "fromdate", req.fromdate.Value.Date, DbTypes.Types.Date);
            if (req.todate.HasValue)
                queryBuilder.AddParameter("assigned_date", "<=", "todate", req.todate.Value.Date, DbTypes.Types.Date);

            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "assigned_date");
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "title");

            var command = queryBuilder.GetCommand(db);
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
                result.Add(MapRow(reader));

            return result;
        }

        public async Task<AdminHomeworkPageRes> GetAdminHomeworkPage(AdminHomeworkPageReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            var date = string.IsNullOrWhiteSpace(req.date)
                ? DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : req.date.Trim();

            if (!DateTime.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var assignedDate))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid date is required.");

            var classes = await classService.Select(new ClassSelectReq { organizationid = orgId });
            var allHomework = await Select(new HomeworkSelectReq
            {
                organizationid = orgId,
                fromdate = assignedDate.Date,
                todate = assignedDate.Date,
            });

            var homeworkByClass = allHomework
                .Where(h => !string.IsNullOrWhiteSpace(h.classid))
                .GroupBy(h => h.classid, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

            var cards = classes
                .Where(c => c.isactive)
                .OrderBy(c => c.name ?? "", StringComparer.OrdinalIgnoreCase)
                .Select(c =>
                {
                    homeworkByClass.TryGetValue(c.id ?? "", out var classHomework);
                    classHomework ??= new List<HomeworkAssignment>();

                    var subjects = classHomework
                        .GroupBy(h => NormalizeSubject(h.subject), StringComparer.OrdinalIgnoreCase)
                        .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
                        .Select(g => new AdminHomeworkSubjectGroup
                        {
                            subject = g.Key,
                            homework = g
                                .OrderBy(h => h.title, StringComparer.OrdinalIgnoreCase)
                                .Select(MapToAdminItem)
                                .ToList(),
                        })
                        .ToList();

                    return new AdminHomeworkClassCard
                    {
                        classid = c.id ?? "",
                        classname = c.name ?? "",
                        grade = c.grade ?? "",
                        section = c.section ?? "",
                        subjects = subjects,
                    };
                })
                .ToList();

            return new AdminHomeworkPageRes
            {
                date = date,
                classes = cards,
            };
        }

        public async Task<StudentHomeworkPageRes> GetStudentHomeworkPage(StudentHomeworkPageReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            var studentId = req.studentid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(studentId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Student ID is required.");

            var date = string.IsNullOrWhiteSpace(req.date)
                ? DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : req.date.Trim();

            if (!DateTime.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var assignedDate))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid date is required.");

            var enrollmentRows = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                studentid = studentId,
                iscurrent = true,
            });
            var enrollment = enrollmentRows.FirstOrDefault();
            if (enrollment == null || string.IsNullOrWhiteSpace(enrollment.classid))
            {
                return new StudentHomeworkPageRes
                {
                    studentid = studentId,
                    date = date,
                };
            }

            var classHomework = await Select(new HomeworkSelectReq
            {
                organizationid = orgId,
                classid = enrollment.classid,
                fromdate = assignedDate.Date,
                todate = assignedDate.Date,
            });

            var subjects = classHomework
                .GroupBy(h => NormalizeSubject(h.subject), StringComparer.OrdinalIgnoreCase)
                .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
                .Select(g => new AdminHomeworkSubjectGroup
                {
                    subject = g.Key,
                    homework = g
                        .OrderBy(h => h.title, StringComparer.OrdinalIgnoreCase)
                        .Select(MapToAdminItem)
                        .ToList(),
                })
                .ToList();

            var studentName = enrollment.fullname?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(studentName))
                studentName = $"{enrollment.firstname} {enrollment.lastname}".Trim();

            return new StudentHomeworkPageRes
            {
                studentid = studentId,
                studentname = studentName,
                classid = enrollment.classid,
                classname = enrollment.classname ?? "",
                grade = enrollment.grade ?? "",
                section = enrollment.section ?? "",
                date = date,
                subjects = subjects,
            };
        }

        public async Task<StaffHomeworkPageRes> GetStaffHomeworkPage(StaffHomeworkPageReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);
            var date = string.IsNullOrWhiteSpace(req.date)
                ? DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                : req.date.Trim();

            if (!DateTime.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var assignedDate))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid date is required.");

            var slots = await BuildTodayScheduleSlotsAsync(orgId, staffId, assignedDate);
            var allHomework = await Select(new HomeworkSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
                fromdate = assignedDate.Date,
                todate = assignedDate.Date,
            });

            var homeworkBySubject = allHomework
                .GroupBy(h => NormalizeSubject(h.subject), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Select(MapToPageItem).ToList(), StringComparer.OrdinalIgnoreCase);

            foreach (var slot in slots)
            {
                var key = NormalizeSubject(slot.subject);
                if (homeworkBySubject.TryGetValue(key, out var items))
                    slot.homework = items;
            }

            return new StaffHomeworkPageRes
            {
                staffid = staffId,
                date = date,
                slots = slots,
            };
        }

        public async Task<StaffHomeworkPageRes> SaveHomework(HomeworkSaveReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(req.title))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Title is required.");
            if (string.IsNullOrWhiteSpace(req.assigneddate) ||
                !DateTime.TryParse(req.assigneddate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var assignedDate))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid assigned date is required.");
            if (assignedDate.Date < DateTime.Today)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Homework cannot be edited for previous days.");

            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);
            var subject = NormalizeSubject(req.subject);
            if (string.IsNullOrWhiteSpace(subject))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Subject is required.");

            var classId = req.classid?.Trim() ?? "";
            Class? classInfo = null;
            if (!string.IsNullOrWhiteSpace(classId))
            {
                classInfo = (await classService.Select(new ClassSelectReq
                {
                    organizationid = orgId,
                    id = classId,
                })).FirstOrDefault();
            }

            DateTime? dueDate = null;
            if (!string.IsNullOrWhiteSpace(req.duedate) &&
                DateTime.TryParse(req.duedate, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDue))
            {
                dueDate = parsedDue.Date;
            }

            var assignment = new HomeworkAssignment
            {
                id = req.id?.Trim() ?? "",
                organizationid = orgId,
                staffid = staffId,
                classid = classId,
                classname = classInfo?.name ?? "",
                subject = subject,
                title = req.title.Trim(),
                description = req.description?.Trim() ?? "",
                assigneddate = assignedDate.Date,
                duedate = dueDate,
                status = "assigned",
                isactive = true,
            };

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                if (string.IsNullOrWhiteSpace(assignment.id))
                {
                    var existingForSubject = await FindHomeworkBySubjectTransaction(
                        db, orgId, staffId, assignedDate.Date, subject);
                    if (existingForSubject != null)
                        assignment.id = existingForSubject.id;
                }

                if (!string.IsNullOrWhiteSpace(assignment.id))
                    await UpdateTransaction(db, assignment);
                else
                    await InsertTransaction(db, assignment);
            }

            return await GetStaffHomeworkPage(new StaffHomeworkPageReq
            {
                organizationid = orgId,
                staffid = staffId,
                email = req.email ?? "",
                date = req.assigneddate,
            });
        }

        public async Task<StaffHomeworkPageRes> DeleteHomework(HomeworkDeleteReq req, StaffHomeworkPageReq pageReq)
        {
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Homework id is required.");
            if (!string.IsNullOrWhiteSpace(pageReq.date) &&
                DateTime.TryParse(pageReq.date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var pageDate) &&
                pageDate.Date < DateTime.Today)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Homework cannot be edited for previous days.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                const string query = @"
                    UPDATE homework_assignments
                    SET is_active = false,
                        updated_at = @updated_at
                    WHERE id = @id
                ";
                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(command);
            }

            return await GetStaffHomeworkPage(pageReq);
        }

        private async Task<List<StaffHomeworkSlot>> BuildTodayScheduleSlotsAsync(
            string orgId,
            string staffId,
            DateTime assignedDate)
        {
            var todayKey = assignedDate.ToString("dddd", CultureInfo.InvariantCulture);
            var schedules = await staffScheduleService.Select(new StaffScheduleSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var todaySchedules = schedules
                .Where(s => string.Equals(s.day, todayKey, StringComparison.OrdinalIgnoreCase))
                .Where(s => !string.IsNullOrWhiteSpace(s.classid))
                .OrderBy(s => s.starttime)
                .ThenBy(s => s.classname ?? "", StringComparer.OrdinalIgnoreCase)
                .ToList();

            return todaySchedules
                .GroupBy(s => NormalizeSubject(s.subject), StringComparer.OrdinalIgnoreCase)
                .Select(group =>
                {
                    var ordered = group.OrderBy(s => s.starttime).ToList();
                    var first = ordered[0];
                    var classNames = ordered
                        .Select(s => s.classname)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct(StringComparer.OrdinalIgnoreCase);
                    var times = ordered
                        .Select(s => FormatTimeRange(s.starttime, s.endtime))
                        .Where(time => !string.IsNullOrWhiteSpace(time))
                        .Distinct(StringComparer.OrdinalIgnoreCase);
                    var rooms = ordered
                        .Select(s => s.room)
                        .Where(room => !string.IsNullOrWhiteSpace(room))
                        .Distinct(StringComparer.OrdinalIgnoreCase);

                    return new StaffHomeworkSlot
                    {
                        classid = first.classid ?? "",
                        classname = string.Join(", ", classNames),
                        subject = group.Key,
                        time = string.Join(" · ", times),
                        room = string.Join(", ", rooms),
                        homework = new List<StaffHomeworkItem>(),
                    };
                })
                .OrderBy(s => s.subject, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static string NormalizeSubject(string? subject)
        {
            return string.IsNullOrWhiteSpace(subject) ? "General" : subject.Trim();
        }

        private async Task<HomeworkAssignment?> FindHomeworkBySubjectTransaction(
            IDb db,
            string orgId,
            string staffId,
            DateTime assignedDate,
            string subject)
        {
            var rows = await SelectTransaction(db, new HomeworkSelectReq
            {
                organizationid = orgId,
                staffid = staffId,
                fromdate = assignedDate,
                todate = assignedDate,
            });

            return rows.FirstOrDefault(h =>
                string.Equals(NormalizeSubject(h.subject), subject, StringComparison.OrdinalIgnoreCase));
        }

        private static string FormatTimeRange(TimeSpan start, TimeSpan end)
        {
            if (start == TimeSpan.Zero && end == TimeSpan.Zero)
                return "";
            return $"{FormatTime(start)} - {FormatTime(end)}";
        }

        private static string FormatTime(TimeSpan time)
        {
            var hours = time.Hours;
            var minutes = time.Minutes;
            var period = hours >= 12 ? "PM" : "AM";
            var displayHour = hours % 12;
            if (displayHour == 0) displayHour = 12;
            return minutes == 0
                ? $"{displayHour}:00 {period}"
                : $"{displayHour}:{minutes:D2} {period}";
        }

        private async Task InsertTransaction(IDb db, HomeworkAssignment assignment)
        {
            var staffName = await ResolveStaffNameAsync(db, assignment.staffid, assignment.organizationid);
            assignment.id = string.IsNullOrWhiteSpace(assignment.id) ? Guid.NewGuid().ToString() : assignment.id;
            assignment.staffname = staffName;
            assignment.createdby = ResolveActor();
            assignment.createdat = DateTime.UtcNow;
            assignment.updatedat = assignment.createdat;

            const string query = @"
                INSERT INTO homework_assignments (
                    id, organization_id, staff_id, staff_name, class_id, class_name, subject,
                    title, description, assigned_date, due_date, status,
                    is_active, created_at, updated_at, created_by
                )
                VALUES (
                    @id, @organization_id, @staff_id, @staff_name, @class_id, @class_name, @subject,
                    @title, @description, @assigned_date, @due_date, @status,
                    @is_active, @created_at, @updated_at, @created_by
                );
            ";

            var command = db.GetCommand(query);
            BindParameters(command, db, assignment);
            await db.ExecuteNonQuery(command);
        }

        private async Task UpdateTransaction(IDb db, HomeworkAssignment assignment)
        {
            assignment.updatedat = DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(assignment.staffname))
                assignment.staffname = await ResolveStaffNameAsync(db, assignment.staffid, assignment.organizationid);

            const string query = @"
                UPDATE homework_assignments
                SET class_id = @class_id,
                    class_name = @class_name,
                    subject = @subject,
                    title = @title,
                    description = @description,
                    assigned_date = @assigned_date,
                    due_date = @due_date,
                    status = @status,
                    updated_at = @updated_at
                WHERE id = @id
                  AND is_active = true
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = assignment.id;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = assignment.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = assignment.classname ?? "";
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = assignment.subject ?? "";
            db.AddParameter(command, "title", DbTypes.Types.String).Value = assignment.title ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = assignment.description ?? "";
            db.AddParameter(command, "assigned_date", DbTypes.Types.Date).Value = assignment.assigneddate.Date;
            db.AddParameter(command, "due_date", DbTypes.Types.Date).Value =
                assignment.duedate.HasValue ? assignment.duedate.Value.Date : DBNull.Value;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = assignment.status ?? "assigned";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = assignment.updatedat;
            await db.ExecuteNonQuery(command);
        }

        private void BindParameters(DbCommand command, IDb db, HomeworkAssignment assignment)
        {
            db.AddParameter(command, "id", DbTypes.Types.String).Value = assignment.id;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = assignment.organizationid;
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = assignment.staffid;
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = assignment.staffname ?? "";
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = assignment.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = assignment.classname ?? "";
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = assignment.subject ?? "";
            db.AddParameter(command, "title", DbTypes.Types.String).Value = assignment.title ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = assignment.description ?? "";
            db.AddParameter(command, "assigned_date", DbTypes.Types.Date).Value = assignment.assigneddate.Date;
            db.AddParameter(command, "due_date", DbTypes.Types.Date).Value =
                assignment.duedate.HasValue ? assignment.duedate.Value.Date : DBNull.Value;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = assignment.status ?? "assigned";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = assignment.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = assignment.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = assignment.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = assignment.createdby ?? "";
        }

        private static HomeworkAssignment MapRow(DbDataReader reader)
        {
            return new HomeworkAssignment
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                staffid = reader["staff_id"]?.ToString() ?? "",
                staffname = reader["staff_name"]?.ToString() ?? "",
                classid = reader["class_id"]?.ToString() ?? "",
                classname = reader["class_name"]?.ToString() ?? "",
                subject = reader["subject"]?.ToString() ?? "",
                title = reader["title"]?.ToString() ?? "",
                description = reader["description"]?.ToString() ?? "",
                assigneddate = reader["assigned_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["assigned_date"]),
                duedate = reader["due_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["due_date"]),
                status = reader["status"]?.ToString() ?? "",
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
            };
        }

        private static StaffHomeworkItem MapToPageItem(HomeworkAssignment row)
        {
            return new StaffHomeworkItem
            {
                id = row.id,
                classid = row.classid,
                classname = row.classname,
                subject = row.subject,
                title = row.title,
                description = row.description,
                assigneddate = row.assigneddate == DateTime.MinValue
                    ? ""
                    : row.assigneddate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                duedate = row.duedate.HasValue
                    ? row.duedate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                    : "",
                status = row.status,
            };
        }

        private static AdminHomeworkItem MapToAdminItem(HomeworkAssignment row)
        {
            return new AdminHomeworkItem
            {
                id = row.id,
                subject = row.subject,
                title = row.title,
                description = row.description,
                staffid = row.staffid,
                staffname = row.staffname,
                assigneddate = row.assigneddate == DateTime.MinValue
                    ? ""
                    : row.assigneddate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                duedate = row.duedate.HasValue
                    ? row.duedate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
                    : "",
                status = row.status,
            };
        }

        private static async Task<string> ResolveStaffNameAsync(IDb db, string staffId, string orgId)
        {
            if (string.IsNullOrWhiteSpace(staffId))
                return "";

            const string query = @"
                SELECT COALESCE(NULLIF(full_name, ''), TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))) AS name
                FROM staff
                WHERE staff_id = @staff_id
                  AND organization_id = @organization_id
                  AND is_active = true
                LIMIT 1;
            ";
            var command = db.GetCommand(query);
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = staffId;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = orgId;
            using var reader = await db.Execute(command);
            if (await reader.ReadAsync())
                return reader["name"]?.ToString()?.Trim() ?? "";
            return "";
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }
    }
}
