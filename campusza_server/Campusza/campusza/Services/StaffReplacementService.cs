using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class StaffReplacementService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        StaffScheduleService staffScheduleService;

        public StaffReplacementService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            StaffScheduleService staffScheduleService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.staffScheduleService = staffScheduleService;
        }

        public async Task<List<StaffReplacement>> Select(StaffReplacementSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<StaffReplacement>> SelectTransaction(IDb db, StaffReplacementSelectReq req)
        {
            List<StaffReplacement> result = new List<StaffReplacement>();
            string query = @"
                SELECT
                    id, schedule_id, original_teacher_id, original_teacher_name,
                    replacement_teacher_id, replacement_teacher_name,
                    subject_id, subject,
                    date, reason,
                    assigned_by, assigned_date, status, organization_id, is_active
                FROM staff_replacements
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.scheduleid))
                queryBuilder.AddParameter("schedule_id", "=", "schedule_id", req.scheduleid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.status))
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);

            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "assigned_date");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    StaffReplacement temp = new StaffReplacement();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.scheduleid = reader["schedule_id"] == DBNull.Value ? "" : reader["schedule_id"].ToString();
                    temp.originalteacherid = reader["original_teacher_id"] == DBNull.Value ? "" : reader["original_teacher_id"].ToString();
                    temp.originalteachername = reader["original_teacher_name"] == DBNull.Value ? "" : reader["original_teacher_name"].ToString();
                    temp.replacementteacherid = reader["replacement_teacher_id"] == DBNull.Value ? "" : reader["replacement_teacher_id"].ToString();
                    temp.replacementteachername = reader["replacement_teacher_name"] == DBNull.Value ? "" : reader["replacement_teacher_name"].ToString();
                    temp.subjectid = reader["subject_id"] == DBNull.Value ? "" : reader["subject_id"].ToString();
                    temp.subject = reader["subject"] == DBNull.Value ? "" : reader["subject"].ToString();
                    temp.date = reader["date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["date"]);
                    temp.reason = reader["reason"] == DBNull.Value ? "" : reader["reason"].ToString();
                    temp.assignedby = reader["assigned_by"] == DBNull.Value ? "" : reader["assigned_by"].ToString();
                    temp.assigneddate = reader["assigned_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["assigned_date"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]);
                    result.Add(temp);
                }
            }

            return result;
        }

        public async Task<StaffReplacement> Insert(StaffReplacement replacement)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, replacement);
            }
            return replacement;
        }

        public async Task InsertTransaction(IDb db, StaffReplacement replacement)
        {
            if (string.IsNullOrWhiteSpace(replacement.organizationid) && requeststate.usercontext?.organisationid > 0)
                replacement.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(replacement.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            await ValidateReplacementNoTimeConflict(db, replacement);

            replacement.id = string.IsNullOrWhiteSpace(replacement.id) ? Guid.NewGuid().ToString() : replacement.id;
            replacement.status = string.IsNullOrWhiteSpace(replacement.status) ? "active" : replacement.status;
            replacement.assignedby = string.IsNullOrWhiteSpace(replacement.assignedby) ? ResolveActor() : replacement.assignedby;
            replacement.assigneddate = replacement.assigneddate == default ? DateTime.UtcNow.Date : replacement.assigneddate;
            replacement.isactive = true;

            string query = @"
                INSERT INTO staff_replacements (
                    id, schedule_id, original_teacher_id, original_teacher_name,
                    replacement_teacher_id, replacement_teacher_name,
                    subject_id, subject,
                    date, reason,
                    assigned_by, assigned_date, status, organization_id, is_active
                )
                VALUES (
                    @id, @schedule_id, @original_teacher_id, @original_teacher_name,
                    @replacement_teacher_id, @replacement_teacher_name,
                    @subject_id, @subject,
                    @date, @reason,
                    @assigned_by, @assigned_date, @status, @organization_id, @is_active
                );
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = replacement.id;
            db.AddParameter(command, "schedule_id", DbTypes.Types.String).Value = replacement.scheduleid ?? "";
            db.AddParameter(command, "original_teacher_id", DbTypes.Types.String).Value = replacement.originalteacherid ?? "";
            db.AddParameter(command, "original_teacher_name", DbTypes.Types.String).Value = replacement.originalteachername ?? "";
            db.AddParameter(command, "replacement_teacher_id", DbTypes.Types.String).Value = replacement.replacementteacherid ?? "";
            db.AddParameter(command, "replacement_teacher_name", DbTypes.Types.String).Value = replacement.replacementteachername ?? "";
            db.AddParameter(command, "subject_id", DbTypes.Types.String).Value = replacement.subjectid ?? "";
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = replacement.subject ?? "";
            db.AddParameter(command, "date", DbTypes.Types.Date).Value = replacement.date.Date;
            db.AddParameter(command, "reason", DbTypes.Types.String).Value = replacement.reason ?? "";
            db.AddParameter(command, "assigned_by", DbTypes.Types.String).Value = replacement.assignedby ?? "";
            db.AddParameter(command, "assigned_date", DbTypes.Types.Date).Value = replacement.assigneddate.Date;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = replacement.status ?? "active";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = replacement.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = replacement.isactive;

            await db.ExecuteNonQuery(command);
        }

        public async Task<StaffReplacement> Update(StaffReplacement replacement)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, replacement);
            }
            return replacement;
        }

        public async Task<bool> UpdateTransaction(IDb db, StaffReplacement replacement)
        {
            if (string.IsNullOrWhiteSpace(replacement.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Replacement id is required.");
            if (string.IsNullOrWhiteSpace(replacement.organizationid) && requeststate.usercontext?.organisationid > 0)
                replacement.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(replacement.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            await ValidateReplacementNoTimeConflict(db, replacement);

            string query = @"
                UPDATE staff_replacements
                SET
                    schedule_id = @schedule_id,
                    original_teacher_id = @original_teacher_id,
                    original_teacher_name = @original_teacher_name,
                    replacement_teacher_id = @replacement_teacher_id,
                    replacement_teacher_name = @replacement_teacher_name,
                    subject_id = @subject_id,
                    subject = @subject,
                    date = @date,
                    reason = @reason,
                    assigned_by = @assigned_by,
                    assigned_date = @assigned_date,
                    status = @status,
                    organization_id = @organization_id
                WHERE id = @id AND is_active = true
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = replacement.id ?? "";
            db.AddParameter(command, "schedule_id", DbTypes.Types.String).Value = replacement.scheduleid ?? "";
            db.AddParameter(command, "original_teacher_id", DbTypes.Types.String).Value = replacement.originalteacherid ?? "";
            db.AddParameter(command, "original_teacher_name", DbTypes.Types.String).Value = replacement.originalteachername ?? "";
            db.AddParameter(command, "replacement_teacher_id", DbTypes.Types.String).Value = replacement.replacementteacherid ?? "";
            db.AddParameter(command, "replacement_teacher_name", DbTypes.Types.String).Value = replacement.replacementteachername ?? "";
            db.AddParameter(command, "subject_id", DbTypes.Types.String).Value = replacement.subjectid ?? "";
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = replacement.subject ?? "";
            db.AddParameter(command, "date", DbTypes.Types.Date).Value = replacement.date.Date;
            db.AddParameter(command, "reason", DbTypes.Types.String).Value = replacement.reason ?? "";
            db.AddParameter(command, "assigned_by", DbTypes.Types.String).Value = replacement.assignedby ?? "";
            db.AddParameter(command, "assigned_date", DbTypes.Types.Date).Value = replacement.assigneddate.Date;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = replacement.status ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = replacement.organizationid ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<bool> Delete(StaffReplacementDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await DeleteTransaction(db, req);
            }
        }

        public async Task<bool> DeleteTransaction(IDb db, StaffReplacementDeleteReq req)
        {
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Replacement id is required.");

            string query = @"
                UPDATE staff_replacements
                SET is_active = false
                WHERE id = @id AND is_active = true
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }

        private async Task ValidateReplacementNoTimeConflict(IDb db, StaffReplacement replacement)
        {
            if (string.IsNullOrWhiteSpace(replacement.replacementteacherid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Replacement teacher is required.");
            if (string.IsNullOrWhiteSpace(replacement.scheduleid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Schedule is required.");
            if (replacement.date == DateTime.MinValue)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Replacement date is required.");
            if (replacement.date.Date < DateTime.Today)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Replacements cannot be assigned for previous days.");

            var orgId = replacement.organizationid ?? "";
            var targetSchedules = await staffScheduleService.SelectTransaction(db, new StaffScheduleSelectReq
            {
                id = replacement.scheduleid,
                organizationid = orgId,
            });
            var target = targetSchedules.FirstOrDefault();
            if (target == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Schedule slot not found.");

            var slotDay = NormalizeWeekday(target.day);
            var dateDay = NormalizeWeekday(replacement.date.ToString("dddd", CultureInfo.InvariantCulture));
            if (!string.IsNullOrWhiteSpace(slotDay) &&
                !string.IsNullOrWhiteSpace(dateDay) &&
                !string.Equals(slotDay, dateDay, StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(
                    AppException.ErrorCodes.BadRequest,
                    $"Replacement date must fall on {slotDay} for this period.");
            }

            var teacherName = string.IsNullOrWhiteSpace(replacement.replacementteachername)
                ? "This teacher"
                : replacement.replacementteachername.Trim();
            var repTeacherId = replacement.replacementteacherid.Trim();

            var teacherSchedules = await staffScheduleService.SelectTransaction(db, new StaffScheduleSelectReq
            {
                staffid = repTeacherId,
                organizationid = orgId,
            });

            foreach (var sched in teacherSchedules)
            {
                if (!string.Equals(NormalizeWeekday(sched.day), slotDay, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (string.Equals(sched.id, target.id, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (!TimesOverlap(sched.starttime, sched.endtime, target.starttime, target.endtime))
                    continue;

                var label = $"{sched.subject} ({sched.classname})".Trim();
                throw new AppException(
                    AppException.ErrorCodes.BadRequest,
                    $"{teacherName} already has a class at this time: {label}. One person cannot teach two classes at once.");
            }

            var existingReplacements = await SelectTransaction(db, new StaffReplacementSelectReq
            {
                organizationid = orgId,
            });

            foreach (var other in existingReplacements)
            {
                if (!other.isactive ||
                    !string.Equals(other.status, "active", StringComparison.OrdinalIgnoreCase))
                    continue;
                if (!DatesEqual(other.date, replacement.date))
                    continue;
                if (!string.Equals(other.replacementteacherid, repTeacherId, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (string.Equals(other.id, replacement.id, StringComparison.OrdinalIgnoreCase))
                    continue;

                var otherSchedules = await staffScheduleService.SelectTransaction(db, new StaffScheduleSelectReq
                {
                    id = other.scheduleid ?? "",
                    organizationid = orgId,
                });
                var otherSlot = otherSchedules.FirstOrDefault();
                if (otherSlot == null)
                    continue;
                if (!TimesOverlap(otherSlot.starttime, otherSlot.endtime, target.starttime, target.endtime))
                    continue;

                throw new AppException(
                    AppException.ErrorCodes.BadRequest,
                    $"{teacherName} is already assigned as substitute for another class at this time.");
            }
        }

        private static bool TimesOverlap(TimeSpan startA, TimeSpan endA, TimeSpan startB, TimeSpan endB)
        {
            if (endA <= startA) endA = startA.Add(TimeSpan.FromMinutes(1));
            if (endB <= startB) endB = startB.Add(TimeSpan.FromMinutes(1));
            return startA < endB && startB < endA;
        }

        private static bool DatesEqual(DateTime left, DateTime right)
        {
            return left.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ==
                   right.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
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
    }
}
