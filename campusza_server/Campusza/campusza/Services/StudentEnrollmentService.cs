using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using Npgsql;

namespace Campusza.Services.Campusza
{
    public class StudentEnrollmentService
    {
        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly RequestState requeststate;
        private readonly StudentService studentService;
        private readonly AdmissionNumberService admissionNumberService;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly StudentUserService studentUserService;

        public StudentEnrollmentService(
            IDbProvider dbprov,
            IQueryBuilderProvider qprov,
            RequestState rstate,
            StudentService studentSvc,
            AdmissionNumberService admissionNumberService,
            OrganizationIdResolver organizationIdResolver,
            StudentUserService studentUserService)
        {
            dbprovider = dbprov;
            querybuilderprovider = qprov;
            requeststate = rstate;
            studentService = studentSvc;
            this.admissionNumberService = admissionNumberService;
            this.organizationIdResolver = organizationIdResolver;
            this.studentUserService = studentUserService;
        }

        public async Task<List<StudentEnrollment>> Select(StudentEnrollmentSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, req);
        }

        public async Task<List<StudentEnrollment>> SelectTransaction(IDb db, StudentEnrollmentSelectReq req)
        {
            var result = new List<StudentEnrollment>();
            var orgFilter = ResolveOrgId(req.organizationid);

            string query = @"
                SELECT id, organization_id, student_id, academic_year, class_id, class_name, grade, section,
                       roll_number, enrollment_status, joined_date, left_date, status, is_current,
                       term_id, term_name, is_active, created_at, updated_at, created_by, updated_by
                FROM student_enrollments
                WHERE is_active = true
            ";

            if (!string.IsNullOrWhiteSpace(orgFilter))
                query += " AND organization_id = @organization_id";
            if (!string.IsNullOrWhiteSpace(req.id))
                query += " AND id = @id";
            if (!string.IsNullOrWhiteSpace(req.studentid))
                query += " AND student_id = @student_id";
            if (!string.IsNullOrWhiteSpace(req.academicyear))
                query += " AND academic_year = @academic_year";
            if (!string.IsNullOrWhiteSpace(req.classid))
                query += " AND class_id = @class_id";
            if (!string.IsNullOrWhiteSpace(req.section))
                query += " AND section = @section";
            if (!string.IsNullOrWhiteSpace(req.status))
                query += " AND status = @status";
            if (req.iscurrent.HasValue)
                query += " AND is_current = @is_current";

            query += " ORDER BY academic_year DESC, created_at DESC";

            DbCommand command = db.GetCommand(query);
            BindSelectParams(db, command, req, orgFilter);

            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                result.Add(MapEnrollment(reader));
            }
            return result;
        }

        public async Task<List<StudentEnrollmentWithProfile>> SelectWithProfile(StudentEnrollmentSelectReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectWithProfileTransaction(db, req);
        }

        public async Task<List<StudentEnrollmentWithProfile>> SelectWithProfileTransaction(IDb db, StudentEnrollmentSelectReq req)
        {
            var result = new List<StudentEnrollmentWithProfile>();
            var orgFilter = ResolveOrgId(req.organizationid);

            string query = @"
                SELECT
                    e.id AS enrollment_id,
                    s.id AS student_id,
                    s.student_id AS admission_number,
                    s.first_name, s.last_name, s.full_name, s.email, s.phone,
                    COALESCE(NULLIF(cl.id, ''), e.class_id) AS class_id,
                    COALESCE(NULLIF(cl.name, ''), e.class_name) AS class_name,
                    COALESCE(NULLIF(cl.grade, ''), e.grade) AS grade,
                    COALESCE(NULLIF(cl.section, ''), e.section) AS section,
                    e.academic_year AS academic_year,
                    e.roll_number,
                    e.enrollment_status, e.status, e.is_current, s.status AS student_status,
                    s.admission_date, e.joined_date
                FROM student_enrollments e
                INNER JOIN students s ON s.id = e.student_id AND s.is_active = true
                LEFT JOIN classes cl ON cl.id = e.class_id
                    AND cl.organization_id = e.organization_id
                    AND cl.is_active = true
                WHERE e.is_active = true
            ";

            if (!string.IsNullOrWhiteSpace(orgFilter))
                query += " AND e.organization_id = @organization_id";
            if (!string.IsNullOrWhiteSpace(req.id))
                query += " AND e.id = @id";
            if (!string.IsNullOrWhiteSpace(req.studentid))
                query += " AND e.student_id = @student_id";
            if (!string.IsNullOrWhiteSpace(req.academicyear))
                query += " AND e.academic_year = @academic_year";
            if (!string.IsNullOrWhiteSpace(req.classid))
                query += " AND e.class_id = @class_id";
            if (!string.IsNullOrWhiteSpace(req.section))
                query += " AND e.section = @section";
            if (!string.IsNullOrWhiteSpace(req.status))
                query += " AND e.status = @status";
            if (req.iscurrent.HasValue)
                query += " AND e.is_current = @is_current";

            query += " ORDER BY e.roll_number ASC NULLS LAST, s.full_name ASC";

            DbCommand command = db.GetCommand(query);
            BindSelectParams(db, command, req, orgFilter);

            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                result.Add(new StudentEnrollmentWithProfile
                {
                    enrollmentid = reader["enrollment_id"]?.ToString() ?? "",
                    studentid = reader["student_id"]?.ToString() ?? "",
                    admissionnumber = reader["admission_number"]?.ToString() ?? "",
                    firstname = reader["first_name"]?.ToString() ?? "",
                    lastname = reader["last_name"]?.ToString() ?? "",
                    fullname = reader["full_name"]?.ToString() ?? "",
                    email = reader["email"]?.ToString() ?? "",
                    phone = reader["phone"]?.ToString() ?? "",
                    academicyear = reader["academic_year"]?.ToString() ?? "",
                    classid = reader["class_id"]?.ToString() ?? "",
                    classname = reader["class_name"]?.ToString() ?? "",
                    grade = reader["grade"]?.ToString() ?? "",
                    section = reader["section"]?.ToString() ?? "",
                    rollnumber = reader["roll_number"] == DBNull.Value ? null : Convert.ToInt32(reader["roll_number"]),
                    enrollmentstatus = reader["enrollment_status"]?.ToString() ?? "",
                    status = reader["status"]?.ToString() ?? "",
                    iscurrent = reader["is_current"] != DBNull.Value && Convert.ToBoolean(reader["is_current"]),
                    studentstatus = reader["student_status"]?.ToString() ?? "",
                    admissiondate = reader["admission_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["admission_date"]),
                    joineddate = reader["joined_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["joined_date"]),
                });
            }
            return result;
        }

        public async Task<StudentEnrollment?> GetCurrent(string studentId, string organizationId = "")
        {
            var rows = await Select(new StudentEnrollmentSelectReq
            {
                studentid = studentId,
                organizationid = organizationId,
                iscurrent = true
            });
            return rows.FirstOrDefault();
        }

        public async Task<List<StudentTransfer>> GetTransferHistory(string studentId, string organizationId = "")
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            var result = new List<StudentTransfer>();
            var orgFilter = ResolveOrgId(organizationId);

            string query = @"
                SELECT id, organization_id, student_id, enrollment_id, from_class_id, from_class_name,
                       from_section, to_class_id, to_class_name, to_section, reason, effective_date,
                       created_by, created_at, is_active
                FROM student_transfers
                WHERE is_active = true AND student_id = @student_id
            ";
            if (!string.IsNullOrWhiteSpace(orgFilter))
                query += " AND organization_id = @organization_id";
            query += " ORDER BY effective_date DESC, created_at DESC";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = studentId;
            if (!string.IsNullOrWhiteSpace(orgFilter))
            {
                db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = orgFilter;
            }

            using DbDataReader reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                result.Add(MapTransfer(reader));
            }
            return result;
        }

        public async Task<Student> CreateStudentWithEnrollment(CreateStudentWithEnrollmentReq req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var student = req.student;
                var enrollment = req.enrollment;

                var orgId = await organizationIdResolver.RequireAsync(
                    student.organizationid ?? enrollment.organizationid,
                    req.email);
                student.organizationid = orgId;
                enrollment.organizationid = orgId;

                if (string.IsNullOrWhiteSpace(student.studentid))
                {
                    student.studentid = await admissionNumberService.ReserveNextTransaction(db, orgId, req.email);
                }

                var classId = !string.IsNullOrWhiteSpace(enrollment.classid) ? enrollment.classid : student.classid;
                int? requestedRoll = enrollment.rollnumber > 0
                    ? enrollment.rollnumber
                    : (student.rollnumber > 0 ? student.rollnumber : null);
                int resolvedRoll = await ResolveRollNumberTransaction(db, orgId, classId, requestedRoll);

                enrollment.classid = classId;
                enrollment.classname = string.IsNullOrWhiteSpace(enrollment.classname) ? student.classname : enrollment.classname;
                enrollment.grade = string.IsNullOrWhiteSpace(enrollment.grade) ? student.grade : enrollment.grade;
                enrollment.section = string.IsNullOrWhiteSpace(enrollment.section) ? student.section : enrollment.section;
                enrollment.rollnumber = resolvedRoll;

                // Avoid students(class_id, roll_number) unique violation — placement syncs after enrollment.
                student.classid = "";
                student.classname = "";
                student.grade = "";
                student.section = "";
                student.rollnumber = 0;

                await studentService.InsertTransaction(db, student);

                enrollment.studentid = student.id;
                enrollment.organizationid = student.organizationid;
                enrollment.iscurrent = true;
                enrollment.status = "current";
                enrollment.enrollmentstatus = "enrolled";
                enrollment.isactive = true;
                if (!enrollment.joineddate.HasValue || enrollment.joineddate == DateTime.MinValue)
                    enrollment.joineddate = student.admissiondate;

                await InsertTransaction(db, enrollment);
                await SyncStudentPointerTransaction(db, student.id, enrollment);
                await studentUserService.CreateUserForStudentTransaction(db, student, ResolveActor());

                student.classid = enrollment.classid;
                student.classname = enrollment.classname;
                student.grade = enrollment.grade;
                student.section = enrollment.section;
                student.rollnumber = resolvedRoll;

                await db.CommitTransaction();
                return student;
            }
            catch (PostgresException ex) when (ex.SqlState == "23505" && ex.ConstraintName?.Contains("roll_number", StringComparison.OrdinalIgnoreCase) == true)
            {
                await db.RollbackTransaction();
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Roll number already taken in this class. Try again or pick a different roll number.");
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<StudentEnrollment> UpdateEnrollment(UpdateEnrollmentReq req)
        {
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Enrollment ID is required.");

            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var rows = await SelectTransaction(db, new StudentEnrollmentSelectReq
                {
                    id = req.id,
                    organizationid = orgId,
                });
                var enrollment = rows.FirstOrDefault();
                if (enrollment == null)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Enrollment not found.");

                if (req.rollnumber.HasValue)
                {
                    if (await RollNumberTakenTransaction(db, orgId, enrollment.classid, req.rollnumber.Value, enrollment.studentid))
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest,
                            "Roll number already taken in this class.");
                    }
                    enrollment.rollnumber = req.rollnumber.Value;
                    var now = DateTime.UtcNow;
                    var actor = ResolveActor();
                    string query = @"
                        UPDATE student_enrollments
                        SET roll_number = @roll_number, updated_at = @updated_at, updated_by = @updated_by
                        WHERE id = @id AND organization_id = @organization_id
                    ";
                    DbCommand cmd = db.GetCommand(query);
                    db.AddParameter(cmd, "id", DbTypes.Types.String).Value = enrollment.id;
                    db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                    db.AddParameter(cmd, "roll_number", DbTypes.Types.Integer).Value = enrollment.rollnumber;
                    db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
                    db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;
                    await db.ExecuteNonQuery(cmd);

                    if (enrollment.iscurrent)
                    {
                        string studentQuery = @"
                            UPDATE students
                            SET roll_number = @roll_number, updated_at = @updated_at, updated_by = @updated_by
                            WHERE id = @id AND organization_id = @organization_id
                        ";
                        DbCommand studentCmd = db.GetCommand(studentQuery);
                        db.AddParameter(studentCmd, "id", DbTypes.Types.String).Value = enrollment.studentid;
                        db.AddParameter(studentCmd, "organization_id", DbTypes.Types.String).Value = orgId;
                        db.AddParameter(studentCmd, "roll_number", DbTypes.Types.Integer).Value = enrollment.rollnumber;
                        db.AddParameter(studentCmd, "updated_at", DbTypes.Types.DateTime).Value = now;
                        db.AddParameter(studentCmd, "updated_by", DbTypes.Types.String).Value = actor;
                        await db.ExecuteNonQuery(studentCmd);
                    }
                }

                await db.CommitTransaction();
                return enrollment;
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<StudentEnrollment> Insert(StudentEnrollment enrollment)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await InsertTransaction(db, enrollment);
            return enrollment;
        }

        public async Task InsertTransaction(IDb db, StudentEnrollment enrollment)
        {
            if (string.IsNullOrWhiteSpace(enrollment.organizationid))
                enrollment.organizationid = ResolveOrgId("");

            DateTime now = DateTime.UtcNow;
            enrollment.id = string.IsNullOrWhiteSpace(enrollment.id) ? Guid.NewGuid().ToString() : enrollment.id;
            enrollment.createdat = now;
            enrollment.updatedat = now;
            enrollment.createdby = ResolveActor();
            enrollment.updatedby = enrollment.createdby;

            if (enrollment.iscurrent)
            {
                await ClearCurrentFlagTransaction(db, enrollment.studentid, enrollment.organizationid);
            }

            string query = @"
                INSERT INTO student_enrollments (
                    id, organization_id, student_id, academic_year, class_id, class_name, grade, section,
                    roll_number, enrollment_status, joined_date, left_date, status, is_current,
                    term_id, term_name, is_active, created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @student_id, @academic_year, @class_id, @class_name, @grade, @section,
                    @roll_number, @enrollment_status, @joined_date, @left_date, @status, @is_current,
                    @term_id, @term_name, @is_active, @created_at, @updated_at, @created_by, @updated_by
                )
            ";

            DbCommand command = db.GetCommand(query);
            BindEnrollmentParams(db, command, enrollment);
            await db.ExecuteNonQuery(command);
        }

        public async Task<List<StudentEnrollment>> PromoteStudents(PromoteStudentsRequest req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var result = new List<StudentEnrollment>();
                var orgId = ResolveOrgId(req.organizationid);
                var now = DateTime.UtcNow;
                var actor = ResolveActor();

                var processed = 0;
                foreach (var item in req.students ?? new List<StudentPromotionOutcome>())
                {
                    if (string.IsNullOrWhiteSpace(item.studentid)) continue;

                    var currentRows = await SelectTransaction(db, new StudentEnrollmentSelectReq
                    {
                        organizationid = orgId,
                        studentid = item.studentid,
                        classid = req.fromclassid,
                        iscurrent = true
                    });
                    var current = currentRows.FirstOrDefault();
                    if (current == null) continue;
                    if (!string.IsNullOrWhiteSpace(req.fromsection)
                        && !SectionMatches(current.section, req.fromsection))
                        continue;

                    string outcome = (item.outcome ?? "promote").ToLowerInvariant();
                    string promoType = outcome switch
                    {
                        "repeat" => "retained",
                        "transfer_out" => "transferred",
                        "left_school" => "dropped",
                        _ => "promoted"
                    };

                    await CloseEnrollmentTransaction(db, current, promoType, now);

                    await ArchiveEnrollmentToHistoryTransaction(db, current, promoType, now, actor);

                    StudentEnrollment? newEnrollment = null;
                    if (outcome == "promote" || outcome == "repeat")
                    {
                        ClassPlacementRow? targetClass = null;
                        if (outcome == "promote")
                        {
                            targetClass = await LoadClassPlacementTransaction(db, orgId, req.toclassid);
                            if (targetClass == null)
                                throw new AppException(AppException.ErrorCodes.BadRequest, "Target class not found.");
                        }
                        else
                        {
                            targetClass = await LoadClassPlacementTransaction(db, orgId, current.classid);
                        }

                        var section = outcome == "repeat"
                            ? current.section
                            : (string.IsNullOrWhiteSpace(req.tosection) ? targetClass!.Section : req.tosection);
                        var academicYear = outcome == "promote"
                            ? await ResolveAcademicYearValueTransaction(db, orgId, req.toacademicyear, targetClass!.AcademicYear)
                            : targetClass!.AcademicYear;
                        newEnrollment = new StudentEnrollment
                        {
                            organizationid = orgId,
                            studentid = item.studentid,
                            academicyear = academicYear,
                            classid = targetClass.ClassId,
                            classname = targetClass.ClassName,
                            grade = outcome == "repeat" ? current.grade : targetClass.Grade,
                            section = section,
                            rollnumber = item.rollnumber,
                            enrollmentstatus = "enrolled",
                            joineddate = now,
                            status = "current",
                            iscurrent = true,
                            termid = string.IsNullOrWhiteSpace(req.newtermid) ? targetClass.TermId : req.newtermid,
                            termname = string.IsNullOrWhiteSpace(req.newtermname) ? targetClass.TermName : req.newtermname,
                            isactive = true
                        };
                        await InsertTransaction(db, newEnrollment);
                        await SyncStudentPointerTransaction(db, item.studentid, newEnrollment);
                        result.Add(newEnrollment);
                    }
                    else if (outcome == "left_school")
                    {
                        await UpdateStudentStatusTransaction(db, item.studentid, orgId);
                    }

                    await SavePromotionRecordTransaction(db, req, current, item, promoType, now, actor);
                    processed++;
                }

                if ((req.students?.Count ?? 0) > 0 && processed == 0)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "No active enrollments matched the selected source class. Check academic year and class, then try again.");
                }

                await db.CommitTransaction();
                return result;
            }
            catch (Exception ex)
            {
                await db.RollbackTransaction();
                throw new Exception($"Promotion failed: {ex.Message}", ex);
            }
        }

        public async Task<StudentEnrollment> TransferStudent(TransferStudentRequest req)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var orgId = ResolveOrgId(req.organizationid);
                var now = DateTime.UtcNow;
                var actor = ResolveActor();

                var currentRows = await SelectTransaction(db, new StudentEnrollmentSelectReq
                {
                    organizationid = orgId,
                    studentid = req.studentid,
                    id = req.enrollmentid,
                    iscurrent = true
                });
                var current = currentRows.FirstOrDefault();
                if (current == null)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Active enrollment not found.");

                await CloseEnrollmentTransaction(db, current, "transferred", now);

                var targetClass = await LoadClassPlacementTransaction(db, orgId, req.toclassid);
                if (targetClass == null)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Target class not found.");

                var transferSection = string.IsNullOrWhiteSpace(req.tosection) ? targetClass.Section : req.tosection;
                var newEnrollment = new StudentEnrollment
                {
                    organizationid = orgId,
                    studentid = req.studentid,
                    academicyear = targetClass.AcademicYear,
                    classid = targetClass.ClassId,
                    classname = targetClass.ClassName,
                    grade = targetClass.Grade,
                    section = transferSection,
                    rollnumber = req.rollnumber ?? current.rollnumber,
                    enrollmentstatus = "enrolled",
                    joineddate = req.effectivedate == DateTime.MinValue ? now : req.effectivedate,
                    status = "current",
                    iscurrent = true,
                    termid = targetClass.TermId,
                    termname = targetClass.TermName,
                    isactive = true
                };
                await InsertTransaction(db, newEnrollment);
                await SyncStudentPointerTransaction(db, req.studentid, newEnrollment);

                var transfer = new StudentTransfer
                {
                    id = Guid.NewGuid().ToString(),
                    organizationid = orgId,
                    studentid = req.studentid,
                    enrollmentid = current.id,
                    fromclassid = current.classid,
                    fromclassname = current.classname,
                    fromsection = current.section,
                    toclassid = req.toclassid,
                    toclassname = req.toclassname,
                    tosection = req.tosection,
                    reason = req.reason ?? "",
                    effectivedate = req.effectivedate == DateTime.MinValue ? now : req.effectivedate,
                    createdby = actor,
                    createdat = now,
                    isactive = true
                };
                await InsertTransferTransaction(db, transfer);

                await db.CommitTransaction();
                return newEnrollment;
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        private async Task ClearCurrentFlagTransaction(IDb db, string studentId, string organizationId)
        {
            string query = @"
                UPDATE student_enrollments
                SET is_current = false, updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
                WHERE student_id = @student_id AND organization_id = @organization_id AND is_current = true
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "student_id", DbTypes.Types.String).Value = studentId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = ResolveActor();
            await db.ExecuteNonQuery(cmd);
        }

        private async Task CloseEnrollmentTransaction(IDb db, StudentEnrollment enrollment, string closeStatus, DateTime now)
        {
            var (status, enrollmentStatus) = MapCloseEnrollmentFields(closeStatus);
            string query = @"
                UPDATE student_enrollments
                SET is_current = false, status = @status, enrollment_status = @enrollment_status,
                    left_date = @left_date, updated_at = @updated_at, updated_by = @updated_by
                WHERE id = @id
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = enrollment.id;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(cmd, "enrollment_status", DbTypes.Types.String).Value = enrollmentStatus;
            db.AddParameter(cmd, "left_date", DbTypes.Types.Date).Value = now.Date;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = ResolveActor();
            await db.ExecuteNonQuery(cmd);
        }

        /// <summary>Maps promotion workflow labels to student_enrollments check constraints.</summary>
        private static (string status, string enrollmentStatus) MapCloseEnrollmentFields(string closeStatus)
        {
            return closeStatus switch
            {
                "transferred" => ("transferred", "transferred"),
                "dropped" => ("left", "left"),
                "retained" => ("completed", "completed"),
                "promoted" => ("completed", "completed"),
                _ => ("completed", "completed"),
            };
        }

        private async Task SyncStudentPointerTransaction(IDb db, string studentId, StudentEnrollment enrollment)
        {
            string query = @"
                UPDATE students
                SET class_id = @class_id, class_name = @class_name, grade = @grade, section = @section,
                    roll_number = @roll_number, current_academic_year = @academic_year,
                    current_term_id = @term_id, current_term_name = @term_name,
                    updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
                WHERE id = @id
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = studentId;
            db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(enrollment.classid) ? DBNull.Value : enrollment.classid;
            db.AddParameter(cmd, "class_name", DbTypes.Types.String).Value = enrollment.classname ?? "";
            db.AddParameter(cmd, "grade", DbTypes.Types.String).Value = enrollment.grade ?? "";
            db.AddParameter(cmd, "section", DbTypes.Types.String).Value = enrollment.section ?? "";
            db.AddParameter(cmd, "roll_number", DbTypes.Types.Integer).Value = enrollment.rollnumber ?? 0;
            db.AddParameter(cmd, "academic_year", DbTypes.Types.String).Value = enrollment.academicyear ?? "";
            db.AddParameter(cmd, "term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(enrollment.termid) ? DBNull.Value : enrollment.termid;
            db.AddParameter(cmd, "term_name", DbTypes.Types.String).Value = enrollment.termname ?? "";
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = ResolveActor();
            await db.ExecuteNonQuery(cmd);
        }

        private async Task ArchiveEnrollmentToHistoryTransaction(IDb db, StudentEnrollment enrollment, string promoStatus, DateTime now, string actor)
        {
            string query = @"
                INSERT INTO student_academic_history (
                    id, organization_id, student_id, academic_year, grade, class_id, class_name,
                    section, roll_number, promotion_status, promotion_date, is_active,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @student_id, @academic_year, @grade, @class_id, @class_name,
                    @section, @roll_number, @promotion_status, @promotion_date, true,
                    @created_at, @updated_at, @created_by, @updated_by
                )
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = enrollment.organizationid;
            db.AddParameter(cmd, "student_id", DbTypes.Types.String).Value = enrollment.studentid;
            db.AddParameter(cmd, "academic_year", DbTypes.Types.String).Value = enrollment.academicyear;
            db.AddParameter(cmd, "grade", DbTypes.Types.String).Value = enrollment.grade ?? "";
            db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = enrollment.classid ?? "";
            db.AddParameter(cmd, "class_name", DbTypes.Types.String).Value = enrollment.classname ?? "";
            db.AddParameter(cmd, "section", DbTypes.Types.String).Value = enrollment.section ?? "";
            db.AddParameter(cmd, "roll_number", DbTypes.Types.Integer).Value = enrollment.rollnumber ?? 0;
            db.AddParameter(cmd, "promotion_status", DbTypes.Types.String).Value = promoStatus;
            db.AddParameter(cmd, "promotion_date", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = actor;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task SavePromotionRecordTransaction(
            IDb db, PromoteStudentsRequest req, StudentEnrollment fromEnrollment,
            StudentPromotionOutcome item, string promoType, DateTime now, string actor)
        {
            var studentName = await GetStudentNameTransaction(db, item.studentid);
            string toGrade = promoType == "retained" ? fromEnrollment.grade ?? "" : req.tograde;
            string toClassId = promoType == "retained" ? fromEnrollment.classid : req.toclassid;
            string toClassName = promoType == "retained" ? fromEnrollment.classname : req.toclassname;

            string query = @"
                INSERT INTO student_promotions (
                    id, organization_id, student_id, student_name, from_grade, from_class_id, from_class_name,
                    to_grade, to_class_id, to_class_name, academic_year_from, academic_year_to,
                    promotion_type, promotion_date, promoted_by, notes, is_active,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    @id, @organization_id, @student_id, @student_name, @from_grade, @from_class_id, @from_class_name,
                    @to_grade, @to_class_id, @to_class_name, @academic_year_from, @academic_year_to,
                    @promotion_type, @promotion_date, @promoted_by, @notes, true,
                    @created_at, @updated_at, @created_by, @updated_by
                )
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = ResolveOrgId(req.organizationid);
            db.AddParameter(cmd, "student_id", DbTypes.Types.String).Value = item.studentid;
            db.AddParameter(cmd, "student_name", DbTypes.Types.String).Value = studentName;
            db.AddParameter(cmd, "from_grade", DbTypes.Types.String).Value = fromEnrollment.grade ?? "";
            db.AddParameter(cmd, "from_class_id", DbTypes.Types.String).Value = fromEnrollment.classid ?? "";
            db.AddParameter(cmd, "from_class_name", DbTypes.Types.String).Value = fromEnrollment.classname ?? "";
            db.AddParameter(cmd, "to_grade", DbTypes.Types.String).Value = toGrade ?? "";
            db.AddParameter(cmd, "to_class_id", DbTypes.Types.String).Value = toClassId ?? "";
            db.AddParameter(cmd, "to_class_name", DbTypes.Types.String).Value = toClassName ?? "";
            db.AddParameter(cmd, "academic_year_from", DbTypes.Types.String).Value = req.fromacademicyear;
            db.AddParameter(cmd, "academic_year_to", DbTypes.Types.String).Value = promoType == "retained" ? req.fromacademicyear : req.toacademicyear;
            db.AddParameter(cmd, "promotion_type", DbTypes.Types.String).Value = promoType;
            db.AddParameter(cmd, "promotion_date", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "promoted_by", DbTypes.Types.String).Value = req.promotedby ?? actor;
            db.AddParameter(cmd, "notes", DbTypes.Types.String).Value = req.notes ?? "";
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = actor;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task UpdateStudentStatusTransaction(IDb db, string studentId, string organizationId)
        {
            string query = @"
                UPDATE students
                SET is_active = false, updated_at = CURRENT_TIMESTAMP, updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = studentId;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = ResolveActor();
            await db.ExecuteNonQuery(cmd);
        }

        private async Task InsertTransferTransaction(IDb db, StudentTransfer transfer)
        {
            string query = @"
                INSERT INTO student_transfers (
                    id, organization_id, student_id, enrollment_id, from_class_id, from_class_name,
                    from_section, to_class_id, to_class_name, to_section, reason, effective_date,
                    created_by, created_at, is_active
                ) VALUES (
                    @id, @organization_id, @student_id, @enrollment_id, @from_class_id, @from_class_name,
                    @from_section, @to_class_id, @to_class_name, @to_section, @reason, @effective_date,
                    @created_by, @created_at, @is_active
                )
            ";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = transfer.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = transfer.organizationid;
            db.AddParameter(cmd, "student_id", DbTypes.Types.String).Value = transfer.studentid;
            db.AddParameter(cmd, "enrollment_id", DbTypes.Types.String).Value = transfer.enrollmentid ?? "";
            db.AddParameter(cmd, "from_class_id", DbTypes.Types.String).Value = transfer.fromclassid ?? "";
            db.AddParameter(cmd, "from_class_name", DbTypes.Types.String).Value = transfer.fromclassname ?? "";
            db.AddParameter(cmd, "from_section", DbTypes.Types.String).Value = transfer.fromsection ?? "";
            db.AddParameter(cmd, "to_class_id", DbTypes.Types.String).Value = transfer.toclassid ?? "";
            db.AddParameter(cmd, "to_class_name", DbTypes.Types.String).Value = transfer.toclassname ?? "";
            db.AddParameter(cmd, "to_section", DbTypes.Types.String).Value = transfer.tosection ?? "";
            db.AddParameter(cmd, "reason", DbTypes.Types.String).Value = transfer.reason ?? "";
            db.AddParameter(cmd, "effective_date", DbTypes.Types.Date).Value = transfer.effectivedate.Date;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = transfer.createdby ?? "";
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = transfer.createdat;
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = transfer.isactive;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task<string> GetStudentNameTransaction(IDb db, string studentId)
        {
            string query = "SELECT full_name FROM students WHERE id = @id LIMIT 1";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = studentId;
            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
                return reader["full_name"]?.ToString() ?? "";
            return "";
        }

        private void BindSelectParams(IDb db, DbCommand command, StudentEnrollmentSelectReq req, string orgFilter)
        {
            if (!string.IsNullOrWhiteSpace(orgFilter))
            {
                db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = orgFilter;
            }
            if (!string.IsNullOrWhiteSpace(req.id))
            {
                db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id;
            }
            if (!string.IsNullOrWhiteSpace(req.studentid))
            {
                db.AddParameter(command, "student_id", DbTypes.Types.String).Value = req.studentid;
            }
            if (!string.IsNullOrWhiteSpace(req.academicyear))
            {
                db.AddParameter(command, "academic_year", DbTypes.Types.String).Value = req.academicyear;
            }
            if (!string.IsNullOrWhiteSpace(req.classid))
            {
                db.AddParameter(command, "class_id", DbTypes.Types.String).Value = req.classid;
            }
            if (!string.IsNullOrWhiteSpace(req.section))
            {
                db.AddParameter(command, "section", DbTypes.Types.String).Value = req.section;
            }
            if (!string.IsNullOrWhiteSpace(req.status))
            {
                db.AddParameter(command, "status", DbTypes.Types.String).Value = req.status;
            }
            if (req.iscurrent.HasValue)
            {
                db.AddParameter(command, "is_current", DbTypes.Types.Boolean).Value = req.iscurrent.Value;
            }
        }

        private void BindEnrollmentParams(IDb db, DbCommand command, StudentEnrollment enrollment)
        {
            db.AddParameter(command, "id", DbTypes.Types.String).Value = enrollment.id;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = enrollment.organizationid;
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = enrollment.studentid;
            db.AddParameter(command, "academic_year", DbTypes.Types.String).Value = enrollment.academicyear ?? "";
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(enrollment.classid) ? DBNull.Value : enrollment.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = enrollment.classname ?? "";
            db.AddParameter(command, "grade", DbTypes.Types.String).Value = enrollment.grade ?? "";
            db.AddParameter(command, "section", DbTypes.Types.String).Value = enrollment.section ?? "";
            db.AddParameter(command, "roll_number", DbTypes.Types.Integer).Value = enrollment.rollnumber ?? 0;
            db.AddParameter(command, "enrollment_status", DbTypes.Types.String).Value = enrollment.enrollmentstatus ?? "enrolled";
            db.AddParameter(command, "joined_date", DbTypes.Types.Date).Value = enrollment.joineddate?.Date ?? DateTime.UtcNow.Date;
            db.AddParameter(command, "left_date", DbTypes.Types.Date).Value = enrollment.leftdate.HasValue ? enrollment.leftdate.Value.Date : DBNull.Value;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = enrollment.status ?? "current";
            db.AddParameter(command, "is_current", DbTypes.Types.Boolean).Value = enrollment.iscurrent;
            db.AddParameter(command, "term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(enrollment.termid) ? DBNull.Value : enrollment.termid;
            db.AddParameter(command, "term_name", DbTypes.Types.String).Value = enrollment.termname ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = enrollment.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = enrollment.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = enrollment.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = enrollment.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = enrollment.updatedby ?? "";
        }

        private StudentEnrollment MapEnrollment(DbDataReader reader)
        {
            return new StudentEnrollment
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                studentid = reader["student_id"]?.ToString() ?? "",
                academicyear = reader["academic_year"]?.ToString() ?? "",
                classid = reader["class_id"]?.ToString() ?? "",
                classname = reader["class_name"]?.ToString() ?? "",
                grade = reader["grade"]?.ToString() ?? "",
                section = reader["section"]?.ToString() ?? "",
                rollnumber = reader["roll_number"] == DBNull.Value ? null : Convert.ToInt32(reader["roll_number"]),
                enrollmentstatus = reader["enrollment_status"]?.ToString() ?? "",
                joineddate = reader["joined_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["joined_date"]),
                leftdate = reader["left_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["left_date"]),
                status = reader["status"]?.ToString() ?? "",
                iscurrent = reader["is_current"] != DBNull.Value && Convert.ToBoolean(reader["is_current"]),
                termid = reader["term_id"]?.ToString() ?? "",
                termname = reader["term_name"]?.ToString() ?? "",
                isactive = reader["is_active"] == DBNull.Value || Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? "",
            };
        }

        private StudentTransfer MapTransfer(DbDataReader reader)
        {
            return new StudentTransfer
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                studentid = reader["student_id"]?.ToString() ?? "",
                enrollmentid = reader["enrollment_id"]?.ToString() ?? "",
                fromclassid = reader["from_class_id"]?.ToString() ?? "",
                fromclassname = reader["from_class_name"]?.ToString() ?? "",
                fromsection = reader["from_section"]?.ToString() ?? "",
                toclassid = reader["to_class_id"]?.ToString() ?? "",
                toclassname = reader["to_class_name"]?.ToString() ?? "",
                tosection = reader["to_section"]?.ToString() ?? "",
                reason = reader["reason"]?.ToString() ?? "",
                effectivedate = reader["effective_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["effective_date"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                isactive = reader["is_active"] == DBNull.Value || Convert.ToBoolean(reader["is_active"]),
            };
        }

        private static async Task<int> ResolveRollNumberTransaction(
            IDb db,
            string organizationId,
            string classId,
            int? requestedRoll)
        {
            if (string.IsNullOrWhiteSpace(organizationId) || string.IsNullOrWhiteSpace(classId))
                return requestedRoll > 0 ? requestedRoll.Value : 1;

            var used = await LoadUsedRollNumbersTransaction(db, organizationId, classId, excludeStudentId: null);
            if (requestedRoll.HasValue && requestedRoll.Value > 0 && !used.Contains(requestedRoll.Value))
                return requestedRoll.Value;

            int roll = 1;
            while (used.Contains(roll))
                roll++;
            return roll;
        }

        private static async Task<bool> RollNumberTakenTransaction(
            IDb db,
            string organizationId,
            string classId,
            int rollNumber,
            string excludeStudentId)
        {
            if (string.IsNullOrWhiteSpace(organizationId) || string.IsNullOrWhiteSpace(classId) || rollNumber <= 0)
                return false;

            var used = await LoadUsedRollNumbersTransaction(db, organizationId, classId, excludeStudentId);
            return used.Contains(rollNumber);
        }

        private static async Task<HashSet<int>> LoadUsedRollNumbersTransaction(
            IDb db,
            string organizationId,
            string classId,
            string? excludeStudentId)
        {
            var used = new HashSet<int>();
            string studentsQuery = @"
                SELECT roll_number FROM students
                WHERE organization_id = @organization_id AND class_id = @class_id
                  AND is_active = true AND roll_number IS NOT NULL
            ";
            if (!string.IsNullOrWhiteSpace(excludeStudentId))
                studentsQuery += " AND id <> @exclude_student_id";

            string enrollmentsQuery = @"
                SELECT roll_number FROM student_enrollments
                WHERE organization_id = @organization_id AND class_id = @class_id
                  AND is_active = true AND status = 'current' AND roll_number IS NOT NULL
            ";
            if (!string.IsNullOrWhiteSpace(excludeStudentId))
                enrollmentsQuery += " AND student_id <> @exclude_student_id";

            foreach (var query in new[] { studentsQuery, enrollmentsQuery })
            {
                DbCommand cmd = db.GetCommand(query);
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
                db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = classId;
                if (!string.IsNullOrWhiteSpace(excludeStudentId))
                    db.AddParameter(cmd, "exclude_student_id", DbTypes.Types.String).Value = excludeStudentId;

                using DbDataReader reader = await db.Execute(cmd);
                while (await reader.ReadAsync())
                {
                    if (reader["roll_number"] != DBNull.Value)
                        used.Add(Convert.ToInt32(reader["roll_number"]));
                }
            }

            return used;
        }

        private sealed record ClassPlacementRow(
            string ClassId,
            string ClassName,
            string Grade,
            string Section,
            string AcademicYear,
            string TermId,
            string TermName);

        private static async Task<ClassPlacementRow?> LoadClassPlacementTransaction(IDb db, string orgId, string classId)
        {
            if (string.IsNullOrWhiteSpace(classId) || string.IsNullOrWhiteSpace(orgId))
                return null;

            const string query = @"
                SELECT c.id, c.name, c.grade, c.section, c.academic_year, c.term_id,
                       COALESCE(t.name, '') AS term_name
                FROM classes c
                LEFT JOIN terms t ON t.id = c.term_id AND t.organization_id = c.organization_id
                WHERE c.id = @class_id AND c.organization_id = @organization_id AND c.is_active = true
                LIMIT 1";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = classId.Trim();
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;

            return new ClassPlacementRow(
                reader["id"]?.ToString() ?? "",
                reader["name"]?.ToString() ?? "",
                reader["grade"]?.ToString() ?? "",
                reader["section"]?.ToString() ?? "",
                reader["academic_year"]?.ToString() ?? "",
                reader["term_id"]?.ToString() ?? "",
                reader["term_name"]?.ToString() ?? "");
        }

        private static bool SectionMatches(string? stored, string? requested)
        {
            if (string.IsNullOrWhiteSpace(requested))
                return true;
            return string.Equals((stored ?? "").Trim(), (requested ?? "").Trim(), StringComparison.OrdinalIgnoreCase);
        }

        private static async Task<string> ResolveAcademicYearValueTransaction(
            IDb db,
            string orgId,
            string? requested,
            string fallback)
        {
            var raw = (requested ?? "").Trim();
            if (string.IsNullOrEmpty(raw))
                return (fallback ?? "").Trim();

            const string query = @"
                SELECT id, name
                FROM reference_values
                WHERE (organization_id = @organization_id OR organization_id IS NULL)
                  AND category = 'academic_year'
                  AND is_active = true
                  AND (
                    id::text = @input
                    OR LOWER(TRIM(name)) = LOWER(TRIM(@input))
                    OR LOWER(TRIM(code)) = LOWER(TRIM(@input))
                  )
                ORDER BY organization_id DESC NULLS LAST
                LIMIT 1";
            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "input", DbTypes.Types.String).Value = raw;
            using DbDataReader reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                var name = reader["name"]?.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(name))
                    return name;
                var id = reader["id"]?.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(id))
                    return id;
            }

            return raw;
        }

        private string ResolveOrgId(string organizationId)
        {
            if (!string.IsNullOrWhiteSpace(organizationId))
                return organizationId.Trim();
            if (requeststate.usercontext?.organisationid > 0)
                return requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            return "";
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }
    }
}
