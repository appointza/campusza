using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamSeatingService
    {
        private readonly IDbProvider dbprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamSessionService examSessionService;
        private readonly ExamSessionRoomService examSessionRoomService;
        private readonly ExamRoomService examRoomService;
        private readonly ExamAuditService examAuditService;
        private readonly RequestState requeststate;

        public ExamSeatingService(
            IDbProvider dbprovider,
            OrganizationIdResolver organizationIdResolver,
            ExamSessionService examSessionService,
            ExamSessionRoomService examSessionRoomService,
            ExamRoomService examRoomService,
            ExamAuditService examAuditService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.examSessionService = examSessionService;
            this.examSessionRoomService = examSessionRoomService;
            this.examRoomService = examRoomService;
            this.examAuditService = examAuditService;
            this.requeststate = requeststate;
        }

        public async Task<List<ExamSeatAllocation>> Select(ExamSeatSelectReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, "");
            if (string.IsNullOrWhiteSpace(req.examsessionid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session ID is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, orgId, req.examsessionid);
        }

        public async Task<List<ExamSeatAllocation>> SelectTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                SELECT sa.id, sa.organization_id, sa.exam_session_id, sa.exam_room_id, sa.student_enrollment_id,
                       sa.seat_label, sa.allocation_source, sa.is_locked, sa.allocated_by, sa.allocated_at,
                       er.name AS room_name,
                       COALESCE(sep.fullname, '') AS student_name,
                       COALESCE(sep.classname, '') AS class_name
                FROM exam_seat_allocations sa
                INNER JOIN school_rooms er ON er.id = sa.exam_room_id AND er.organization_id = sa.organization_id
                LEFT JOIN (
                    SELECT e.id AS enrollment_id, e.organization_id,
                           TRIM(COALESCE(s.first_name,'') || ' ' || COALESCE(s.last_name,'')) AS fullname,
                           c.name AS classname
                    FROM student_enrollments e
                    INNER JOIN students s ON s.id = e.student_id AND s.organization_id = e.organization_id
                    LEFT JOIN classes c ON c.id = e.class_id AND c.organization_id = e.organization_id
                ) sep ON sep.enrollment_id = sa.student_enrollment_id AND sep.organization_id = sa.organization_id
                WHERE sa.organization_id = @organization_id AND sa.exam_session_id = @exam_session_id
                ORDER BY er.name, sa.seat_label";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            var list = new List<ExamSeatAllocation>();
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new ExamSeatAllocation
                {
                    id = reader["id"]?.ToString() ?? "",
                    organizationid = reader["organization_id"]?.ToString() ?? "",
                    examsessionid = reader["exam_session_id"]?.ToString() ?? "",
                    examroomid = reader["exam_room_id"]?.ToString() ?? "",
                    roomname = reader["room_name"]?.ToString() ?? "",
                    studentenrollmentid = reader["student_enrollment_id"]?.ToString() ?? "",
                    studentname = reader["student_name"]?.ToString() ?? "",
                    classname = reader["class_name"]?.ToString() ?? "",
                    seatlabel = reader["seat_label"]?.ToString() ?? "",
                    allocationsource = reader["allocation_source"]?.ToString() ?? "",
                    islocked = reader["is_locked"] != DBNull.Value && Convert.ToBoolean(reader["is_locked"]),
                    allocatedby = reader["allocated_by"]?.ToString() ?? "",
                    allocatedat = reader["allocated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["allocated_at"]),
                });
            }
            return list;
        }

        public async Task<ExamGenerateSeatsRes> GenerateSeats(ExamGenerateSeatsReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.examsessionid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session ID is required.");
            if (!ExamSeatingStrategies.All.Contains(req.strategy ?? ""))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Invalid seating strategy.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                await LockSessionTransaction(db, orgId, req.examsessionid);

                var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
                {
                    organizationid = orgId,
                    id = req.examsessionid,
                });
                var session = sessions.FirstOrDefault()
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");
                ExamSessionEditGuard.EnsureRoomOrSeatingEditAllowed(session.status, req.allowcorrection, req.reason);

                var sessionRooms = await examSessionRoomService.SelectTransaction(db, orgId, req.examsessionid);
                if (sessionRooms.Count == 0)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Assign rooms to this session before generating seats.");

                var students = await LoadEligibleEnrollmentsTransaction(db, orgId, session);
                var totalStudents = students.Count;
                var totalCapacity = sessionRooms.Sum(r => r.allocatedcapacity);
                var existing = await SelectTransaction(db, orgId, req.examsessionid);

                if (totalCapacity < totalStudents)
                {
                    await db.RollbackTransaction();
                    return new ExamGenerateSeatsRes
                    {
                        totalstudents = totalStudents,
                        allocatedstudents = existing.Count,
                        unallocatedstudents = totalStudents - existing.Count,
                        errors = new List<string>
                        {
                            $"Insufficient room capacity ({totalCapacity}) for {totalStudents} students. Add rooms or capacity before seating.",
                        },
                    };
                }

                var preserved = existing.Where(a =>
                    req.preservemanual && (a.islocked || string.Equals(a.allocationsource, ExamSeatAllocationSources.Manual, StringComparison.OrdinalIgnoreCase))).ToList();

                if (req.forcereplaceauto)
                {
                    if (string.IsNullOrWhiteSpace(req.reason))
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Reason is required to replace auto seating.");
                    await DeleteAutoSeatsTransaction(db, orgId, req.examsessionid);
                    preserved = preserved.Where(p => p.islocked || string.Equals(p.allocationsource, ExamSeatAllocationSources.Manual, StringComparison.OrdinalIgnoreCase)).ToList();
                }

                var assignedEnrollmentIds = preserved.Select(p => p.studentenrollmentid).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var usedLabelsByRoom = preserved
                    .GroupBy(p => p.examroomid, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Select(x => x.seatlabel).ToHashSet(StringComparer.OrdinalIgnoreCase), StringComparer.OrdinalIgnoreCase);

                var seatsPerRoom = preserved
                    .GroupBy(p => p.examroomid, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

                var unassigned = students
                    .Where(s => !assignedEnrollmentIds.Contains(s.enrollmentId))
                    .ToList();

                unassigned = SortStudents(unassigned, req.strategy);

                var actor = ResolveActor();
                var now = DateTime.UtcNow;
                var allocatedNew = 0;

                foreach (var room in sessionRooms.OrderBy(r => r.roomname, StringComparer.OrdinalIgnoreCase))
                {
                    seatsPerRoom.TryGetValue(room.examroomid, out var usedInRoom);
                    if (!usedLabelsByRoom.TryGetValue(room.examroomid, out var usedLabels))
                        usedLabels = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                    var roomMeta = (await examRoomService.SelectTransaction(db, new ExamRoomSelectReq
                    {
                        organizationid = orgId,
                        id = room.examroomid,
                        includeinactive = true,
                    })).FirstOrDefault();
                    var labelList = ExamSeatingRules.GenerateSeatLabels(
                        room.allocatedcapacity,
                        roomMeta?.rowscount,
                        roomMeta?.columnscount).ToList();
                    var labelIndex = 0;

                    while (usedInRoom < room.allocatedcapacity && unassigned.Count > 0 && labelIndex < labelList.Count)
                    {
                        var label = labelList[labelIndex++];
                        if (usedLabels.Contains(label))
                            continue;

                        var student = unassigned[0];
                        unassigned.RemoveAt(0);
                        await InsertSeatTransaction(db, orgId, req.examsessionid, room.examroomid, student.enrollmentId,
                            label, ExamSeatAllocationSources.Auto, false, actor, now);
                        usedLabels.Add(label);
                        usedInRoom++;
                        allocatedNew++;
                    }
                }

                var finalCount = preserved.Count + allocatedNew;
                await examAuditService.AppendAsync(db, orgId, "exam_seating", req.examsessionid, "GenerateSeats",
                    req.reason, after: new { req.strategy, totalStudents, finalCount, unassigned = unassigned.Count });

                await db.CommitTransaction();

                return new ExamGenerateSeatsRes
                {
                    totalstudents = totalStudents,
                    allocatedstudents = finalCount,
                    unallocatedstudents = unassigned.Count,
                };
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        public async Task<ExamSeatAllocation> AssignSeat(ExamAssignSeatReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.seatlabel))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Seat label is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                await LockSessionTransaction(db, orgId, req.examsessionid);

                var sessions = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
                {
                    organizationid = orgId,
                    id = req.examsessionid,
                });
                var session = sessions.FirstOrDefault()
                    ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");
                ExamSessionEditGuard.EnsureRoomOrSeatingEditAllowed(session.status, req.allowcorrection, req.reason);

                await EnsureEnrollmentOnSessionTransaction(db, orgId, session, req.studentenrollmentid);
                await EnsureRoomOnSessionTransaction(db, orgId, req.examsessionid, req.examroomid);

                var existingForSeat = await FindSeatByLabelTransaction(db, orgId, req.examsessionid, req.examroomid, req.seatlabel);
                if (existingForSeat != null
                    && !string.Equals(existingForSeat.studentenrollmentid, req.studentenrollmentid, StringComparison.OrdinalIgnoreCase))
                {
                    if (!req.replaceexisting)
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Seat is already assigned. Enable replace to swap.");
                    }
                    if (existingForSeat.islocked && !req.allowcorrection)
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Cannot replace a locked seat without correction authorization.");
                    }
                    await DeleteSeatByIdTransaction(db, orgId, existingForSeat.id);
                }

                var existingForStudent = await FindSeatByEnrollmentTransaction(db, orgId, req.examsessionid, req.studentenrollmentid);
                if (existingForStudent != null)
                {
                    if (existingForStudent.islocked && !req.replaceexisting && !req.allowcorrection)
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Student already has a locked seat.");
                    await DeleteSeatByIdTransaction(db, orgId, existingForStudent.id);
                }

                var actor = ResolveActor();
                var now = DateTime.UtcNow;
                var id = Guid.NewGuid().ToString();
                await InsertSeatTransaction(db, orgId, req.examsessionid, req.examroomid, req.studentenrollmentid,
                    req.seatlabel.Trim(), ExamSeatAllocationSources.Manual, req.islocked, actor, now);

                await examAuditService.AppendAsync(db, orgId, "exam_seating", req.examsessionid, "AssignSeat",
                    req.reason, after: new { req.studentenrollmentid, req.examroomid, req.seatlabel });

                await db.CommitTransaction();
                var rows = await SelectTransaction(db, orgId, req.examsessionid);
                return rows.First(r => string.Equals(r.studentenrollmentid, req.studentenrollmentid, StringComparison.OrdinalIgnoreCase));
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        private static List<EligibleStudent> SortStudents(List<EligibleStudent> list, string strategy)
        {
            if (string.Equals(strategy, ExamSeatingStrategies.AdmissionNumber, StringComparison.OrdinalIgnoreCase))
            {
                return list.OrderBy(s => s.admissionNumber, StringComparer.OrdinalIgnoreCase).ToList();
            }
            return list
                .OrderBy(s => s.rollNumber, Comparer<int?>.Create(ExamSeatingRules.CompareRollNumber))
                .ThenBy(s => s.admissionNumber, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private async Task<List<EligibleStudent>> LoadEligibleEnrollmentsTransaction(IDb db, string orgId, ExamSession session)
        {
            var classIds = session.classids.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var map = new Dictionary<string, EligibleStudent>(StringComparer.OrdinalIgnoreCase);
            foreach (var classId in classIds)
            {
                const string query = @"
                    SELECT e.id AS enrollment_id, e.roll_number, s.student_id AS admission_number
                    FROM student_enrollments e
                    INNER JOIN students s ON s.id = e.student_id AND s.organization_id = e.organization_id AND s.is_active = true
                    WHERE e.organization_id = @organization_id AND e.class_id = @class_id
                      AND e.is_active = true AND e.is_current = true";
                var cmd = db.GetCommand(query);
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = classId;
                using var reader = await db.Execute(cmd);
                while (await reader.ReadAsync())
                {
                    var enrollmentId = reader["enrollment_id"]?.ToString() ?? "";
                    if (string.IsNullOrWhiteSpace(enrollmentId))
                        continue;
                    map[enrollmentId] = new EligibleStudent
                    {
                        enrollmentId = enrollmentId,
                        rollNumber = reader["roll_number"] == DBNull.Value ? null : Convert.ToInt32(reader["roll_number"]),
                        admissionNumber = reader["admission_number"]?.ToString() ?? "",
                    };
                }
            }
            return map.Values.ToList();
        }

        private async Task EnsureEnrollmentOnSessionTransaction(IDb db, string orgId, ExamSession session, string enrollmentId)
        {
            var eligible = await LoadEligibleEnrollmentsTransaction(db, orgId, session);
            if (!eligible.Any(e => string.Equals(e.enrollmentId, enrollmentId, StringComparison.OrdinalIgnoreCase)))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Student enrollment is not attached to this exam session.");
            }
        }

        private async Task EnsureRoomOnSessionTransaction(IDb db, string orgId, string sessionId, string roomId)
        {
            var rooms = await examSessionRoomService.SelectTransaction(db, orgId, sessionId);
            if (!rooms.Any(r => string.Equals(r.examroomid, roomId, StringComparison.OrdinalIgnoreCase)))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Room is not allocated to this session.");
        }

        private async Task LockSessionTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                SELECT id FROM exam_sessions
                WHERE organization_id = @organization_id AND id = @id
                FOR UPDATE";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = sessionId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");
        }

        private async Task DeleteAutoSeatsTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                DELETE FROM exam_seat_allocations
                WHERE organization_id = @organization_id AND exam_session_id = @exam_session_id
                  AND allocation_source = @auto AND is_locked = false";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            db.AddParameter(cmd, "auto", DbTypes.Types.String).Value = ExamSeatAllocationSources.Auto;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task InsertSeatTransaction(
            IDb db, string orgId, string sessionId, string roomId, string enrollmentId,
            string seatLabel, string source, bool isLocked, string actor, DateTime now)
        {
            const string query = @"
                INSERT INTO exam_seat_allocations (
                    id, organization_id, exam_session_id, exam_room_id, student_enrollment_id,
                    seat_label, allocation_source, is_locked, allocated_by, allocated_at
                ) VALUES (
                    @id, @organization_id, @exam_session_id, @exam_room_id, @student_enrollment_id,
                    @seat_label, @allocation_source, @is_locked, @allocated_by, @allocated_at
                )";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            db.AddParameter(cmd, "exam_room_id", DbTypes.Types.String).Value = roomId;
            db.AddParameter(cmd, "student_enrollment_id", DbTypes.Types.String).Value = enrollmentId;
            db.AddParameter(cmd, "seat_label", DbTypes.Types.String).Value = seatLabel;
            db.AddParameter(cmd, "allocation_source", DbTypes.Types.String).Value = source;
            db.AddParameter(cmd, "is_locked", DbTypes.Types.Boolean).Value = isLocked;
            db.AddParameter(cmd, "allocated_by", DbTypes.Types.String).Value = actor;
            db.AddParameter(cmd, "allocated_at", DbTypes.Types.DateTime).Value = now;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task<ExamSeatAllocation?> FindSeatByLabelTransaction(IDb db, string orgId, string sessionId, string roomId, string label)
        {
            var all = await SelectTransaction(db, orgId, sessionId);
            return all.FirstOrDefault(a =>
                string.Equals(a.examroomid, roomId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(a.seatlabel, label.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        private async Task<ExamSeatAllocation?> FindSeatByEnrollmentTransaction(IDb db, string orgId, string sessionId, string enrollmentId)
        {
            var all = await SelectTransaction(db, orgId, sessionId);
            return all.FirstOrDefault(a => string.Equals(a.studentenrollmentid, enrollmentId, StringComparison.OrdinalIgnoreCase));
        }

        private async Task DeleteSeatByIdTransaction(IDb db, string orgId, string seatId)
        {
            const string query = @"
                DELETE FROM exam_seat_allocations
                WHERE organization_id = @organization_id AND id = @id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = seatId;
            await db.ExecuteNonQuery(cmd);
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }

        private sealed class EligibleStudent
        {
            public string enrollmentId { get; set; } = "";
            public int? rollNumber { get; set; }
            public string admissionNumber { get; set; } = "";
        }
    }
}
