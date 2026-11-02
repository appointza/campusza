using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class StaffScheduleService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public StaffScheduleService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<StaffSchedule>> Select(StaffScheduleSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<StaffSchedule>> SelectTransaction(IDb db, StaffScheduleSelectReq req)
        {
            List<StaffSchedule> result = new List<StaffSchedule>();
            string query = @"
                SELECT 
                    id, staff_id, staff_name, day, start_time, end_time, subject, subject_id,
                    class_id, class_name, room, is_replacement, original_teacher_id, original_teacher_name,
                    replacement_teacher_id, replacement_teacher_name, organization_id, is_active
                FROM staff_schedules
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.staffid))
                queryBuilder.AddParameter("staff_id", "=", "staff_id", req.staffid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.classid))
                queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.day))
                queryBuilder.AddParameter("day", "=", "day", req.day, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);

            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "day");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    StaffSchedule temp = new StaffSchedule();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.staffid = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.staffname = reader["staff_name"] == DBNull.Value ? "" : reader["staff_name"].ToString();
                    temp.day = reader["day"] == DBNull.Value ? "" : reader["day"].ToString();
                    temp.starttime = reader["start_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["start_time"];
                    temp.endtime = reader["end_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["end_time"];
                    temp.subject = reader["subject"] == DBNull.Value ? "" : reader["subject"].ToString();
                    temp.subjectid = reader["subject_id"] == DBNull.Value ? "" : reader["subject_id"].ToString();
                    temp.classid = reader["class_id"] == DBNull.Value ? "" : reader["class_id"].ToString();
                    temp.classname = reader["class_name"] == DBNull.Value ? "" : reader["class_name"].ToString();
                    temp.room = reader["room"] == DBNull.Value ? "" : reader["room"].ToString();
                    temp.isreplacement = reader["is_replacement"] != DBNull.Value && Convert.ToBoolean(reader["is_replacement"]);
                    temp.originalteacherid = reader["original_teacher_id"] == DBNull.Value ? "" : reader["original_teacher_id"].ToString();
                    temp.originalteachername = reader["original_teacher_name"] == DBNull.Value ? "" : reader["original_teacher_name"].ToString();
                    temp.replacementteacherid = reader["replacement_teacher_id"] == DBNull.Value ? "" : reader["replacement_teacher_id"].ToString();
                    temp.replacementteachername = reader["replacement_teacher_name"] == DBNull.Value ? "" : reader["replacement_teacher_name"].ToString();
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]);
                    result.Add(temp);
                }
            }

            return result;
        }

        public async Task<StaffSchedule> Insert(StaffSchedule schedule)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, schedule);
            }
            return schedule;
        }

        public async Task InsertTransaction(IDb db, StaffSchedule schedule)
        {
            if (string.IsNullOrWhiteSpace(schedule.organizationid) && requeststate.usercontext?.organisationid > 0)
                schedule.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(schedule.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(schedule.staffid) || string.IsNullOrWhiteSpace(schedule.classid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Staff and class are required.");

            schedule.id = string.IsNullOrWhiteSpace(schedule.id) ? Guid.NewGuid().ToString() : schedule.id;
            schedule.isactive = true;
            schedule.isreplacement = schedule.isreplacement;

            await ApplyValidatedScheduleRoomTransaction(db, schedule);

            string query = @"
                INSERT INTO staff_schedules (
                    id, staff_id, staff_name, day, start_time, end_time, subject, subject_id,
                    class_id, class_name, room, is_replacement, original_teacher_id, original_teacher_name,
                    replacement_teacher_id, replacement_teacher_name, organization_id, is_active
                )
                VALUES (
                    @id, @staff_id, @staff_name, @day, @start_time, @end_time, @subject, @subject_id,
                    @class_id, @class_name, @room, @is_replacement, @original_teacher_id, @original_teacher_name,
                    @replacement_teacher_id, @replacement_teacher_name, @organization_id, @is_active
                );
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = schedule.id;
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = schedule.staffid ?? "";
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = schedule.staffname ?? "";
            db.AddParameter(command, "day", DbTypes.Types.String).Value = schedule.day ?? "";
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = schedule.starttime;
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = schedule.endtime;
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = schedule.subject ?? "";
            db.AddParameter(command, "subject_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(schedule.subjectid) ? DBNull.Value : schedule.subjectid;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = schedule.classid ?? "";
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = schedule.classname ?? "";
            db.AddParameter(command, "room", DbTypes.Types.String).Value = schedule.room ?? "";
            db.AddParameter(command, "is_replacement", DbTypes.Types.Boolean).Value = schedule.isreplacement;
            db.AddParameter(command, "original_teacher_id", DbTypes.Types.String).Value = schedule.originalteacherid ?? "";
            db.AddParameter(command, "original_teacher_name", DbTypes.Types.String).Value = schedule.originalteachername ?? "";
            db.AddParameter(command, "replacement_teacher_id", DbTypes.Types.String).Value = schedule.replacementteacherid ?? "";
            db.AddParameter(command, "replacement_teacher_name", DbTypes.Types.String).Value = schedule.replacementteachername ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = schedule.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = schedule.isactive;

            await db.ExecuteNonQuery(command);
        }

        public async Task<StaffSchedule> Update(StaffSchedule schedule)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, schedule);
            }
            return schedule;
        }

        public async Task<bool> UpdateTransaction(IDb db, StaffSchedule schedule)
        {
            if (string.IsNullOrWhiteSpace(schedule.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Schedule id is required.");
            if (string.IsNullOrWhiteSpace(schedule.organizationid) && requeststate.usercontext?.organisationid > 0)
                schedule.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(schedule.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            await ApplyValidatedScheduleRoomTransaction(db, schedule);

            string query = @"
                UPDATE staff_schedules
                SET
                    staff_id = @staff_id,
                    staff_name = @staff_name,
                    day = @day,
                    start_time = @start_time,
                    end_time = @end_time,
                    subject = @subject,
                    subject_id = @subject_id,
                    class_id = @class_id,
                    class_name = @class_name,
                    room = @room,
                    is_replacement = @is_replacement,
                    original_teacher_id = @original_teacher_id,
                    original_teacher_name = @original_teacher_name,
                    replacement_teacher_id = @replacement_teacher_id,
                    replacement_teacher_name = @replacement_teacher_name,
                    organization_id = @organization_id
                WHERE id = @id AND is_active = true
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = schedule.id ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = schedule.staffid ?? "";
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = schedule.staffname ?? "";
            db.AddParameter(command, "day", DbTypes.Types.String).Value = schedule.day ?? "";
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = schedule.starttime;
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = schedule.endtime;
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = schedule.subject ?? "";
            db.AddParameter(command, "subject_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(schedule.subjectid) ? DBNull.Value : schedule.subjectid;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = schedule.classid ?? "";
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = schedule.classname ?? "";
            db.AddParameter(command, "room", DbTypes.Types.String).Value = schedule.room ?? "";
            db.AddParameter(command, "is_replacement", DbTypes.Types.Boolean).Value = schedule.isreplacement;
            db.AddParameter(command, "original_teacher_id", DbTypes.Types.String).Value = schedule.originalteacherid ?? "";
            db.AddParameter(command, "original_teacher_name", DbTypes.Types.String).Value = schedule.originalteachername ?? "";
            db.AddParameter(command, "replacement_teacher_id", DbTypes.Types.String).Value = schedule.replacementteacherid ?? "";
            db.AddParameter(command, "replacement_teacher_name", DbTypes.Types.String).Value = schedule.replacementteachername ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = schedule.organizationid ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }

        private static async Task ApplyValidatedScheduleRoomTransaction(IDb db, StaffSchedule schedule)
        {
            if (string.IsNullOrWhiteSpace(schedule.room))
                return;

            var resolved = await SchoolRoomTenant.ResolveRoomIdTransaction(
                db,
                schedule.organizationid,
                schedule.room);
            if (string.IsNullOrWhiteSpace(resolved))
                return;

            schedule.room = resolved;
            await SchoolRoomTenant.EnsureNoStaffScheduleRoomConflictTransaction(
                db,
                schedule.organizationid,
                schedule.id,
                schedule.day,
                schedule.starttime,
                schedule.endtime,
                resolved);
        }

        public async Task<bool> Delete(StaffScheduleDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await DeleteTransaction(db, req);
            }
        }

        public async Task<bool> DeleteTransaction(IDb db, StaffScheduleDeleteReq req)
        {
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Schedule id is required.");

            string query = @"
                UPDATE staff_schedules
                SET is_active = false
                WHERE id = @id AND is_active = true
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }
    }
}
