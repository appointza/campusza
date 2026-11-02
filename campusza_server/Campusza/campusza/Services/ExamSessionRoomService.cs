using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamSessionRoomService
    {
        private readonly IDbProvider dbprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly ExamSessionService examSessionService;
        private readonly ExamRoomService examRoomService;
        private readonly ExamAuditService examAuditService;
        private readonly RequestState requeststate;

        public ExamSessionRoomService(
            IDbProvider dbprovider,
            OrganizationIdResolver organizationIdResolver,
            ExamSessionService examSessionService,
            ExamRoomService examRoomService,
            ExamAuditService examAuditService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.examSessionService = examSessionService;
            this.examRoomService = examRoomService;
            this.examAuditService = examAuditService;
            this.requeststate = requeststate;
        }

        public async Task<List<ExamSessionRoom>> Select(ExamSessionRoomSelectReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, "");
            if (string.IsNullOrWhiteSpace(req.examsessionid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session ID is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await SelectTransaction(db, orgId, req.examsessionid);
        }

        public async Task<List<ExamSessionRoom>> SelectTransaction(IDb db, string orgId, string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                return new List<ExamSessionRoom>();

            const string query = @"
                SELECT esr.id, esr.organization_id, esr.exam_session_id, esr.exam_room_id, esr.allocated_capacity, esr.created_at,
                       er.name AS room_name, er.capacity AS room_capacity
                FROM exam_session_rooms esr
                INNER JOIN school_rooms er ON er.id = esr.exam_room_id AND er.organization_id = esr.organization_id
                WHERE esr.organization_id = @organization_id AND esr.exam_session_id = @exam_session_id
                ORDER BY er.name";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            var list = new List<ExamSessionRoom>();
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                list.Add(new ExamSessionRoom
                {
                    id = reader["id"]?.ToString() ?? "",
                    organizationid = reader["organization_id"]?.ToString() ?? "",
                    examsessionid = reader["exam_session_id"]?.ToString() ?? "",
                    examroomid = reader["exam_room_id"]?.ToString() ?? "",
                    allocatedcapacity = reader["allocated_capacity"] == DBNull.Value ? 0 : Convert.ToInt32(reader["allocated_capacity"]),
                    roomname = reader["room_name"]?.ToString() ?? "",
                    roomcapacity = reader["room_capacity"] == DBNull.Value ? 0 : Convert.ToInt32(reader["room_capacity"]),
                    createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                });
            }
            return list;
        }

        public async Task<List<ExamSessionRoom>> Save(ExamSessionRoomSaveReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email ?? "");
            if (string.IsNullOrWhiteSpace(req.examsessionid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session ID is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await db.BeginTransaction();
            try
            {
                var session = await LoadSessionTransaction(db, orgId, req.examsessionid);
                ExamSessionEditGuard.EnsureRoomOrSeatingEditAllowed(session.status, req.allowcorrection, req.reason);

                var items = req.rooms ?? new List<ExamSessionRoomAllocationItem>();
                if (items.Count == 0)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "At least one room allocation is required.");

                var distinctRooms = items
                    .Where(r => !string.IsNullOrWhiteSpace(r.examroomid))
                    .GroupBy(r => r.examroomid.Trim(), StringComparer.OrdinalIgnoreCase)
                    .Select(g => g.First())
                    .ToList();

                foreach (var item in distinctRooms)
                {
                    if (item.allocatedcapacity <= 0)
                        throw new AppException(AppException.ErrorCodes.BadRequest, "Allocated capacity must be positive.");

                    var rooms = await examRoomService.SelectTransaction(db, new ExamRoomSelectReq
                    {
                        organizationid = orgId,
                        id = item.examroomid,
                        includeinactive = true,
                    });
                    var room = rooms.FirstOrDefault()
                        ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Room not found.");
                    ExamTenantGuard.EnsureSameOrganization(orgId, room.organizationid, "Room");
                    if (!room.isactive)
                        throw new AppException(AppException.ErrorCodes.BadRequest, $"Room {room.name} is inactive.");
                    if (item.allocatedcapacity > room.capacity)
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest,
                            $"Allocated capacity for {room.name} exceeds room capacity ({room.capacity}).");
                    }

                    await EnsureRoomNotDoubleBookedTransaction(db, orgId, session, item.examroomid, req.examsessionid);
                }

                var existingSeats = await CountSeatsByRoomTransaction(db, orgId, req.examsessionid);
                foreach (var item in distinctRooms)
                {
                    if (existingSeats.TryGetValue(item.examroomid, out var seated) && item.allocatedcapacity < seated)
                    {
                        throw new AppException(AppException.ErrorCodes.BadRequest,
                            "Cannot reduce allocated capacity below existing seat assignments. Use seating correction with reason.");
                    }
                }

                await DeleteSessionRoomsTransaction(db, orgId, req.examsessionid);
                foreach (var item in distinctRooms)
                {
                    await InsertSessionRoomTransaction(db, orgId, req.examsessionid, item.examroomid, item.allocatedcapacity);
                }

                await examAuditService.AppendAsync(db, orgId, "exam_session_rooms", req.examsessionid, "Save",
                    req.reason, after: new { roomCount = distinctRooms.Count });
                await db.CommitTransaction();
                return await SelectTransaction(db, orgId, req.examsessionid);
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }
        }

        private async Task EnsureRoomNotDoubleBookedTransaction(
            IDb db, string orgId, ExamSession session, string roomId, string currentSessionId)
        {
            const string query = @"
                SELECT es.id, es.start_time, es.end_time
                FROM exam_session_rooms esr
                INNER JOIN exam_sessions es ON es.id = esr.exam_session_id AND es.organization_id = esr.organization_id
                WHERE esr.organization_id = @organization_id
                  AND esr.exam_room_id = @exam_room_id
                  AND esr.exam_session_id <> @exam_session_id
                  AND es.exam_date = @exam_date
                  AND es.status <> @cancelled";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_room_id", DbTypes.Types.String).Value = roomId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = currentSessionId;
            db.AddParameter(cmd, "exam_date", DbTypes.Types.Date).Value = session.examdate.Date;
            db.AddParameter(cmd, "cancelled", DbTypes.Types.String).Value = ExamSessionStatuses.Cancelled;

            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                var otherStart = (TimeSpan)reader["start_time"];
                var otherEnd = (TimeSpan)reader["end_time"];
                if (ExamOverlapRules.TimeRangesOverlap(session.starttime, session.endtime, otherStart, otherEnd))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "This room is already assigned to another exam session at an overlapping time on the same date.");
                }
            }
        }

        private async Task<ExamSession> LoadSessionTransaction(IDb db, string orgId, string sessionId)
        {
            var rows = await examSessionService.SelectTransaction(db, new ExamSessionSelectReq
            {
                organizationid = orgId,
                id = sessionId,
            });
            return rows.FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Exam session not found.");
        }

        private async Task DeleteSessionRoomsTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                DELETE FROM exam_session_rooms
                WHERE organization_id = @organization_id AND exam_session_id = @exam_session_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task InsertSessionRoomTransaction(IDb db, string orgId, string sessionId, string roomId, int capacity)
        {
            const string query = @"
                INSERT INTO exam_session_rooms (id, organization_id, exam_session_id, exam_room_id, allocated_capacity, created_at)
                VALUES (@id, @organization_id, @exam_session_id, @exam_room_id, @allocated_capacity, @created_at)";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = Guid.NewGuid().ToString();
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            db.AddParameter(cmd, "exam_room_id", DbTypes.Types.String).Value = roomId;
            db.AddParameter(cmd, "allocated_capacity", DbTypes.Types.Integer).Value = capacity;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(cmd);
        }

        private async Task<Dictionary<string, int>> CountSeatsByRoomTransaction(IDb db, string orgId, string sessionId)
        {
            const string query = @"
                SELECT exam_room_id, COUNT(*) AS cnt
                FROM exam_seat_allocations
                WHERE organization_id = @organization_id AND exam_session_id = @exam_session_id
                GROUP BY exam_room_id";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "exam_session_id", DbTypes.Types.String).Value = sessionId;
            var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            using var reader = await db.Execute(cmd);
            while (await reader.ReadAsync())
            {
                map[reader["exam_room_id"]?.ToString() ?? ""] = Convert.ToInt32(reader["cnt"]);
            }
            return map;
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }
    }

    public static class ExamSessionEditGuard
    {
        private static readonly HashSet<string> LockedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            ExamSessionStatuses.Published,
            ExamSessionStatuses.InProgress,
            ExamSessionStatuses.Completed,
        };

        public static void EnsureRoomOrSeatingEditAllowed(string sessionStatus, bool allowCorrection, string? reason)
        {
            if (!LockedStatuses.Contains(sessionStatus ?? ""))
                return;
            if (!allowCorrection)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Published or in-progress sessions require seating correction authorization to change rooms or seats.");
            }
            if (string.IsNullOrWhiteSpace(reason))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Correction reason is required.");
            }
        }
    }
}
