using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class AssessmentService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public AssessmentService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Assessment>> Select(AssessmentSelectReq req)
        {
            List<Assessment> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Assessment>> SelectTransaction(IDb db, AssessmentSelectReq req)
        {
            List<Assessment> result = new List<Assessment>();
            string query = @"
                SELECT 
                    id, name, type, subjectid, subjectname, classid, classname, termid, termname, maxscore, weight, 
                    duedate, assessmentdate, instructions, status,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                FROM Assessment
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
            if (req.classid > 0)
            {
                queryBuilder.AddParameter("classid", "=", "classid", req.classid, DbTypes.Types.Long);
            }
            if (req.subjectid > 0)
            {
                queryBuilder.AddParameter("subjectid", "=", "subjectid", req.subjectid, DbTypes.Types.Long);
            }
            if (req.termid > 0)
            {
                queryBuilder.AddParameter("termid", "=", "termid", req.termid, DbTypes.Types.Long);
            }
            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Assessment temp = new Assessment();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.subjectid = reader["subjectid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["subjectid"]);
                    temp.subjectname = reader["subjectname"] == DBNull.Value ? "" : reader["subjectname"].ToString();
                    temp.classid = reader["classid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["classid"]);
                    temp.classname = reader["classname"] == DBNull.Value ? "" : reader["classname"].ToString();
                    temp.termid = reader["termid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["termid"]);
                    temp.termname = reader["termname"] == DBNull.Value ? "" : reader["termname"].ToString();
                    
                    temp.maxscore = reader["maxscore"] == DBNull.Value ? 0 : Convert.ToDouble(reader["maxscore"]);
                    temp.weight = reader["weight"] == DBNull.Value ? 0 : Convert.ToDouble(reader["weight"]);
                    temp.duedate = reader["duedate"] == DBNull.Value ? null : Convert.ToDateTime(reader["duedate"]);
                    temp.assessmentdate = reader["assessmentdate"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["assessmentdate"]);
                    temp.instructions = reader["instructions"] == DBNull.Value ? "" : reader["instructions"].ToString();
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

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Assessment> Insert(Assessment assessment)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, assessment);
            }
            return assessment;
        }

        public async Task InsertTransaction(IDb db, Assessment assessment)
        {
            string query = @"
                INSERT INTO Assessment (
                    name, type, subjectid, subjectname, classid, classname, termid, termname, maxscore, weight, 
                    duedate, assessmentdate, instructions, status,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                )
                VALUES (
                    @name, @type, @subjectid, @subjectname, @classid, @classname, @termid, @termname, @maxscore, @weight, 
                    @duedate, @assessmentdate, @instructions, @status,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes
                )
                RETURNING id;
            ";

            assessment.isactive = true;
            assessment.version = 1;
            assessment.createdon = DateTime.UtcNow;
            assessment.createdby = requeststate.usercontext.id;
            assessment.modifiedon = DateTime.UtcNow;
            assessment.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "name", DbTypes.Types.String).Value = assessment.name ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = assessment.type ?? "";
            db.AddParameter(command, "subjectid", DbTypes.Types.Long).Value = assessment.subjectid;
            db.AddParameter(command, "subjectname", DbTypes.Types.String).Value = assessment.subjectname ?? "";
            db.AddParameter(command, "classid", DbTypes.Types.Long).Value = assessment.classid;
            db.AddParameter(command, "classname", DbTypes.Types.String).Value = assessment.classname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = assessment.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = assessment.termname ?? "";
            
            db.AddParameter(command, "maxscore", DbTypes.Types.Double).Value = assessment.maxscore;
            db.AddParameter(command, "weight", DbTypes.Types.Double).Value = assessment.weight;
            db.AddParameter(command, "duedate", DbTypes.Types.DateTime).Value = assessment.duedate.HasValue ? (object)assessment.duedate.Value : DBNull.Value;
            db.AddParameter(command, "assessmentdate", DbTypes.Types.DateTime).Value = assessment.assessmentdate;
            db.AddParameter(command, "instructions", DbTypes.Types.String).Value = assessment.instructions ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = assessment.status ?? "";
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = assessment.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = assessment.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = assessment.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = assessment.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = assessment.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = assessment.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = assessment.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = assessment.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = assessment.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = assessment.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = assessment.attributes_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    assessment.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Assessment> Update(Assessment assessment)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, assessment);
            }
            return assessment;
        }

        public async Task<bool> UpdateTransaction(IDb db, Assessment assessment)
        {
            bool result = false;
            string query = @"
                UPDATE Assessment
                SET 
                    name = @name, type = @type, subjectid = @subjectid, subjectname = @subjectname, 
                    classid = @classid, classname = @classname, termid = @termid, termname = @termname, 
                    maxscore = @maxscore, weight = @weight, duedate = @duedate, assessmentdate = @assessmentdate, 
                    instructions = @instructions, status = @status,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            assessment.modifiedon = DateTime.UtcNow;
            assessment.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = assessment.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = assessment.name ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = assessment.type ?? "";
            db.AddParameter(command, "subjectid", DbTypes.Types.Long).Value = assessment.subjectid;
            db.AddParameter(command, "subjectname", DbTypes.Types.String).Value = assessment.subjectname ?? "";
            db.AddParameter(command, "classid", DbTypes.Types.Long).Value = assessment.classid;
            db.AddParameter(command, "classname", DbTypes.Types.String).Value = assessment.classname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = assessment.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = assessment.termname ?? "";
            
            db.AddParameter(command, "maxscore", DbTypes.Types.Double).Value = assessment.maxscore;
            db.AddParameter(command, "weight", DbTypes.Types.Double).Value = assessment.weight;
            db.AddParameter(command, "duedate", DbTypes.Types.DateTime).Value = assessment.duedate.HasValue ? (object)assessment.duedate.Value : DBNull.Value;
            db.AddParameter(command, "assessmentdate", DbTypes.Types.DateTime).Value = assessment.assessmentdate;
            db.AddParameter(command, "instructions", DbTypes.Types.String).Value = assessment.instructions ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = assessment.status ?? "";
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = assessment.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = assessment.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = assessment.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = assessment.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = assessment.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = assessment.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = assessment.issuspended;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                assessment.version = assessment.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(AssessmentDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, AssessmentDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Assessment
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
