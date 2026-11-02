using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class AttendanceService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        StudentService studentService;
        ClassService classService;
        StaffService staffService;
        StudentEnrollmentService studentEnrollmentService;

        public AttendanceService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            StudentService studentService,
            ClassService classService,
            StaffService staffService,
            StudentEnrollmentService studentEnrollmentService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.studentService = studentService;
            this.classService = classService;
            this.staffService = staffService;
            this.studentEnrollmentService = studentEnrollmentService;
        }

        public async Task<List<Attendance>> Select(AttendanceSelectReq req)
        {
            List<Attendance> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Attendance>> SelectTransaction(IDb db, AttendanceSelectReq req)
        {
            List<Attendance> result = new List<Attendance>();
            string query = @"
                SELECT 
                    id, type, date, class_id, class_name, student_id, student_name, staff_id, staff_name,
                    status, check_in_time, check_out_time, remarks, marked_by, marked_at,
                    organization_id, isactive, created_at, updated_at
                FROM attendance
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (!string.IsNullOrWhiteSpace(req.id))
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.organizationid))
            {
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.classid))
            {
                queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.studentid))
            {
                queryBuilder.AddParameter("student_id", "=", "student_id", req.studentid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.staffid))
            {
                queryBuilder.AddParameter("staff_id", "=", "staff_id", req.staffid, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.type))
            {
                queryBuilder.AddParameter("type", "=", "type", req.type, DbTypes.Types.String);
            }
            if (req.fromdate.HasValue)
            {
                queryBuilder.AddParameter("date", ">=", "fromdate", req.fromdate.Value.Date, DbTypes.Types.Date);
            }
            if (req.todate.HasValue)
            {
                queryBuilder.AddParameter("date", "<=", "todate", req.todate.Value.Date, DbTypes.Types.Date);
            }

            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "date");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Attendance temp = new Attendance();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.date = reader["date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["date"]);
                    temp.classid = reader["class_id"] == DBNull.Value ? "" : reader["class_id"].ToString();
                    temp.classname = reader["class_name"] == DBNull.Value ? "" : reader["class_name"].ToString();
                    temp.studentid = reader["student_id"] == DBNull.Value ? "" : reader["student_id"].ToString();
                    temp.studentname = reader["student_name"] == DBNull.Value ? "" : reader["student_name"].ToString();
                    temp.staffid = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.staffname = reader["staff_name"] == DBNull.Value ? "" : reader["staff_name"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.checkintime = reader["check_in_time"] == DBNull.Value ? "" : reader["check_in_time"].ToString();
                    temp.checkouttime = reader["check_out_time"] == DBNull.Value ? "" : reader["check_out_time"].ToString();
                    temp.remarks = reader["remarks"] == DBNull.Value ? "" : reader["remarks"].ToString();
                    temp.markedby = reader["marked_by"] == DBNull.Value ? "" : reader["marked_by"].ToString();
                    temp.markedat = reader["marked_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["marked_at"]);
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.createdat = reader["created_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["created_at"]);
                    temp.updatedat = reader["updated_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["updated_at"]);

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Attendance> Save(Attendance attendance)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                if (string.IsNullOrWhiteSpace(attendance.organizationid) && requeststate.usercontext?.organisationid > 0)
                    attendance.organizationid = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
                if (attendance.date == DateTime.MinValue)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Date is required.");
                if (attendance.date.Date < DateTime.Today)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Attendance cannot be edited for previous days.");

                attendance.status = NormalizeAttendanceStatus(attendance.status);
                attendance.isactive = true;

                if (string.IsNullOrWhiteSpace(attendance.id))
                {
                    var existingReq = new AttendanceSelectReq
                    {
                        organizationid = attendance.organizationid,
                        classid = attendance.classid ?? "",
                        studentid = attendance.studentid ?? "",
                        staffid = attendance.staffid ?? "",
                        type = attendance.type ?? "",
                        fromdate = attendance.date.Date,
                        todate = attendance.date.Date,
                    };
                    var existing = await SelectTransaction(db, existingReq);
                    if (existing.Count > 0)
                        attendance.id = existing[0].id;
                }

                if (!string.IsNullOrWhiteSpace(attendance.id))
                    await UpdateTransaction(db, attendance);
                else
                    await InsertTransaction(db, attendance);
            }
            return attendance;
        }

        public async Task<Attendance> Insert(Attendance attendance)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, attendance);
            }
            return attendance;
        }

        public async Task InsertTransaction(IDb db, Attendance attendance)
        {
            string query = @"
                INSERT INTO attendance (
                    id, type, date, class_id, class_name, student_id, student_name, staff_id, staff_name,
                    status, check_in_time, check_out_time, remarks, marked_by, marked_at,
                    organization_id, isactive, created_at, updated_at
                )
                VALUES (
                    @id, @type, @date, @class_id, @class_name, @student_id, @student_name, @staff_id, @staff_name,
                    @status, @check_in_time, @check_out_time, @remarks, @marked_by, @marked_at,
                    @organization_id, @isactive, @created_at, @updated_at
                )
                RETURNING id;
            ";

            if (string.IsNullOrWhiteSpace(attendance.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            DateTime now = DateTime.UtcNow;
            attendance.id = string.IsNullOrWhiteSpace(attendance.id) ? Guid.NewGuid().ToString() : attendance.id;
            attendance.isactive = true;
            attendance.createdat = now;
            attendance.updatedat = now;

            if (string.IsNullOrWhiteSpace(attendance.markedby))
                attendance.markedby = ResolveActor();
            if (!attendance.markedat.HasValue || attendance.markedat == DateTime.MinValue)
                attendance.markedat = now;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = attendance.id;
            db.AddParameter(command, "type", DbTypes.Types.String).Value = attendance.type ?? "";
            db.AddParameter(command, "date", DbTypes.Types.Date).Value = attendance.date.Date;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.classid) ? DBNull.Value : attendance.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = attendance.classname ?? "";
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.studentid) ? DBNull.Value : attendance.studentid;
            db.AddParameter(command, "student_name", DbTypes.Types.String).Value = attendance.studentname ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.staffid) ? DBNull.Value : attendance.staffid;
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = attendance.staffname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = attendance.status ?? "";
            db.AddParameter(command, "check_in_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkintime);
            db.AddParameter(command, "check_out_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkouttime);
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = attendance.remarks ?? "";
            db.AddParameter(command, "marked_by", DbTypes.Types.String).Value = attendance.markedby ?? "";
            db.AddParameter(command, "marked_at", DbTypes.Types.DateTime).Value = attendance.markedat ?? now;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = attendance.organizationid ?? "";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = attendance.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = attendance.createdat ?? now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = attendance.updatedat ?? now;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    attendance.id = reader["id"]?.ToString() ?? "";
                }
            }
        }

        public async Task<Attendance> Update(Attendance attendance)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, attendance);
            }
            return attendance;
        }

        public async Task<bool> UpdateTransaction(IDb db, Attendance attendance)
        {
            bool result = false;
            string query = @"
                UPDATE attendance
                SET 
                    type = @type, date = @date, class_id = @class_id, class_name = @class_name, 
                    student_id = @student_id, student_name = @student_name, staff_id = @staff_id, staff_name = @staff_name,
                    status = @status, check_in_time = @check_in_time, check_out_time = @check_out_time, remarks = @remarks,
                    marked_by = @marked_by, marked_at = @marked_at,
                    organization_id = @organization_id, isactive = @isactive, updated_at = @updated_at
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            var now = DateTime.UtcNow;
            attendance.updatedat = now;
            if (string.IsNullOrWhiteSpace(attendance.markedby))
                attendance.markedby = ResolveActor();
            if (!attendance.markedat.HasValue || attendance.markedat == DateTime.MinValue)
                attendance.markedat = now;

            db.AddParameter(command, "id", DbTypes.Types.String).Value = attendance.id ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = attendance.type ?? "";
            db.AddParameter(command, "date", DbTypes.Types.Date).Value = attendance.date.Date;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.classid) ? DBNull.Value : attendance.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = attendance.classname ?? "";
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.studentid) ? DBNull.Value : attendance.studentid;
            db.AddParameter(command, "student_name", DbTypes.Types.String).Value = attendance.studentname ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.staffid) ? DBNull.Value : attendance.staffid;
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = attendance.staffname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = attendance.status ?? "";
            db.AddParameter(command, "check_in_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkintime);
            db.AddParameter(command, "check_out_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkouttime);
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = attendance.remarks ?? "";
            db.AddParameter(command, "marked_by", DbTypes.Types.String).Value = attendance.markedby ?? "";
            db.AddParameter(command, "marked_at", DbTypes.Types.DateTime).Value = attendance.markedat ?? now;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = attendance.organizationid ?? "";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = attendance.isactive;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = attendance.updatedat ?? now;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(AttendanceDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, AttendanceDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE attendance
                SET isactive = false,
                    updated_at = @updated_at
                WHERE id = @id
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        private object ParseTimeOrNull(string time)
        {
            if (string.IsNullOrWhiteSpace(time))
                return DBNull.Value;
            if (TimeSpan.TryParse(time, out var parsed))
                return parsed;
            return DBNull.Value;
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }

        private static string NormalizeAttendanceStatus(string status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "";
            var s = status.Trim();
            return s.ToUpperInvariant() switch
            {
                "REF_ATT_STAT_001" or "PRESENT" => "present",
                "REF_ATT_STAT_002" or "ABSENT" => "absent",
                "REF_ATT_STAT_003" or "LATE" => "late",
                "REF_ATT_STAT_004" or "EXCUSED" => "excused",
                "HALF_DAY" => "half_day",
                _ => s.ToLowerInvariant(),
            };
        }

        /// <summary>Single API: fetch students for the class and their attendance status for the given date; merge and return.</summary>
        public async Task<List<StudentWithAttendanceItem>> GetStudentsWithAttendance(StudentsWithAttendanceReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(req.classid))
                return new List<StudentWithAttendanceItem>();

            var attendanceReq = new AttendanceSelectReq
            {
                organizationid = orgId,
                classid = req.classid,
                type = "student"
            };
            if (!string.IsNullOrWhiteSpace(req.date) &&
                DateTime.TryParse(req.date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateVal))
            {
                attendanceReq.fromdate = dateVal.Date;
                attendanceReq.todate = dateVal.Date;
            }
            var attendanceList = await Select(attendanceReq);
            var statusByStudent = BuildAttendanceStatusIndex(attendanceList);

            List<StudentEnrollmentWithProfile> enrollments = new();
            try
            {
                enrollments = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
                {
                    organizationid = orgId,
                    classid = req.classid,
                    iscurrent = true,
                });
            }
            catch
            {
                enrollments = new List<StudentEnrollmentWithProfile>();
            }

            if (enrollments.Count > 0)
            {
                return enrollments.Select(e =>
                {
                    ResolveAttendanceForStudent(
                        e.studentid,
                        e.admissionnumber,
                        statusByStudent,
                        out var st,
                        out var attendanceId);

                    return new StudentWithAttendanceItem
                    {
                        id = e.studentid ?? "",
                        studentid = e.admissionnumber ?? "",
                        firstname = e.firstname ?? "",
                        lastname = e.lastname ?? "",
                        fullname = ResolveEnrollmentDisplayName(e),
                        rollnumber = e.rollnumber ?? 0,
                        classid = e.classid ?? "",
                        classname = e.classname ?? "",
                        attendancestatus = st,
                        attendanceid = attendanceId,
                    };
                }).ToList();
            }

            // Legacy fallback when enrollments are not used yet.
            var students = await studentService.Select(new StudentSelectReq
            {
                organizationid = orgId,
                classid = req.classid,
                status = ""
            });

            return students.Select(s =>
            {
                ResolveAttendanceForStudent(
                    s.id,
                    s.studentid,
                    statusByStudent,
                    out var st,
                    out var attendanceId);

                return new StudentWithAttendanceItem
                {
                    id = s.id,
                    studentid = s.studentid ?? "",
                    firstname = s.firstname ?? "",
                    lastname = s.lastname ?? "",
                    fullname = ResolveStudentDisplayName(s),
                    rollnumber = s.rollnumber,
                    classid = s.classid ?? "",
                    classname = s.classname ?? "",
                    attendancestatus = st,
                    attendanceid = attendanceId,
                };
            }).ToList();
        }

        public async Task<StaffAttendancePageRes> GetStaffAttendancePage(StaffAttendancePageReq req)
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

            var assignedClasses = await classService.GetAssignedToStaff(new ClassAssignedToStaffReq
            {
                organizationid = orgId,
                staffid = staffId,
            });

            var classOptions = assignedClasses
                .Select(c => new StaffAttendanceClassOption { id = c.id ?? "", name = c.name ?? "" })
                .ToList();

            var selectedClassId = req.classid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(selectedClassId) && classOptions.Count > 0)
                selectedClassId = classOptions[0].id;

            var selectedClassName = classOptions.FirstOrDefault(c => c.id == selectedClassId)?.name ?? "";
            var students = new List<StudentWithAttendanceItem>();
            if (!string.IsNullOrWhiteSpace(selectedClassId))
            {
                students = await GetStudentsWithAttendance(new StudentsWithAttendanceReq
                {
                    organizationid = orgId,
                    classid = selectedClassId,
                    date = date,
                });
            }

            return new StaffAttendancePageRes
            {
                staffid = staffId,
                date = date,
                selectedclassid = selectedClassId,
                selectedclassname = selectedClassName,
                classes = classOptions,
                students = students,
                summary = BuildSummary(students),
            };
        }

        public async Task<StaffAttendancePageRes> SaveBulkAttendance(BulkAttendanceSaveReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(req.classid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Class is required.");
            if (string.IsNullOrWhiteSpace(req.date) ||
                !DateTime.TryParse(req.date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var attendanceDate))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid date is required.");
            if (req.items == null || req.items.Count == 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "At least one attendance record is required.");
            if (attendanceDate.Date < DateTime.Today)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Attendance cannot be edited for previous days.");

            var classInfo = (await classService.Select(new ClassSelectReq
            {
                organizationid = orgId,
                id = req.classid,
            })).FirstOrDefault();
            var className = classInfo?.name ?? "";

            var staffId = await staffService.ResolveStaffIdAsync(orgId, req.staffid, req.email);

            List<StudentEnrollmentWithProfile> enrollments = new();
            try
            {
                enrollments = await studentEnrollmentService.SelectWithProfile(new StudentEnrollmentSelectReq
                {
                    organizationid = orgId,
                    classid = req.classid,
                    iscurrent = true,
                });
            }
            catch
            {
                enrollments = new List<StudentEnrollmentWithProfile>();
            }
            var enrollmentByStudentId = enrollments
                .Where(e => !string.IsNullOrWhiteSpace(e.studentid))
                .ToDictionary(e => e.studentid, e => e, StringComparer.OrdinalIgnoreCase);

            var students = await studentService.Select(new StudentSelectReq
            {
                organizationid = orgId,
                classid = req.classid,
            });
            var studentById = students
                .Where(s => !string.IsNullOrWhiteSpace(s.id))
                .ToDictionary(s => s.id ?? "", s => s, StringComparer.OrdinalIgnoreCase);

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                foreach (var item in req.items)
                {
                    if (string.IsNullOrWhiteSpace(item.studentid) || string.IsNullOrWhiteSpace(item.status))
                        continue;

                    var studentPk = ResolveStudentPrimaryKey(item.studentid, enrollmentByStudentId, studentById);
                    if (string.IsNullOrWhiteSpace(studentPk))
                        continue;

                    enrollmentByStudentId.TryGetValue(studentPk, out var enrollment);
                    studentById.TryGetValue(studentPk, out var student);
                    var studentName = enrollment != null
                        ? ResolveEnrollmentDisplayName(enrollment)
                        : student != null
                            ? ResolveStudentDisplayName(student)
                            : "";

                    var attendance = new Attendance
                    {
                        type = "student",
                        date = attendanceDate.Date,
                        classid = req.classid,
                        classname = className,
                        studentid = studentPk,
                        studentname = studentName,
                        status = NormalizeAttendanceStatus(item.status),
                        organizationid = orgId,
                        isactive = true,
                    };

                    var existing = await this.FindExistingAttendanceTransaction(
                        db,
                        orgId,
                        req.classid,
                        studentPk,
                        enrollment?.admissionnumber,
                        attendanceDate.Date);
                    if (existing != null)
                    {
                        attendance.id = existing.id;
                        if (string.IsNullOrWhiteSpace(attendance.studentname))
                            attendance.studentname = existing.studentname ?? attendance.studentname;
                    }

                    if (!string.IsNullOrWhiteSpace(attendance.id))
                        await UpdateTransaction(db, attendance);
                    else
                        await InsertTransaction(db, attendance);
                }
            }

            return await GetStaffAttendancePage(new StaffAttendancePageReq
            {
                organizationid = orgId,
                staffid = staffId,
                email = req.email ?? "",
                classid = req.classid,
                date = req.date,
            });
        }

        private async Task<Attendance?> FindExistingAttendanceTransaction(
            IDb db,
            string orgId,
            string classId,
            string studentPrimaryKey,
            string? admissionNumber,
            DateTime date)
        {
            var keys = new List<string>();
            if (!string.IsNullOrWhiteSpace(studentPrimaryKey))
                keys.Add(studentPrimaryKey.Trim());
            if (!string.IsNullOrWhiteSpace(admissionNumber) &&
                !keys.Any(k => string.Equals(k, admissionNumber, StringComparison.OrdinalIgnoreCase)))
            {
                keys.Add(admissionNumber.Trim());
            }

            foreach (var key in keys)
            {
                var existingReq = new AttendanceSelectReq
                {
                    organizationid = orgId,
                    classid = classId,
                    studentid = key,
                    type = "student",
                    fromdate = date,
                    todate = date,
                };
                var existing = await SelectTransaction(db, existingReq);
                if (existing.Count > 0)
                {
                    var row = existing[0];
                    row.studentid = studentPrimaryKey;
                    return row;
                }
            }

            return null;
        }

        private static Dictionary<string, (string status, string attendanceId)> BuildAttendanceStatusIndex(IEnumerable<Attendance> attendanceList)
        {
            var statusByStudent = new Dictionary<string, (string status, string attendanceId)>(StringComparer.OrdinalIgnoreCase);
            foreach (var a in attendanceList)
            {
                if (string.IsNullOrWhiteSpace(a.studentid) || string.IsNullOrWhiteSpace(a.status))
                    continue;

                var entry = (NormalizeAttendanceStatus(a.status), a.id ?? "");
                statusByStudent[a.studentid.Trim()] = entry;
            }
            return statusByStudent;
        }

        private static void ResolveAttendanceForStudent(
            string? studentPrimaryKey,
            string? admissionNumber,
            Dictionary<string, (string status, string attendanceId)> statusByStudent,
            out string status,
            out string attendanceId)
        {
            status = "";
            attendanceId = "";
            if (!string.IsNullOrWhiteSpace(studentPrimaryKey) &&
                statusByStudent.TryGetValue(studentPrimaryKey.Trim(), out var byPk))
            {
                status = byPk.status;
                attendanceId = byPk.attendanceId;
                return;
            }

            if (!string.IsNullOrWhiteSpace(admissionNumber) &&
                statusByStudent.TryGetValue(admissionNumber.Trim(), out var byCode))
            {
                status = byCode.status;
                attendanceId = byCode.attendanceId;
            }
        }

        private static string ResolveStudentPrimaryKey(
            string requestedStudentId,
            Dictionary<string, StudentEnrollmentWithProfile> enrollmentByStudentId,
            Dictionary<string, Student> studentById)
        {
            var candidate = requestedStudentId?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(candidate))
                return "";

            if (enrollmentByStudentId.ContainsKey(candidate) || studentById.ContainsKey(candidate))
                return candidate;

            var byAdmission = enrollmentByStudentId.Values
                .FirstOrDefault(e => string.Equals(e.admissionnumber, candidate, StringComparison.OrdinalIgnoreCase));
            if (byAdmission != null && !string.IsNullOrWhiteSpace(byAdmission.studentid))
                return byAdmission.studentid;

            var byLegacyCode = studentById.Values
                .FirstOrDefault(s => string.Equals(s.studentid, candidate, StringComparison.OrdinalIgnoreCase));
            if (byLegacyCode != null && !string.IsNullOrWhiteSpace(byLegacyCode.id))
                return byLegacyCode.id;

            return candidate;
        }

        private static string ResolveEnrollmentDisplayName(StudentEnrollmentWithProfile enrollment)
        {
            if (!string.IsNullOrWhiteSpace(enrollment.fullname))
                return enrollment.fullname.Trim();
            var combined = string.Join(" ", new[] { enrollment.firstname, enrollment.lastname }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
            return combined.Trim();
        }

        private static string ResolveStudentDisplayName(Student student)
        {
            if (!string.IsNullOrWhiteSpace(student.fullname))
                return student.fullname.Trim();
            var combined = string.Join(" ", new[] { student.firstname, student.lastname }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
            return combined.Trim();
        }

        private static AttendanceSummary BuildSummary(IEnumerable<StudentWithAttendanceItem> students)
        {
            var list = students.ToList();
            return new AttendanceSummary
            {
                total = list.Count,
                present = list.Count(s => s.attendancestatus == "present"),
                absent = list.Count(s => s.attendancestatus == "absent"),
                late = list.Count(s => s.attendancestatus == "late"),
            };
        }

    }
}
