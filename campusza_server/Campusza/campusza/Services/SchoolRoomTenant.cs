using Campusza.Models;
using Campusza.Utils;
using Npgsql;

namespace Campusza.Services.Campusza
{
    /// <summary>Shared school room validation and tenant checks (classes, timetable, exams).</summary>
    public static class SchoolRoomTenant
    {
        public static void ValidateGridDimensions(int capacity, int? rowsCount, int? columnsCount)
        {
            if (capacity <= 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Capacity must be positive.");

            rowsCount = NullIfNonPositive(rowsCount);
            columnsCount = NullIfNonPositive(columnsCount);

            var hasRows = rowsCount.HasValue;
            var hasCols = columnsCount.HasValue;
            if (hasRows != hasCols)
            {
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    "Row and column counts must both be set or both omitted.");
            }

            if (hasRows && hasCols)
            {
                var gridSeats = rowsCount!.Value * columnsCount!.Value;
                if (gridSeats > capacity)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "Seating grid (rows × columns) cannot exceed room capacity.");
                }
            }
        }

        private static int? NullIfNonPositive(int? value) =>
            value is > 0 ? value : null;

        /// <summary>Resolves a room id, legacy reference id, or name to the canonical school_rooms.id for the org.</summary>
        public static async Task<string?> ResolveRoomIdTransaction(
            IDb db,
            string orgId,
            string? roomReference,
            bool required = false)
        {
            if (string.IsNullOrWhiteSpace(roomReference))
            {
                if (required)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Room is required.");
                return null;
            }

            var raw = roomReference.Trim();
            var byId = await LoadRoomRowTransaction(db, "id = @match", raw);
            if (byId != null)
            {
                EnsureRoomUsable(orgId, byId);
                return byId.Id;
            }

            var byLegacy = await LoadRoomRowTransaction(
                db,
                "organization_id = @organization_id AND (legacy_reference_id = @match OR LOWER(name) = LOWER(@match))",
                raw,
                orgId);
            if (byLegacy != null)
            {
                EnsureRoomUsable(orgId, byLegacy);
                return byLegacy.Id;
            }

            throw new AppException(AppException.ErrorCodes.BadRequest, "Room not found.");
        }

        /// <summary>One active class homeroom per physical room within an organization and academic year.</summary>
        public static async Task EnsureUniqueClassHomeroomTransaction(
            IDb db,
            string orgId,
            string classId,
            string roomId,
            string? academicYear = null)
        {
            if (string.IsNullOrWhiteSpace(orgId) || string.IsNullOrWhiteSpace(roomId))
                return;
            if (string.IsNullOrWhiteSpace(academicYear))
                return;

            var excludeId = classId ?? "";
            var year = academicYear.Trim();
            try
            {
                await EnsureUniqueClassHomeroomCoreTransaction(
                    db, orgId, excludeId, roomId, year, useSchoolRoomIdColumn: true);
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedColumn
                && ex.MessageText.Contains("school_room_id", StringComparison.OrdinalIgnoreCase))
            {
                await EnsureUniqueClassHomeroomCoreTransaction(
                    db, orgId, excludeId, roomId, year, useSchoolRoomIdColumn: false);
            }
        }

        private static async Task EnsureUniqueClassHomeroomCoreTransaction(
            IDb db,
            string orgId,
            string excludeClassId,
            string roomId,
            string academicYear,
            bool useSchoolRoomIdColumn)
        {
            var roomMatch = useSchoolRoomIdColumn
                ? "(school_room_id = @room_id OR room = @room_id)"
                : "room = @room_id";
            var query = $@"
                SELECT c.name AS class_name, COALESCE(sr.name, @room_id) AS room_name
                FROM classes c
                LEFT JOIN school_rooms sr ON sr.id = @room_id AND sr.organization_id = c.organization_id
                WHERE c.organization_id = @organization_id
                  AND c.is_active = true
                  AND c.id <> @class_id
                  AND TRIM(COALESCE(c.academic_year, '')) = TRIM(COALESCE(@academic_year, ''))
                  AND {roomMatch}
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "class_id", DbTypes.Types.String).Value = excludeClassId;
            db.AddParameter(cmd, "room_id", DbTypes.Types.String).Value = roomId;
            db.AddParameter(cmd, "academic_year", DbTypes.Types.String).Value = academicYear;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return;

            var otherClass = reader["class_name"]?.ToString() ?? "another class";
            var roomName = reader["room_name"]?.ToString() ?? roomId;
            throw new AppException(
                AppException.ErrorCodes.BadRequest,
                $"Room {roomName} is already assigned to {otherClass}. Each class must have a different homeroom.");
        }

        public static async Task EnsureNoStaffScheduleRoomConflictTransaction(
            IDb db,
            string orgId,
            string scheduleId,
            string day,
            TimeSpan startTime,
            TimeSpan endTime,
            string roomId)
        {
            if (string.IsNullOrWhiteSpace(roomId))
                return;

            const string query = @"
                SELECT id, class_name, subject
                FROM staff_schedules
                WHERE organization_id = @organization_id
                  AND is_active = true
                  AND day = @day
                  AND room = @room
                  AND id <> @id
                  AND start_time < @end_time
                  AND end_time > @start_time
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(cmd, "day", DbTypes.Types.String).Value = day ?? "";
            db.AddParameter(cmd, "room", DbTypes.Types.String).Value = roomId;
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = scheduleId ?? "";
            db.AddParameter(cmd, "end_time", DbTypes.Types.Time).Value = endTime;
            db.AddParameter(cmd, "start_time", DbTypes.Types.Time).Value = startTime;
            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                var subject = reader["subject"]?.ToString() ?? "another class";
                throw new AppException(AppException.ErrorCodes.BadRequest,
                    $"Room is already occupied at this time ({subject}).");
            }
        }

        private static void EnsureRoomUsable(string orgId, RoomRow row)
        {
            ExamTenantGuard.EnsureSameOrganization(orgId, row.OrganizationId, "Room");
            if (!row.IsActive)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Room is inactive.");
        }

        private static async Task<RoomRow?> LoadRoomRowTransaction(
            IDb db,
            string whereClause,
            string match,
            string? organizationId = null)
        {
            var query = $@"
                SELECT id, organization_id, is_active
                FROM school_rooms
                WHERE {whereClause}
                LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "match", DbTypes.Types.String).Value = match;
            if (organizationId != null)
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;
            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;
            return new RoomRow(
                reader["id"]?.ToString() ?? "",
                reader["organization_id"]?.ToString() ?? "",
                reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]));
        }

        private sealed record RoomRow(string Id, string OrganizationId, bool IsActive);
    }
}
