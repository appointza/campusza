using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class StaffLeaveService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public StaffLeaveService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<StaffLeave>> Select(StaffLeaveSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<StaffLeave>> SelectTransaction(IDb db, StaffLeaveSelectReq req)
        {
            List<StaffLeave> result = new List<StaffLeave>();
            string query = @"
                SELECT
                    id, staff_id, staff_name, leave_type, start_date, end_date, reason, status,
                    applied_date, approved_by, approved_date, rejected_reason, total_days,
                    organization_id, is_active
                FROM staff_leaves
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.staffid))
                queryBuilder.AddParameter("staff_id", "=", "staff_id", req.staffid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.status))
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);

            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "applied_date");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    StaffLeave temp = new StaffLeave();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.staffid = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.staffname = reader["staff_name"] == DBNull.Value ? "" : reader["staff_name"].ToString();
                    temp.leavetype = reader["leave_type"] == DBNull.Value ? "" : reader["leave_type"].ToString();
                    temp.startdate = reader["start_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["start_date"]);
                    temp.enddate = reader["end_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["end_date"]);
                    temp.reason = reader["reason"] == DBNull.Value ? "" : reader["reason"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.applieddate = reader["applied_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["applied_date"]);
                    temp.approvedby = reader["approved_by"] == DBNull.Value ? "" : reader["approved_by"].ToString();
                    temp.approveddate = reader["approved_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["approved_date"]);
                    temp.rejectedreason = reader["rejected_reason"] == DBNull.Value ? "" : reader["rejected_reason"].ToString();
                    temp.totaldays = reader["total_days"] == DBNull.Value ? 0 : Convert.ToInt32(reader["total_days"]);
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]);
                    result.Add(temp);
                }
            }

            return result;
        }

        public async Task<StaffLeave> Insert(StaffLeave leave)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, leave);
            }
            return leave;
        }

        public async Task InsertTransaction(IDb db, StaffLeave leave)
        {
            if (string.IsNullOrWhiteSpace(leave.organizationid) && requeststate.usercontext?.organisationid > 0)
                leave.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(leave.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(leave.staffid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Staff is required.");

            await EnsureNoOverlappingLeaveAsync(db, leave);

            leave.id = string.IsNullOrWhiteSpace(leave.id) ? Guid.NewGuid().ToString() : leave.id;
            leave.status = string.IsNullOrWhiteSpace(leave.status) ? "pending" : leave.status;
            leave.applieddate = leave.applieddate == default ? DateTime.UtcNow.Date : leave.applieddate;
            leave.totaldays = leave.totaldays > 0
                ? leave.totaldays
                : Math.Max(1, (leave.enddate.Date - leave.startdate.Date).Days + 1);
            leave.isactive = true;

            string query = @"
                INSERT INTO staff_leaves (
                    id, staff_id, staff_name, leave_type, start_date, end_date, reason, status,
                    applied_date, approved_by, approved_date, rejected_reason, total_days,
                    organization_id, is_active
                )
                VALUES (
                    @id, @staff_id, @staff_name, @leave_type, @start_date, @end_date, @reason, @status,
                    @applied_date, @approved_by, @approved_date, @rejected_reason, @total_days,
                    @organization_id, @is_active
                );
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = leave.id;
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = leave.staffid ?? "";
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = leave.staffname ?? "";
            db.AddParameter(command, "leave_type", DbTypes.Types.String).Value = leave.leavetype ?? "";
            db.AddParameter(command, "start_date", DbTypes.Types.Date).Value = leave.startdate.Date;
            db.AddParameter(command, "end_date", DbTypes.Types.Date).Value = leave.enddate.Date;
            db.AddParameter(command, "reason", DbTypes.Types.String).Value = leave.reason ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = leave.status ?? "pending";
            db.AddParameter(command, "applied_date", DbTypes.Types.Date).Value = leave.applieddate.Date;
            db.AddParameter(command, "approved_by", DbTypes.Types.String).Value = leave.approvedby ?? "";
            db.AddParameter(command, "approved_date", DbTypes.Types.Date).Value = leave.approveddate == null ? DBNull.Value : leave.approveddate.Value.Date;
            db.AddParameter(command, "rejected_reason", DbTypes.Types.String).Value = leave.rejectedreason ?? "";
            db.AddParameter(command, "total_days", DbTypes.Types.Integer).Value = leave.totaldays;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = leave.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = leave.isactive;

            await db.ExecuteNonQuery(command);
        }

        public async Task<StaffLeave> Update(StaffLeave leave)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, leave);
            }
            return leave;
        }

        public async Task<bool> UpdateTransaction(IDb db, StaffLeave leave)
        {
            if (string.IsNullOrWhiteSpace(leave.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Leave id is required.");
            if (string.IsNullOrWhiteSpace(leave.organizationid) && requeststate.usercontext?.organisationid > 0)
                leave.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(leave.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            await EnsureNoOverlappingLeaveAsync(db, leave, leave.id);

            if (leave.status == "approved" && leave.approveddate == null)
                leave.approveddate = DateTime.UtcNow.Date;

            string query = @"
                UPDATE staff_leaves
                SET
                    staff_id = @staff_id,
                    staff_name = @staff_name,
                    leave_type = @leave_type,
                    start_date = @start_date,
                    end_date = @end_date,
                    reason = @reason,
                    status = @status,
                    applied_date = @applied_date,
                    approved_by = @approved_by,
                    approved_date = @approved_date,
                    rejected_reason = @rejected_reason,
                    total_days = @total_days,
                    organization_id = @organization_id
                WHERE id = @id AND is_active = true
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = leave.id ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = leave.staffid ?? "";
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = leave.staffname ?? "";
            db.AddParameter(command, "leave_type", DbTypes.Types.String).Value = leave.leavetype ?? "";
            db.AddParameter(command, "start_date", DbTypes.Types.Date).Value = leave.startdate.Date;
            db.AddParameter(command, "end_date", DbTypes.Types.Date).Value = leave.enddate.Date;
            db.AddParameter(command, "reason", DbTypes.Types.String).Value = leave.reason ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = leave.status ?? "";
            db.AddParameter(command, "applied_date", DbTypes.Types.Date).Value = leave.applieddate.Date;
            db.AddParameter(command, "approved_by", DbTypes.Types.String).Value = leave.approvedby ?? "";
            db.AddParameter(command, "approved_date", DbTypes.Types.Date).Value = leave.approveddate == null ? DBNull.Value : leave.approveddate.Value.Date;
            db.AddParameter(command, "rejected_reason", DbTypes.Types.String).Value = leave.rejectedreason ?? "";
            db.AddParameter(command, "total_days", DbTypes.Types.Integer).Value = leave.totaldays;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = leave.organizationid ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<bool> Delete(StaffLeaveDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await DeleteTransaction(db, req);
            }
        }

        public async Task<bool> DeleteTransaction(IDb db, StaffLeaveDeleteReq req)
        {
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Leave id is required.");

            string query = @"
                UPDATE staff_leaves
                SET is_active = false
                WHERE id = @id AND is_active = true
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }

        private static bool DateRangesOverlap(DateTime startA, DateTime endA, DateTime startB, DateTime endB)
        {
            return startA.Date <= endB.Date && endA.Date >= startB.Date;
        }

        private async Task EnsureNoOverlappingLeaveAsync(IDb db, StaffLeave leave, string? excludeLeaveId = null)
        {
            if (leave.startdate == default || leave.enddate == default)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Valid start and end dates are required.");
            if (leave.enddate.Date < leave.startdate.Date)
                throw new AppException(AppException.ErrorCodes.BadRequest, "End date must be on or after start date.");

            var existing = await SelectTransaction(db, new StaffLeaveSelectReq
            {
                organizationid = leave.organizationid ?? "",
                staffid = leave.staffid ?? "",
            });

            foreach (var other in existing)
            {
                if (!string.IsNullOrWhiteSpace(excludeLeaveId) &&
                    string.Equals(other.id, excludeLeaveId, StringComparison.OrdinalIgnoreCase))
                    continue;
                if (!other.isactive)
                    continue;
                if (string.Equals(other.status, "rejected", StringComparison.OrdinalIgnoreCase))
                    continue;
                if (other.startdate == default || other.enddate == default)
                    continue;
                if (DateRangesOverlap(leave.startdate.Date, leave.enddate.Date, other.startdate.Date, other.enddate.Date))
                    throw new AppException(
                        AppException.ErrorCodes.BadRequest,
                        "This staff member already has leave for one or more of these dates.");
            }
        }
    }
}
