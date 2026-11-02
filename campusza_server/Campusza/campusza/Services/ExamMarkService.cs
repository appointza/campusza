using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamMarkService
    {
        private readonly IDbProvider dbprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamSeriesService examSeriesService;
        private readonly ExamSessionService examSessionService;
        private readonly StudentEnrollmentService studentEnrollmentService;
        private readonly ExamAuditService examAuditService;
        private readonly ExamValidationService examValidationService;
        private readonly RequestState requeststate;
        private readonly ClassService classService;
        private readonly StaffService staffService;
        private readonly UserService userService;
        private readonly ReferenceValueService referenceValueService;
        private readonly ExamSeatingService examSeatingService;

        public ExamMarkService(
            IDbProvider dbprovider,
            OrganizationIdResolver organizationIdResolver,
            ExamSeriesService examSeriesService,
            ExamSessionService examSessionService,
            StudentEnrollmentService studentEnrollmentService,
            ExamAuditService examAuditService,
            ExamValidationService examValidationService,
            RequestState requeststate,
            ClassService classService,
            StaffService staffService,
            UserService userService,
            ReferenceValueService referenceValueService,
            ExamSeatingService examSeatingService)
        {
            this.dbprovider = dbprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.examSeriesService = examSeriesService;
            this.examSessionService = examSessionService;
            this.studentEnrollmentService = studentEnrollmentService;
            this.examAuditService = examAuditService;
            this.examValidationService = examValidationService;
            this.requeststate = requeststate;
            this.classService = classService;
            this.staffService = staffService;
            this.userService = userService;
            this.referenceValueService = referenceValueService;
            this.examSeatingService = examSeatingService;
        }

        public async Task<ExamMarkGetRegisterRes> GetRegister(ExamMarkGetRegisterReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.examseriesid) || string.IsNullOrWhiteSpace(req.classid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series and class are required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
            await EnsureCanViewRegisterTransaction(db, orgId, req.classid, caller);

            return await BuildRegisterResponseTransaction(db, orgId, req.examseriesid, req.classid);
        }

        public async Task<ExamMarkSaveRegisterRes> SaveRegister(ExamMarkSaveRegisterReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.examseriesid) || string.IsNullOrWhiteSpace(req.classid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series and class are required.");

            if (req.cells == null || req.cells.Count == 0)
            {
                return new ExamMarkSaveRegisterRes { savedcount = 0, marksstatus = ExamMarksWorkflowStatuses.Draft };
            }

            ExamMarkRules.EnsureNoDuplicateCells(req.cells);

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
                var series = await examSeriesService.GetByIdTransaction(db, orgId, req.examseriesid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");
                ExamTenantGuard.EnsureSameOrganization(orgId, series.organizationid, "Exam series");

                var register = await LoadRegisterTransaction(db, orgId, req.examseriesid, req.classid);
                EnsureRegisterEditable(register, caller.isAdmin, allowSubmittedAdminEdit: caller.isAdmin);

                if (!caller.isAdmin && string.Equals(register?.marksstatus, ExamMarksWorkflowStatuses.Submitted, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Submitted registers cannot be edited by staff.");

                if (register == null)
                    await InsertRegisterDraftTransaction(db, orgId, req.examseriesid, req.classid, ResolveActor());

                var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
                {
                    organizationid = orgId,
                    examseriesid = req.examseriesid,
                    classid = req.classid,
                });
                var sessionById = sessions.ToDictionary(s => s.id, StringComparer.OrdinalIgnoreCase);

                var cls = (await classService.SelectTransaction(db, new ClassSelectReq { organizationid = orgId, id = req.classid }))
                    .FirstOrDefault()
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Class not found.");
                ExamTenantGuard.EnsureSameOrganization(orgId, cls.organizationid, "Class");

                var enrollments = await studentEnrollmentService.SelectTransaction(db, new StudentEnrollmentSelectReq
                {
                    organizationid = orgId,
                    classid = req.classid,
                    iscurrent = true,
                });
                var enrollmentById = enrollments.Where(e => e.isactive).ToDictionary(e => e.id, StringComparer.OrdinalIgnoreCase);

                var staffCtx = await LoadStaffEditContextTransaction(db, orgId, caller, cls);
                var actor = ResolveActor();
                var now = DateTime.UtcNow;
                var saved = 0;

                foreach (var cell in req.cells)
                {
                    if (!sessionById.TryGetValue(cell.sessionid ?? "", out var session))
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Session is not linked to this class and series.");

                    if (!caller.isAdmin && !ExamMarkAccess.StaffCanEnterMarksForSession(
                            staffCtx.staff, cls, session.subjectid, staffCtx.isClassTeacherOrMentor, staffCtx.teachesSubject(session.subjectid, req.classid)))
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Not authorized to edit marks for this subject.");
                    }

                    if (!enrollmentById.TryGetValue(cell.enrollmentid ?? "", out _))
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Enrollment is not in this class.");

                    ExamMarkRules.ValidateAttendanceAndMarks(
                        cell.attendancestatus ?? ExamMarkAttendanceStatuses.Pending,
                        cell.marksobtained,
                        session.maxmarks,
                        out var validationError);
                    if (validationError != null)
                        throw new AppException(AppException.ErrorCodes.BadRequest, validationError);

                    if (cell.expectedupdatedat.HasValue)
                    {
                        var existingUpdated = await GetMarkUpdatedAtTransaction(db, orgId, session.id, cell.enrollmentid!);
                        if (existingUpdated.HasValue)
                        {
                            var expected = cell.expectedupdatedat.Value.ToUniversalTime();
                            var actual = existingUpdated.Value.ToUniversalTime();
                            if (actual != expected)
                            {
                                throw new AppException(AppException.ErrorCodes.BadRequest,
                                    "Mark was updated by another user. Refresh and retry.");
                            }
                        }
                    }

                    await UpsertMarkTransaction(db, orgId, session, cell.enrollmentid!, cell, actor, now);
                    saved++;
                }

                await examAuditService.AppendAsync(db, orgId, "exam_class_mark_register",
                    RegisterKey(req.examseriesid, req.classid), "SaveRegister",
                    after: new { saved });

                await db.CommitTransaction();

                register = await LoadRegisterTransaction(db, orgId, req.examseriesid, req.classid);
                return new ExamMarkSaveRegisterRes
                {
                    savedcount = saved,
                    marksstatus = register?.marksstatus ?? ExamMarksWorkflowStatuses.Draft,
                };
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamMarkGetRegisterRes> SubmitRegister(ExamMarkRegisterWorkflowReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
                if (caller.isAdmin)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Staff submit required; admins should approve registers.");

                var register = await LoadRegisterTransaction(db, orgId, req.examseriesid, req.classid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "No mark register found for this class.");
                if (!string.Equals(register.marksstatus, ExamMarksWorkflowStatuses.Draft, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only draft registers can be submitted.");

                var grid = await BuildRegisterResponseTransaction(db, orgId, req.examseriesid, req.classid);
                foreach (var student in grid.students)
                {
                    foreach (var cell in student.cells)
                    {
                        if (!ExamMarkRules.IsMarkCellCompleteForSubmit(cell.attendancestatus, cell.marksobtained))
                            throw new AppException(AppException.ErrorCodes.BadRequest,
                                "All students must have attendance and marks resolved before submission.");
                    }
                }

                await UpdateRegisterStatusTransaction(db, orgId, req.examseriesid, req.classid,
                    ExamMarksWorkflowStatuses.Submitted, ResolveActor(), submitted: true);

                await examAuditService.AppendAsync(db, orgId, "exam_class_mark_register",
                    RegisterKey(req.examseriesid, req.classid), "SubmitRegister");

                await db.CommitTransaction();
                return await BuildRegisterResponseTransaction(db, orgId, req.examseriesid, req.classid);
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamMarkGetRegisterRes> ApproveRegister(ExamMarkRegisterWorkflowReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
                if (!caller.isAdmin)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only administrators can approve mark registers.");

                var register = await LoadRegisterTransaction(db, orgId, req.examseriesid, req.classid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "No mark register found for this class.");
                if (!string.Equals(register.marksstatus, ExamMarksWorkflowStatuses.Submitted, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only submitted registers can be approved.");

                await UpdateRegisterStatusTransaction(db, orgId, req.examseriesid, req.classid,
                    ExamMarksWorkflowStatuses.Approved, ResolveActor(), approved: true);

                await examAuditService.AppendAsync(db, orgId, "exam_class_mark_register",
                    RegisterKey(req.examseriesid, req.classid), "ApproveRegister");

                await db.CommitTransaction();
                return await BuildRegisterResponseTransaction(db, orgId, req.examseriesid, req.classid);
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamMarkGetRegisterRes> ReopenRegister(ExamMarkRegisterWorkflowReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.reason))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Reopen reason is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
                if (!caller.isAdmin)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only administrators can reopen mark registers.");

                var register = await LoadRegisterTransaction(db, orgId, req.examseriesid, req.classid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "No mark register found for this class.");
                if (string.Equals(register.marksstatus, ExamMarksWorkflowStatuses.Draft, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Register is already draft.");

                var before = new { register.marksstatus };
                await UpdateRegisterStatusTransaction(db, orgId, req.examseriesid, req.classid,
                    ExamMarksWorkflowStatuses.Draft, ResolveActor(), resetWorkflow: true);

                await examAuditService.AppendAsync(db, orgId, "exam_class_mark_register",
                    RegisterKey(req.examseriesid, req.classid), "ReopenRegister", req.reason, before);

                await db.CommitTransaction();
                return await BuildRegisterResponseTransaction(db, orgId, req.examseriesid, req.classid);
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamMarkPublishResultsRes> PublishResults(ExamMarkPublishResultsReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
                if (!caller.isAdmin)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only administrators can publish exam results.");

                var series = await examSeriesService.GetByIdTransaction(db, orgId, req.examseriesid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");

                var validation = await ValidateResultsPublicationTransaction(db, orgId, req.examseriesid);
                if (!validation.isvalid)
                {
                    await db.RollbackTransaction();
                    return new ExamMarkPublishResultsRes { success = false, errors = validation.errors };
                }

                examValidationService.EnsureSeriesTransition(series.status, ExamSeriesStatuses.ResultsPublished);
                series.status = ExamSeriesStatuses.ResultsPublished;
                series.updatedat = DateTime.UtcNow;
                series.updatedby = ResolveActor();
                await UpdateSeriesStatusTransaction(db, series);

                const string insertPub = @"
                    INSERT INTO exam_result_publications (id, organization_id, exam_series_id, published_by, published_at, remarks, status)
                    VALUES (@id, @organization_id, @exam_series_id, @published_by, @published_at, @remarks, 'Published')";
                var pubCmd = db.GetCommand(insertPub);
                db.AddParameter(pubCmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
                db.AddParameter(pubCmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(pubCmd, "exam_series_id", DbTypes.Types.String).Value = req.examseriesid;
                db.AddParameter(pubCmd, "published_by", DbTypes.Types.String).Value = ResolveActor();
                db.AddParameter(pubCmd, "published_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(pubCmd, "remarks", DbTypes.Types.String).Value = req.remarks ?? "";
                await db.ExecuteNonQuery(pubCmd);

                await examAuditService.AppendAsync(db, orgId, "exam_series", req.examseriesid, "PublishResults",
                    req.remarks, after: new { status = series.status });

                await db.CommitTransaction();
                return new ExamMarkPublishResultsRes { success = true, seriesstatus = series.status };
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamMarkPublishResultsRes> RevokeResults(ExamMarkPublishResultsReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.remarks))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Revocation reason is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
                if (!caller.isAdmin)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Only administrators can revoke published results.");

                var series = await examSeriesService.GetByIdTransaction(db, orgId, req.examseriesid)
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");
                if (!string.Equals(series.status, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Results are not published for this series.");

                examValidationService.EnsureSeriesTransition(series.status, ExamSeriesStatuses.Completed);
                series.status = ExamSeriesStatuses.Completed;
                series.updatedat = DateTime.UtcNow;
                series.updatedby = ResolveActor();
                await UpdateSeriesStatusTransaction(db, series);

                const string revoke = @"
                    UPDATE exam_result_publications SET status = 'Revoked', remarks = COALESCE(@remarks, remarks)
                    WHERE organization_id = @organization_id AND exam_series_id = @exam_series_id AND status = 'Published'";
                var cmd = db.GetCommand(revoke);
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(cmd, "exam_series_id", DbTypes.Types.String).Value = req.examseriesid;
                db.AddParameter(cmd, "remarks", DbTypes.Types.String).Value = req.remarks ?? "";
                await db.ExecuteNonQuery(cmd);

                await examAuditService.AppendAsync(db, orgId, "exam_series", req.examseriesid, "RevokeResults",
                    req.remarks, after: new { status = series.status });

                await db.CommitTransaction();
                return new ExamMarkPublishResultsRes { success = true, seriesstatus = series.status };
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamStudentResultsRes> GetStudentResults(ExamStudentResultsReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.examseriesid) || string.IsNullOrWhiteSpace(req.studentid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series and student are required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var enrollments = await studentEnrollmentService.SelectWithProfileTransaction(db, new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                studentid = req.studentid,
                iscurrent = true,
            });
            var enrollment = enrollments.FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Student enrollment not found.");

            var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
            if (!caller.isAdmin)
            {
                if (!string.Equals(enrollment.studentid, req.studentid, StringComparison.OrdinalIgnoreCase))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Students may only view their own results.");
                if (!string.IsNullOrWhiteSpace(caller.studentId)
                    && !string.Equals(caller.studentId, req.studentid, StringComparison.OrdinalIgnoreCase))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Students may only view their own results.");
                }
            }

            var series = await examSeriesService.GetByIdTransaction(db, orgId, req.examseriesid)
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");

            var published = string.Equals(series.status, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase);
            if (!published && !caller.isAdmin)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Results are not published yet.");

            var refs = await referenceValueService.SelectTransaction(db, new ReferenceValueSelectReq { organizationid = orgId });
            var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
            {
                organizationid = orgId,
                examseriesid = req.examseriesid,
                classid = enrollment.classid,
            });

            var marks = await LoadMarksForEnrollmentsTransaction(db, orgId, sessions.Select(s => s.id).ToList(),
                new[] { enrollment.enrollmentid });

            var subjects = new List<ExamStudentResultSubjectRow>();
            foreach (var session in sessions)
            {
                marks.TryGetValue(MarkKey(session.id, enrollment.enrollmentid), out var mark);
                var row = new ExamStudentResultSubjectRow
                {
                    sessionid = session.id,
                    subjectid = session.subjectid,
                    subjectname = ResolveRefName(refs, "subject", session.subjectid),
                    maxmarks = session.maxmarks,
                    passingmarks = session.passingmarks,
                    marksobtained = mark?.marksobtained,
                    attendancestatus = mark?.attendancestatus ?? ExamMarkAttendanceStatuses.Pending,
                };
                if (published && row.marksobtained.HasValue
                    && string.Equals(row.attendancestatus, ExamMarkAttendanceStatuses.Present, StringComparison.OrdinalIgnoreCase))
                {
                    row.passed = row.marksobtained.Value >= session.passingmarks;
                }
                subjects.Add(row);
            }

            var (totalObtained, totalMax, pct) = ExamResultsCalculator.Summarize(subjects);
            return new ExamStudentResultsRes
            {
                examseriesid = series.id,
                examseriesname = series.name,
                studentid = req.studentid,
                studentname = ResolveDisplayName(enrollment.firstname, enrollment.lastname, enrollment.fullname, enrollment.email),
                classid = enrollment.classid ?? "",
                classname = enrollment.classname ?? "",
                published = published,
                subjects = subjects,
                totalobtained = totalObtained,
                totalmax = totalMax,
                percentage = pct,
            };
        }

        public async Task<ExamClassResultsSummaryRes> GetClassResultsSummary(ExamClassResultsSummaryReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            var caller = await ResolveCallerContextTransaction(db, orgId, req.email);
            if (!caller.isAdmin)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Only administrators can view class result summaries.");

            var series = await examSeriesService.GetByIdTransaction(db, orgId, req.examseriesid)
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");

            var register = await BuildRegisterResponseTransaction(db, orgId, req.examseriesid, req.classid);
            return new ExamClassResultsSummaryRes
            {
                examseriesid = req.examseriesid,
                classid = req.classid,
                classname = register.classname,
                marksstatus = register.marksstatus,
                resultspublished = string.Equals(series.status, ExamSeriesStatuses.ResultsPublished, StringComparison.OrdinalIgnoreCase),
                students = register.students,
                sessions = register.sessions,
            };
        }

        public async Task<ExamHallTicketRes> GetHallTicket(ExamHallTicketReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
            {
                organizationid = orgId,
                id = req.examsessionid,
            });
            var session = sessions.FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");
            if (!string.Equals(session.status, ExamSessionStatuses.Published, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(session.status, ExamSessionStatuses.InProgress, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(session.status, ExamSessionStatuses.Completed, StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Hall ticket is available only for published exam sessions.");
            }

            var series = await examSeriesService.GetByIdTransaction(db, orgId, session.examseriesid)
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");

            var profiles = await studentEnrollmentService.SelectWithProfileTransaction(db, new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                id = req.studentenrollmentid,
            });
            var profile = profiles.FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Enrollment not found.");

            var refs = await referenceValueService.SelectTransaction(db, new ReferenceValueSelectReq { organizationid = orgId });
            var seats = await examSeatingService.SelectTransaction(db, orgId, req.examsessionid);
            var seat = seats.FirstOrDefault(s =>
                string.Equals(s.studentenrollmentid, req.studentenrollmentid, StringComparison.OrdinalIgnoreCase));

            return new ExamHallTicketRes
            {
                studentname = ResolveDisplayName(profile.firstname, profile.lastname, profile.fullname, profile.email),
                classname = profile.classname ?? "",
                rollnumber = profile.rollnumber,
                admissionnumber = profile.admissionnumber ?? "",
                seriesname = series.name,
                subjectname = ResolveRefName(refs, "subject", session.subjectid),
                examdate = session.examdate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                starttime = FormatTime(session.starttime),
                endtime = FormatTime(session.endtime),
                roomname = seat?.roomname ?? "",
                seatlabel = seat?.seatlabel ?? "",
                instructions = session.instructions ?? series.instructions ?? "",
            };
        }

        public async Task<ExamValidationResult> ValidateResultsPublication(ExamMarkPublishResultsReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await ValidateResultsPublicationTransaction(db, orgId, req.examseriesid);
        }

        private async Task<ExamValidationResult> ValidateResultsPublicationTransaction(IDb db, string orgId, string seriesId)
        {
            var result = new ExamValidationResult();
            var classIds = await LoadDistinctClassIdsForSeriesTransaction(db, orgId, seriesId);
            foreach (var classId in classIds)
            {
                var register = await LoadRegisterTransaction(db, orgId, seriesId, classId);
                if (register == null || !string.Equals(register.marksstatus, ExamMarksWorkflowStatuses.Approved, StringComparison.OrdinalIgnoreCase))
                {
                    result.errors.Add($"Class register {classId} is not approved.");
                    continue;
                }

                var grid = await BuildRegisterResponseTransaction(db, orgId, seriesId, classId);
                foreach (var student in grid.students)
                {
                    foreach (var cell in student.cells)
                    {
                        if (!ExamMarkRules.IsMarkCellCompleteForSubmit(cell.attendancestatus, cell.marksobtained))
                            result.errors.Add($"Missing marks for class {grid.classname}, student {student.studentname}.");
                    }
                }
            }

            if (classIds.Count == 0)
                result.errors.Add("No exam sessions with classes found for this series.");

            return result;
        }

        private async Task<ExamMarkGetRegisterRes> BuildRegisterResponseTransaction(IDb db, string orgId, string seriesId, string classId)
        {
            var series = await examSeriesService.GetByIdTransaction(db, orgId, seriesId)
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam series not found.");
            var cls = (await classService.SelectTransaction(db, new ClassSelectReq { organizationid = orgId, id = classId }))
                .FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Class not found.");

            var register = await LoadRegisterTransaction(db, orgId, seriesId, classId);
            var refs = await referenceValueService.SelectTransaction(db, new ReferenceValueSelectReq { organizationid = orgId });
            var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
            {
                organizationid = orgId,
                examseriesid = seriesId,
                classid = classId,
            });

            var sessionColumns = sessions.Select(s => new ExamMarkRegisterSessionColumn
            {
                sessionid = s.id,
                subjectid = s.subjectid,
                subjectname = ResolveRefName(refs, "subject", s.subjectid),
                maxmarks = s.maxmarks,
                passingmarks = s.passingmarks,
                examdate = s.examdate == DateTime.MinValue ? "" : s.examdate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            }).ToList();

            var profiles = await studentEnrollmentService.SelectWithProfileTransaction(db, new StudentEnrollmentSelectReq
            {
                organizationid = orgId,
                classid = classId,
                iscurrent = true,
            });

            var marks = await LoadMarksForEnrollmentsTransaction(db, orgId, sessions.Select(s => s.id).ToList(),
                profiles.Select(p => p.enrollmentid ?? "").Where(id => !string.IsNullOrWhiteSpace(id)));

            var students = profiles
                .OrderBy(p => p.rollnumber ?? int.MaxValue)
                .ThenBy(p => p.fullname, StringComparer.OrdinalIgnoreCase)
                .Select(p =>
                {
                    var enrollmentId = p.enrollmentid ?? "";
                    var cells = sessions.Select(s =>
                    {
                        marks.TryGetValue(MarkKey(s.id, enrollmentId), out var mark);
                        return new ExamMarkRegisterCellOut
                        {
                            sessionid = s.id,
                            enrollmentid = enrollmentId,
                            marksobtained = mark?.marksobtained,
                            attendancestatus = mark?.attendancestatus ?? ExamMarkAttendanceStatuses.Pending,
                            remarks = mark?.remarks ?? "",
                            updatedat = mark?.updatedat,
                        };
                    }).ToList();
                    return new ExamMarkRegisterStudentRow
                    {
                        enrollmentid = enrollmentId,
                        studentid = p.studentid ?? "",
                        rollnumber = p.rollnumber,
                        studentname = ResolveDisplayName(p.firstname, p.lastname, p.fullname, p.email),
                        classname = p.classname ?? cls.name,
                        cells = cells,
                    };
                }).ToList();

            return new ExamMarkGetRegisterRes
            {
                examseriesid = seriesId,
                examseriesname = series.name,
                classid = classId,
                classname = cls.name,
                marksstatus = register?.marksstatus ?? ExamMarksWorkflowStatuses.Draft,
                submittedat = register?.submittedat,
                submittedby = register?.submittedby ?? "",
                approvedat = register?.approvedat,
                approvedby = register?.approvedby ?? "",
                sessions = sessionColumns,
                students = students,
            };
        }

        private async Task<Dictionary<string, ExamMark>> LoadMarksForEnrollmentsTransaction(
            IDb db, string orgId, IReadOnlyList<string> sessionIds, IEnumerable<string> enrollmentIds)
        {
            var result = new Dictionary<string, ExamMark>(StringComparer.OrdinalIgnoreCase);
            var sessionList = sessionIds.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var enrollList = enrollmentIds.Where(e => !string.IsNullOrWhiteSpace(e)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (sessionList.Count == 0 || enrollList.Count == 0)
                return result;

            foreach (var sessionId in sessionList)
            {
                foreach (var enrollmentId in enrollList)
                {
                    const string query = @"
                        SELECT id, organization_id, exam_session_id, student_enrollment_id,
                               marks_obtained, attendance_status, remarks, entered_by, entered_at, updated_at, updated_by
                        FROM exam_marks
                        WHERE organization_id = @organization_id
                          AND exam_session_id = @exam_session_id
                          AND student_enrollment_id = @student_enrollment_id
                        LIMIT 1";
                    var cmd = db.GetCommand(query);
                    db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                    db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
                    db.AddParameter(cmd, "student_enrollment_id", DbTypes.Types.String).Value = enrollmentId;
                    using var reader = await db.Execute(cmd);
                    if (!await reader.ReadAsync())
                        continue;
                    var mark = ReadMark(reader);
                    result[MarkKey(mark.examsessionid, mark.studentenrollmentid)] = mark;
                }
            }
            return result;
        }

        private static ExamMark ReadMark(DbDataReader reader)
        {
            return new ExamMark
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                examsessionid = reader["exam_session_id"]?.ToString() ?? "",
                studentenrollmentid = reader["student_enrollment_id"]?.ToString() ?? "",
                marksobtained = reader["marks_obtained"] == DBNull.Value ? null : Convert.ToDecimal(reader["marks_obtained"]),
                attendancestatus = reader["attendance_status"]?.ToString() ?? ExamMarkAttendanceStatuses.Pending,
                remarks = reader["remarks"]?.ToString() ?? "",
                enteredby = reader["entered_by"]?.ToString() ?? "",
                enteredat = reader["entered_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["entered_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                updatedby = reader["updated_by"]?.ToString() ?? "",
            };
        }

        private sealed class RegisterRow
        {
            public string marksstatus { get; set; } = ExamMarksWorkflowStatuses.Draft;
            public DateTime? submittedat { get; set; }
            public string submittedby { get; set; } = "";
            public DateTime? approvedat { get; set; }
            public string approvedby { get; set; } = "";
        }

        private async Task<RegisterRow?> LoadRegisterTransaction(IDb db, string orgId, string seriesId, string classId)
        {
            const string select = @"
                SELECT marks_status, submitted_at, submitted_by, approved_at, approved_by
                FROM exam_class_mark_registers
                WHERE organization_id = @organization_id AND exam_series_id = @exam_series_id AND class_id = @class_id";
            var selCmd = db.GetCommand(select);
            db.AddParameter(selCmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(selCmd, "exam_series_id", DbTypes.Types.String).Value = seriesId;
            db.AddParameter(selCmd, "class_id", DbTypes.Types.String).Value = classId;
            using var reader = await db.Execute(selCmd);
            if (!await reader.ReadAsync())
                return null;
            return new RegisterRow
            {
                marksstatus = reader["marks_status"]?.ToString() ?? ExamMarksWorkflowStatuses.Draft,
                submittedat = reader["submitted_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["submitted_at"]),
                submittedby = reader["submitted_by"]?.ToString() ?? "",
                approvedat = reader["approved_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["approved_at"]),
                approvedby = reader["approved_by"]?.ToString() ?? "",
            };
        }

        private async Task InsertRegisterDraftTransaction(IDb db, string orgId, string seriesId, string classId, string actor)
        {
            const string insert = @"
                INSERT INTO exam_class_mark_registers (
                    id, organization_id, exam_series_id, class_id, marks_status, updated_at, updated_by
                ) VALUES (
                    @id, @organization_id, @exam_series_id, @class_id, @marks_status, @updated_at, @updated_by
                )";
            var ins = db.GetCommand(insert);
            db.AddParameter(ins, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(ins, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(ins, "exam_series_id", DbTypes.Types.String).Value = seriesId;
            db.AddParameter(ins, "class_id", DbTypes.Types.String).Value = classId;
            db.AddParameter(ins, "marks_status", DbTypes.Types.String).Value = ExamMarksWorkflowStatuses.Draft;
            db.AddParameter(ins, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(ins, "updated_by", DbTypes.Types.String).Value = actor;
            await db.ExecuteNonQuery(ins);
        }

        private async Task UpdateRegisterStatusTransaction(
            IDb db, string orgId, string seriesId, string classId, string status, string actor,
            bool submitted = false, bool approved = false, bool resetWorkflow = false)
        {
            var sql = @"
                UPDATE exam_class_mark_registers SET
                    marks_status = @marks_status,
                    updated_at = @updated_at,
                    updated_by = @updated_by";
            if (submitted)
                sql += ", submitted_at = @submitted_at, submitted_by = @submitted_by";
            if (approved)
                sql += ", approved_at = @approved_at, approved_by = @approved_by";
            if (resetWorkflow)
                sql += ", submitted_at = NULL, submitted_by = NULL, approved_at = NULL, approved_by = NULL";
            sql += @"
                WHERE organization_id = @organization_id AND exam_series_id = @exam_series_id AND class_id = @class_id";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "marks_status", DbTypes.Types.String).Value = status;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_series_id", DbTypes.Types.String).Value = seriesId;
            db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = classId;
            if (submitted)
            {
                db.AddParameter(cmd, "submitted_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(cmd, "submitted_by", DbTypes.Types.String).Value = actor;
            }
            if (approved)
            {
                db.AddParameter(cmd, "approved_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(cmd, "approved_by", DbTypes.Types.String).Value = actor;
            }
            await db.ExecuteNonQuery(cmd);
        }

        private static void EnsureRegisterEditable(RegisterRow? register, bool isAdmin, bool allowSubmittedAdminEdit)
        {
            if (register == null)
                return;
            if (string.Equals(register.marksstatus, ExamMarksWorkflowStatuses.Approved, StringComparison.OrdinalIgnoreCase))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Approved mark registers cannot be edited. Reopen with a reason first.");
            if (string.Equals(register.marksstatus, ExamMarksWorkflowStatuses.Submitted, StringComparison.OrdinalIgnoreCase)
                && !allowSubmittedAdminEdit)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Submitted mark registers cannot be edited.");
            }
        }

        private async Task<List<string>> LoadDistinctClassIdsForSeriesTransaction(IDb db, string orgId, string seriesId)
        {
            const string query = @"
                SELECT DISTINCT esc.class_id
                FROM exam_session_classes esc
                INNER JOIN exam_sessions es ON es.id = esc.exam_session_id AND es.organization_id = esc.organization_id
                WHERE esc.organization_id = @organization_id AND es.exam_series_id = @exam_series_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_series_id", DbTypes.Types.String).Value = seriesId;
            var list = new List<string>();
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                var id = reader["class_id"]?.ToString();
                if (!string.IsNullOrWhiteSpace(id))
                    list.Add(id);
            }
            return list;
        }

        private async Task UpdateSeriesStatusTransaction(IDb db, ExamSeries series)
        {
            const string query = @"
                UPDATE exam_series SET status = @status, updated_at = @updated_at, updated_by = @updated_by
                WHERE organization_id = @organization_id AND id = @id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = series.status;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = series.updatedat;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = series.updatedby;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = series.organizationid;
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = series.id;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task EnsureCanViewRegisterTransaction(IDb db, string orgId, string classId, CallerContext caller)
        {
            if (caller.isAdmin)
                return;

            var cls = (await classService.SelectTransaction(db, new ClassSelectReq { organizationid = orgId, id = classId }))
                .FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Class not found.");
            var staffCtx = await LoadStaffEditContextTransaction(db, orgId, caller, cls);
            if (staffCtx.staff == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Staff profile required.");

            var assigned = await classService.GetAssignedToStaff(new ClassAssignedToStaffReq
            {
                organizationid = orgId,
                staffid = staffCtx.staff.id,
            });
            if (!assigned.Any(c => string.Equals(c.id, classId, StringComparison.OrdinalIgnoreCase))
                && !staffCtx.scheduleRows.Any(r => string.Equals(r.classid, classId, StringComparison.OrdinalIgnoreCase)))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Not authorized for this class register.");
            }
        }

        private sealed class CallerContext
        {
            public bool isAdmin { get; set; }
            public string? studentId { get; set; }
            public string? staffId { get; set; }
            public string userEmail { get; set; } = "";
        }

        private sealed class StaffEditContext
        {
            public Staff? staff { get; set; }
            public bool isClassTeacherOrMentor { get; set; }
            public List<StaffSchedule> scheduleRows { get; set; } = new();

            public bool teachesSubject(string subjectId, string classId) =>
                scheduleRows.Any(r =>
                    string.Equals(r.classid, classId, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(r.subjectid, subjectId, StringComparison.OrdinalIgnoreCase));
        }

        private async Task<StaffEditContext> LoadStaffEditContextTransaction(IDb db, string orgId, CallerContext caller, Class cls)
        {
            var ctx = new StaffEditContext();
            if (caller.isAdmin)
                return ctx;

            if (!string.IsNullOrWhiteSpace(caller.staffId))
            {
                var byId = await staffService.SelectTransaction(db, new StaffSelectReq
                {
                    organizationid = orgId,
                    id = caller.staffId,
                });
                ctx.staff = byId.FirstOrDefault();
            }

            if (ctx.staff == null)
            {
                var staffRows = await staffService.SelectTransaction(db, new StaffSelectReq { organizationid = orgId });
                ctx.staff = staffRows.FirstOrDefault(s =>
                    string.Equals(s.email?.Trim(), caller.userEmail.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (ctx.staff == null)
            {
                var roleHint = string.IsNullOrWhiteSpace(caller.userEmail)
                    ? "Sign in again so your email is sent with the request."
                    : "Ensure users.role is admin or admin_staff for full register access, or add a matching staff profile for staff users.";
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    $"Staff profile not found for this user. {roleHint}");
            }

            ctx.isClassTeacherOrMentor =
                string.Equals(cls.classteacherid, ctx.staff.id, StringComparison.OrdinalIgnoreCase)
                || string.Equals(cls.assistantmentorid, ctx.staff.id, StringComparison.OrdinalIgnoreCase);

            const string sched = @"
                SELECT id, staff_id, subject_id, class_id FROM staff_schedules
                WHERE organization_id = @organization_id AND staff_id = @staff_id AND is_active = true";
            var cmd = db.GetCommand(sched);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "staff_id", DbTypes.Types.String).Value = ctx.staff.id;
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                ctx.scheduleRows.Add(new StaffSchedule
                {
                    id = reader["id"]?.ToString() ?? "",
                    staffid = reader["staff_id"]?.ToString() ?? "",
                    subjectid = reader["subject_id"]?.ToString() ?? "",
                    classid = reader["class_id"]?.ToString() ?? "",
                });
            }
            return ctx;
        }

        private async Task<CallerContext> ResolveCallerContextTransaction(IDb db, string orgId, string? email)
        {
            var ctx = new CallerContext
            {
                userEmail = email?.Trim() ?? requeststate.usercontext?.useremail?.Trim() ?? "",
            };

            var campusUser = await LoadCampuszaUserByEmailTransaction(db, ctx.userEmail);
            if (campusUser != null)
            {
                if (string.IsNullOrWhiteSpace(ctx.userEmail))
                    ctx.userEmail = campusUser.email ?? "";

                ctx.isAdmin = ExamMarkAccess.IsAdminRole(campusUser.role);

                if (!ctx.isAdmin
                    && !string.IsNullOrWhiteSpace(orgId)
                    && !string.IsNullOrWhiteSpace(campusUser.organizationId)
                    && !string.Equals(campusUser.organizationId.Trim(), orgId.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, "User does not belong to this organization.");
                }

                if (!ctx.isAdmin && string.Equals(campusUser.role, "staff", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrWhiteSpace(campusUser.profileId))
                        ctx.staffId = campusUser.profileId.Trim();
                    else
                    {
                        var resolvedStaffId = await ResolveStaffIdByEmailTransaction(db, orgId, ctx.userEmail);
                        if (!string.IsNullOrWhiteSpace(resolvedStaffId))
                            ctx.staffId = resolvedStaffId;
                    }
                }

                if (!ctx.isAdmin && string.Equals(campusUser.role, "student", StringComparison.OrdinalIgnoreCase)
                    && !string.IsNullOrWhiteSpace(campusUser.profileId))
                {
                    ctx.studentId = campusUser.profileId.Trim();
                }

                return ctx;
            }

            if (!string.IsNullOrWhiteSpace(ctx.userEmail))
            {
                var resolvedStaffId = await ResolveStaffIdByEmailTransaction(db, orgId, ctx.userEmail);
                if (!string.IsNullOrWhiteSpace(resolvedStaffId))
                    ctx.staffId = resolvedStaffId;
            }

            return ctx;
        }

        private sealed class CampuszaUserRow
        {
            public string email { get; set; } = "";
            public string role { get; set; } = "";
            public string organizationId { get; set; } = "";
            public string profileId { get; set; } = "";
        }

        private static async Task<CampuszaUserRow?> LoadCampuszaUserByEmailTransaction(IDb db, string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            const string query = @"
                SELECT email, role, organization_id, profile_id
                FROM users
                WHERE LOWER(TRIM(email)) = LOWER(TRIM(@email))
                  AND is_active = true
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email.Trim();
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;
            return new CampuszaUserRow
            {
                email = reader["email"]?.ToString() ?? "",
                role = reader["role"]?.ToString() ?? "",
                organizationId = reader["organization_id"]?.ToString() ?? "",
                profileId = reader["profile_id"]?.ToString() ?? "",
            };
        }

        private static async Task<string> ResolveStaffIdByEmailTransaction(IDb db, string orgId, string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return "";

            const string query = @"
                SELECT id FROM staff
                WHERE organization_id = @organization_id
                  AND LOWER(TRIM(email)) = LOWER(TRIM(@email))
                  AND is_active = true
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email.Trim();
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return "";
            return reader["id"]?.ToString() ?? "";
        }

        private async Task<DateTime?> GetMarkUpdatedAtTransaction(IDb db, string orgId, string sessionId, string enrollmentId)
        {
            const string query = @"
                SELECT updated_at FROM exam_marks
                WHERE organization_id = @organization_id
                  AND exam_session_id = @exam_session_id
                  AND student_enrollment_id = @student_enrollment_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            db.AddParameter(cmd, "student_enrollment_id", DbTypes.Types.String).Value = enrollmentId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;
            return reader["updated_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["updated_at"]);
        }

        private async Task UpsertMarkTransaction(
            IDb db, string orgId, ExamSession session, string enrollmentId,
            ExamMarkRegisterCell cell, string actor, DateTime now)
        {
            const string query = @"
                INSERT INTO exam_marks (
                    id, organization_id, exam_session_id, student_enrollment_id,
                    marks_obtained, attendance_status, remarks,
                    entered_by, entered_at, updated_at, updated_by
                ) VALUES (
                    @id, @organization_id, @exam_session_id, @student_enrollment_id,
                    @marks_obtained, @attendance_status, @remarks,
                    @entered_by, @entered_at, @updated_at, @updated_by
                )
                ON CONFLICT (organization_id, exam_session_id, student_enrollment_id)
                DO UPDATE SET
                    marks_obtained = EXCLUDED.marks_obtained,
                    attendance_status = EXCLUDED.attendance_status,
                    remarks = EXCLUDED.remarks,
                    updated_at = EXCLUDED.updated_at,
                    updated_by = EXCLUDED.updated_by";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = session.id;
            db.AddParameter(cmd, "student_enrollment_id", DbTypes.Types.String).Value = enrollmentId;
            db.AddParameter(cmd, "marks_obtained", DbTypes.Types.Decimal).Value =
                cell.marksobtained.HasValue ? cell.marksobtained.Value : DBNull.Value;
            db.AddParameter(cmd, "attendance_status", DbTypes.Types.String).Value =
                cell.attendancestatus ?? ExamMarkAttendanceStatuses.Pending;
            db.AddParameter(cmd, "remarks", DbTypes.Types.String).Value = cell.remarks ?? "";
            db.AddParameter(cmd, "entered_by", DbTypes.Types.String).Value = actor;
            db.AddParameter(cmd, "entered_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String).Value = actor;
            await db.ExecuteNonQuery(cmd);
        }

        private static string RegisterKey(string seriesId, string classId) => $"{seriesId}:{classId}";
        private static string MarkKey(string sessionId, string enrollmentId) => $"{sessionId}|{enrollmentId}";

        private static string ResolveRefName(List<ReferenceValue> refs, string category, string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return "";
            var match = refs.FirstOrDefault(r =>
                string.Equals(r.category, category, StringComparison.OrdinalIgnoreCase)
                && string.Equals(r.id, id, StringComparison.OrdinalIgnoreCase));
            return match?.name ?? id;
        }

        private static string ResolveDisplayName(string? first, string? last, string? full, string? email)
        {
            if (!string.IsNullOrWhiteSpace(full)) return full.Trim();
            var combined = $"{first} {last}".Trim();
            return string.IsNullOrWhiteSpace(combined) ? email ?? "" : combined;
        }

        private static string FormatTime(TimeSpan time) =>
            DateTime.Today.Add(time).ToString("h:mm tt", CultureInfo.InvariantCulture);

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }
    }
}
