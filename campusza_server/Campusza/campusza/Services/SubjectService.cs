using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class SubjectService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public SubjectService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Subject>> Select(SubjectSelectReq req)
        {
            List<Subject> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Subject>> SelectTransaction(IDb db, SubjectSelectReq req)
        {
            List<Subject> result = new List<Subject>();
            string query = @"
                SELECT 
                    id, code, name, shortname, description, type, department, credits, weeklyhours, status,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    prerequisites
                FROM Subject
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
             if (!string.IsNullOrEmpty(req.department))
            {
                queryBuilder.AddParameter("department", "=", "department", req.department, DbTypes.Types.String);
            }
            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Subject temp = new Subject();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString();
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.shortname = reader["shortname"] == DBNull.Value ? "" : reader["shortname"].ToString();
                    temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.department = reader["department"] == DBNull.Value ? "" : reader["department"].ToString();
                    
                    temp.credits = reader["credits"] == DBNull.Value ? 0 : Convert.ToInt32(reader["credits"]);
                    temp.weeklyhours = reader["weeklyhours"] == DBNull.Value ? 0 : Convert.ToInt32(reader["weeklyhours"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    
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
                    
                    temp.prerequisites_json = reader["prerequisites"] == DBNull.Value ? "[]" : reader["prerequisites"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Subject> Insert(Subject subject)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, subject);
            }
            return subject;
        }

        public async Task InsertTransaction(IDb db, Subject subject)
        {
            string query = @"
                INSERT INTO Subject (
                    code, name, shortname, description, type, department, credits, weeklyhours, status,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    prerequisites
                )
                VALUES (
                    @code, @name, @shortname, @description, @type, @department, @credits, @weeklyhours, @status,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes,
                    @prerequisites
                )
                RETURNING id;
            ";

            subject.isactive = true;
            subject.version = 1;
            subject.createdon = DateTime.UtcNow;
            subject.createdby = requeststate.usercontext.id;
            subject.modifiedon = DateTime.UtcNow;
            subject.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "code", DbTypes.Types.String).Value = subject.code ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = subject.name ?? "";
            db.AddParameter(command, "shortname", DbTypes.Types.String).Value = subject.shortname ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = subject.description ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = subject.type ?? "";
            db.AddParameter(command, "department", DbTypes.Types.String).Value = subject.department ?? "";
            db.AddParameter(command, "credits", DbTypes.Types.Integer).Value = subject.credits;
            db.AddParameter(command, "weeklyhours", DbTypes.Types.Integer).Value = subject.weeklyhours;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = subject.status ?? "";
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = subject.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = subject.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = subject.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = subject.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = subject.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = subject.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = subject.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = subject.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = subject.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = subject.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = subject.attributes_json ?? "{}";
            
            db.AddParameter(command, "prerequisites", DbTypes.Types.Json).Value = subject.prerequisites_json ?? "[]";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    subject.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Subject> Update(Subject subject)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, subject);
            }
            return subject;
        }

        public async Task<bool> UpdateTransaction(IDb db, Subject subject)
        {
            bool result = false;
            string query = @"
                UPDATE Subject
                SET 
                    code = @code, name = @name, shortname = @shortname, description = @description, type = @type,
                    department = @department, credits = @credits, weeklyhours = @weeklyhours, status = @status,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    prerequisites = @prerequisites,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            subject.modifiedon = DateTime.UtcNow;
            subject.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = subject.id;
            db.AddParameter(command, "code", DbTypes.Types.String).Value = subject.code ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = subject.name ?? "";
            db.AddParameter(command, "shortname", DbTypes.Types.String).Value = subject.shortname ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = subject.description ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = subject.type ?? "";
            db.AddParameter(command, "department", DbTypes.Types.String).Value = subject.department ?? "";
            db.AddParameter(command, "credits", DbTypes.Types.Integer).Value = subject.credits;
            db.AddParameter(command, "weeklyhours", DbTypes.Types.Integer).Value = subject.weeklyhours;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = subject.status ?? "";
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = subject.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = subject.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = subject.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = subject.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = subject.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = subject.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = subject.issuspended;
            
            db.AddParameter(command, "prerequisites", DbTypes.Types.Json).Value = subject.prerequisites_json ?? "[]";

            if (await db.ExecuteNonQuery(command) > 0)
            {
                subject.version = subject.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(SubjectDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, SubjectDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Subject
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
