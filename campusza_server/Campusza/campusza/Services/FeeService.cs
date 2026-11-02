using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class FeeService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public FeeService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Fee>> Select(FeeSelectReq req)
        {
            List<Fee> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Fee>> SelectTransaction(IDb db, FeeSelectReq req)
        {
            List<Fee> result = new List<Fee>();
            string query = @"
                SELECT 
                    id, studentid, studentname, termid, termname, academicyear,
                    totalamount, paidamount, pendingamount, status, duedate,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    feestructures, payments, discounts, penalties
                FROM Fee
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.studentid > 0)
            {
                queryBuilder.AddParameter("studentid", "=", "studentid", req.studentid, DbTypes.Types.Long);
            }
            if (req.termid > 0)
            {
                queryBuilder.AddParameter("termid", "=", "termid", req.termid, DbTypes.Types.Long);
            }
             if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.academicyear))
            {
                queryBuilder.AddParameter("academicyear", "=", "academicyear", req.academicyear, DbTypes.Types.String);
            }

            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Fee temp = new Fee();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.studentid = reader["studentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["studentid"]);
                    temp.studentname = reader["studentname"] == DBNull.Value ? "" : reader["studentname"].ToString();
                    temp.termid = reader["termid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["termid"]);
                    temp.termname = reader["termname"] == DBNull.Value ? "" : reader["termname"].ToString();
                    temp.academicyear = reader["academicyear"] == DBNull.Value ? "" : reader["academicyear"].ToString();
                    
                    temp.totalamount = reader["totalamount"] == DBNull.Value ? 0 : Convert.ToDouble(reader["totalamount"]);
                    temp.paidamount = reader["paidamount"] == DBNull.Value ? 0 : Convert.ToDouble(reader["paidamount"]);
                    temp.pendingamount = reader["pendingamount"] == DBNull.Value ? 0 : Convert.ToDouble(reader["pendingamount"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.duedate = reader["duedate"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["duedate"]);
                    
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
                    
                    temp.feestructures_json = reader["feestructures"] == DBNull.Value ? "[]" : reader["feestructures"].ToString();
                    temp.payments_json = reader["payments"] == DBNull.Value ? "[]" : reader["payments"].ToString();
                    temp.discounts_json = reader["discounts"] == DBNull.Value ? "[]" : reader["discounts"].ToString();
                    temp.penalties_json = reader["penalties"] == DBNull.Value ? "[]" : reader["penalties"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Fee> Insert(Fee fee)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, fee);
            }
            return fee;
        }

        public async Task InsertTransaction(IDb db, Fee fee)
        {
            string query = @"
                INSERT INTO Fee (
                    studentid, studentname, termid, termname, academicyear,
                    totalamount, paidamount, pendingamount, status, duedate,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    feestructures, payments, discounts, penalties
                )
                VALUES (
                    @studentid, @studentname, @termid, @termname, @academicyear,
                    @totalamount, @paidamount, @pendingamount, @status, @duedate,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes,
                    @feestructures, @payments, @discounts, @penalties
                )
                RETURNING id;
            ";

            fee.isactive = true;
            fee.version = 1;
            fee.createdon = DateTime.UtcNow;
            fee.createdby = requeststate.usercontext.id;
            fee.modifiedon = DateTime.UtcNow;
            fee.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = fee.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = fee.studentname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = fee.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = fee.termname ?? "";
            db.AddParameter(command, "academicyear", DbTypes.Types.String).Value = fee.academicyear ?? "";
            
            db.AddParameter(command, "totalamount", DbTypes.Types.Double).Value = fee.totalamount;
            db.AddParameter(command, "paidamount", DbTypes.Types.Double).Value = fee.paidamount;
            db.AddParameter(command, "pendingamount", DbTypes.Types.Double).Value = fee.pendingamount;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = fee.status ?? "";
            db.AddParameter(command, "duedate", DbTypes.Types.DateTime).Value = fee.duedate;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = fee.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = fee.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = fee.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = fee.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = fee.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = fee.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = fee.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = fee.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = fee.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = fee.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = fee.attributes_json ?? "{}";
            
            db.AddParameter(command, "feestructures", DbTypes.Types.Json).Value = fee.feestructures_json ?? "[]";
            db.AddParameter(command, "payments", DbTypes.Types.Json).Value = fee.payments_json ?? "[]";
            db.AddParameter(command, "discounts", DbTypes.Types.Json).Value = fee.discounts_json ?? "[]";
            db.AddParameter(command, "penalties", DbTypes.Types.Json).Value = fee.penalties_json ?? "[]";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    fee.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Fee> Update(Fee fee)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, fee);
            }
            return fee;
        }

        public async Task<bool> UpdateTransaction(IDb db, Fee fee)
        {
            bool result = false;
            string query = @"
                UPDATE Fee
                SET 
                    studentid = @studentid, studentname = @studentname, termid = @termid, termname = @termname, academicyear = @academicyear, 
                    totalamount = @totalamount, paidamount = @paidamount, pendingamount = @pendingamount, status = @status, duedate = @duedate,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    feestructures = @feestructures, payments = @payments, discounts = @discounts, penalties = @penalties,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            fee.modifiedon = DateTime.UtcNow;
            fee.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = fee.id;
            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = fee.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = fee.studentname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = fee.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = fee.termname ?? "";
            db.AddParameter(command, "academicyear", DbTypes.Types.String).Value = fee.academicyear ?? "";
            
            db.AddParameter(command, "totalamount", DbTypes.Types.Double).Value = fee.totalamount;
            db.AddParameter(command, "paidamount", DbTypes.Types.Double).Value = fee.paidamount;
            db.AddParameter(command, "pendingamount", DbTypes.Types.Double).Value = fee.pendingamount;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = fee.status ?? "";
            db.AddParameter(command, "duedate", DbTypes.Types.DateTime).Value = fee.duedate;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = fee.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = fee.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = fee.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = fee.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = fee.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = fee.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = fee.issuspended;
            
            db.AddParameter(command, "feestructures", DbTypes.Types.Json).Value = fee.feestructures_json ?? "[]";
            db.AddParameter(command, "payments", DbTypes.Types.Json).Value = fee.payments_json ?? "[]";
            db.AddParameter(command, "discounts", DbTypes.Types.Json).Value = fee.discounts_json ?? "[]";
            db.AddParameter(command, "penalties", DbTypes.Types.Json).Value = fee.penalties_json ?? "[]";

            if (await db.ExecuteNonQuery(command) > 0)
            {
                fee.version = fee.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(FeeDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, FeeDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Fee
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby
                WHERE id = @id
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
    }
}
