using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class ReportService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public ReportService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Report>> Select(ReportSelectReq req)
        {
            List<Report> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Report>> SelectTransaction(IDb db, ReportSelectReq req)
        {
            List<Report> result = new List<Report>();
            string query = @"
                SELECT 
                    id, name, type, format, status, generatedby, generatedat,
                    fileurl, filesize, errormessage, expiresat,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    parameters, filters
                FROM Report
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
             if (!string.IsNullOrEmpty(req.type))
            {
                queryBuilder.AddParameter("type", "=", "type", req.type, DbTypes.Types.String);
            }
             if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
             if (req.fromdate.HasValue)
            {
                queryBuilder.AddParameter("fromdate", ">=", "generatedat", req.fromdate.Value, DbTypes.Types.DateTime);
            }
             if (req.todate.HasValue)
            {
                queryBuilder.AddParameter("todate", "<=", "generatedat", req.todate.Value, DbTypes.Types.DateTime);
            }

            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "generatedat");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Report temp = new Report();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.format = reader["format"] == DBNull.Value ? "" : reader["format"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    
                    temp.generatedby = reader["generatedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["generatedby"]);
                    temp.generatedat = reader["generatedat"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["generatedat"]);
                    temp.fileurl = reader["fileurl"] == DBNull.Value ? "" : reader["fileurl"].ToString();
                    temp.filesize = reader["filesize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["filesize"]);
                    temp.errormessage = reader["errormessage"] == DBNull.Value ? "" : reader["errormessage"].ToString();
                    temp.expiresat = reader["expiresat"] == DBNull.Value ? null : Convert.ToDateTime(reader["expiresat"]);
                    
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
                    
                    temp.parameters_json = reader["parameters"] == DBNull.Value ? "{}" : reader["parameters"].ToString();
                    temp.filters_json = reader["filters"] == DBNull.Value ? "{}" : reader["filters"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Report> Insert(Report report)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, report);
            }
            return report;
        }

        public async Task InsertTransaction(IDb db, Report report)
        {
            string query = @"
                INSERT INTO Report (
                    name, type, format, status, generatedby, generatedat,
                    fileurl, filesize, errormessage, expiresat,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    parameters, filters
                )
                VALUES (
                    @name, @type, @format, @status, @generatedby, @generatedat,
                    @fileurl, @filesize, @errormessage, @expiresat,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes,
                    @parameters, @filters
                )
                RETURNING id;
            ";

            report.isactive = true;
            report.version = 1;
            report.createdon = DateTime.UtcNow;
            report.createdby = requeststate.usercontext.id;
            report.modifiedon = DateTime.UtcNow;
            report.modifiedby = requeststate.usercontext.id;
            
             // Auto set generatedby if not set
            if (report.generatedby == 0) report.generatedby = requeststate.usercontext.id;
            if (report.generatedat == DateTime.MinValue) report.generatedat = DateTime.UtcNow;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "name", DbTypes.Types.String).Value = report.name ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = report.type ?? "";
            db.AddParameter(command, "format", DbTypes.Types.String).Value = report.format ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = report.status ?? "";
            
            db.AddParameter(command, "generatedby", DbTypes.Types.Long).Value = report.generatedby;
            db.AddParameter(command, "generatedat", DbTypes.Types.DateTime).Value = report.generatedat;
            db.AddParameter(command, "fileurl", DbTypes.Types.String).Value = report.fileurl ?? "";
            db.AddParameter(command, "filesize", DbTypes.Types.Long).Value = report.filesize;
            db.AddParameter(command, "errormessage", DbTypes.Types.String).Value = report.errormessage ?? "";
            db.AddParameter(command, "expiresat", DbTypes.Types.DateTime).Value = report.expiresat.HasValue ? (object)report.expiresat.Value : DBNull.Value;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = report.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = report.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = report.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = report.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = report.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = report.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = report.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = report.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = report.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = report.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = report.attributes_json ?? "{}";
            
            db.AddParameter(command, "parameters", DbTypes.Types.Json).Value = report.parameters_json ?? "{}";
            db.AddParameter(command, "filters", DbTypes.Types.Json).Value = report.filters_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    report.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Report> Update(Report report)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, report);
            }
            return report;
        }

        public async Task<bool> UpdateTransaction(IDb db, Report report)
        {
            bool result = false;
            string query = @"
                UPDATE Report
                SET 
                    name = @name, type = @type, format = @format, status = @status, 
                    generatedby = @generatedby, generatedat = @generatedat,
                    fileurl = @fileurl, filesize = @filesize, errormessage = @errormessage, expiresat = @expiresat,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    parameters = @parameters, filters = @filters,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            report.modifiedon = DateTime.UtcNow;
            report.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = report.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = report.name ?? "";
             db.AddParameter(command, "type", DbTypes.Types.String).Value = report.type ?? "";
            db.AddParameter(command, "format", DbTypes.Types.String).Value = report.format ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = report.status ?? "";
            
            db.AddParameter(command, "generatedby", DbTypes.Types.Long).Value = report.generatedby;
            db.AddParameter(command, "generatedat", DbTypes.Types.DateTime).Value = report.generatedat;
            db.AddParameter(command, "fileurl", DbTypes.Types.String).Value = report.fileurl ?? "";
            db.AddParameter(command, "filesize", DbTypes.Types.Long).Value = report.filesize;
            db.AddParameter(command, "errormessage", DbTypes.Types.String).Value = report.errormessage ?? "";
            db.AddParameter(command, "expiresat", DbTypes.Types.DateTime).Value = report.expiresat.HasValue ? (object)report.expiresat.Value : DBNull.Value;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = report.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = report.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = report.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = report.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = report.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = report.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = report.issuspended;
            
            db.AddParameter(command, "parameters", DbTypes.Types.Json).Value = report.parameters_json ?? "{}";
            db.AddParameter(command, "filters", DbTypes.Types.Json).Value = report.filters_json ?? "{}";

            if (await db.ExecuteNonQuery(command) > 0)
            {
                report.version = report.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(ReportDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, ReportDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Report
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
