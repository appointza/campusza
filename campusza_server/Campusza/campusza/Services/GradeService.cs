using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class GradeService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public GradeService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Grade>> Select(GradeSelectReq req)
        {
            List<Grade> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Grade>> SelectTransaction(IDb db, GradeSelectReq req)
        {
            List<Grade> result = new List<Grade>();
            string query = @"
                SELECT 
                    id, assessmentid, assessmentname, assessmenttype, studentid, studentname,
                    classid, classname, subjectid, subjectname, termid, termname,
                    score, maxscore, percentage, lettergrade, remarks, gradedby, gradedat,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                FROM Grade
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
            if (req.assessmentid > 0)
            {
                queryBuilder.AddParameter("assessmentid", "=", "assessmentid", req.assessmentid, DbTypes.Types.Long);
            }
             if (req.studentid > 0)
            {
                queryBuilder.AddParameter("studentid", "=", "studentid", req.studentid, DbTypes.Types.Long);
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
                    Grade temp = new Grade();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.assessmentid = reader["assessmentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["assessmentid"]);
                    temp.assessmentname = reader["assessmentname"] == DBNull.Value ? "" : reader["assessmentname"].ToString();
                    temp.assessmenttype = reader["assessmenttype"] == DBNull.Value ? "" : reader["assessmenttype"].ToString();
                    temp.studentid = reader["studentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["studentid"]);
                    temp.studentname = reader["studentname"] == DBNull.Value ? "" : reader["studentname"].ToString();
                    
                    temp.classid = reader["classid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["classid"]);
                    temp.classname = reader["classname"] == DBNull.Value ? "" : reader["classname"].ToString();
                    temp.subjectid = reader["subjectid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["subjectid"]);
                    temp.subjectname = reader["subjectname"] == DBNull.Value ? "" : reader["subjectname"].ToString();
                    temp.termid = reader["termid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["termid"]);
                    temp.termname = reader["termname"] == DBNull.Value ? "" : reader["termname"].ToString();
                    
                    temp.score = reader["score"] == DBNull.Value ? 0 : Convert.ToDouble(reader["score"]);
                    temp.maxscore = reader["maxscore"] == DBNull.Value ? 0 : Convert.ToDouble(reader["maxscore"]);
                    temp.percentage = reader["percentage"] == DBNull.Value ? 0 : Convert.ToDouble(reader["percentage"]);
                    temp.lettergrade = reader["lettergrade"] == DBNull.Value ? "" : reader["lettergrade"].ToString();
                    temp.remarks = reader["remarks"] == DBNull.Value ? "" : reader["remarks"].ToString();
                    temp.gradedby = reader["gradedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["gradedby"]);
                    temp.gradedat = reader["gradedat"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["gradedat"]);
                    
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

        public async Task<Grade> Insert(Grade grade)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, grade);
            }
            return grade;
        }

        public async Task InsertTransaction(IDb db, Grade grade)
        {
            string query = @"
                INSERT INTO Grade (
                    assessmentid, assessmentname, assessmenttype, studentid, studentname,
                    classid, classname, subjectid, subjectname, termid, termname,
                    score, maxscore, percentage, lettergrade, remarks, gradedby, gradedat,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                )
                VALUES (
                    @assessmentid, @assessmentname, @assessmenttype, @studentid, @studentname,
                    @classid, @classname, @subjectid, @subjectname, @termid, @termname,
                    @score, @maxscore, @percentage, @lettergrade, @remarks, @gradedby, @gradedat,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes
                )
                RETURNING id;
            ";

            grade.isactive = true;
            grade.version = 1;
            grade.createdon = DateTime.UtcNow;
            grade.createdby = requeststate.usercontext.id;
            grade.modifiedon = DateTime.UtcNow;
            grade.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "assessmentid", DbTypes.Types.Long).Value = grade.assessmentid;
            db.AddParameter(command, "assessmentname", DbTypes.Types.String).Value = grade.assessmentname ?? "";
            db.AddParameter(command, "assessmenttype", DbTypes.Types.String).Value = grade.assessmenttype ?? "";
            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = grade.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = grade.studentname ?? "";
            
            db.AddParameter(command, "classid", DbTypes.Types.Long).Value = grade.classid;
            db.AddParameter(command, "classname", DbTypes.Types.String).Value = grade.classname ?? "";
            db.AddParameter(command, "subjectid", DbTypes.Types.Long).Value = grade.subjectid;
            db.AddParameter(command, "subjectname", DbTypes.Types.String).Value = grade.subjectname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = grade.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = grade.termname ?? "";
            
            db.AddParameter(command, "score", DbTypes.Types.Double).Value = grade.score;
            db.AddParameter(command, "maxscore", DbTypes.Types.Double).Value = grade.maxscore;
            db.AddParameter(command, "percentage", DbTypes.Types.Double).Value = grade.percentage;
            db.AddParameter(command, "lettergrade", DbTypes.Types.String).Value = grade.lettergrade ?? "";
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = grade.remarks ?? "";
            db.AddParameter(command, "gradedby", DbTypes.Types.Long).Value = grade.gradedby;
            db.AddParameter(command, "gradedat", DbTypes.Types.DateTime).Value = grade.gradedat;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = grade.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = grade.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = grade.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = grade.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = grade.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = grade.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = grade.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = grade.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = grade.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = grade.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = grade.attributes_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    grade.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Grade> Update(Grade grade)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, grade);
            }
            return grade;
        }

        public async Task<bool> UpdateTransaction(IDb db, Grade grade)
        {
            bool result = false;
            string query = @"
                UPDATE Grade
                SET 
                    assessmentid = @assessmentid, assessmentname = @assessmentname, assessmenttype = @assessmenttype, 
                    studentid = @studentid, studentname = @studentname,
                    classid = @classid, classname = @classname, subjectid = @subjectid, subjectname = @subjectname, 
                    termid = @termid, termname = @termname,
                    score = @score, maxscore = @maxscore, percentage = @percentage, lettergrade = @lettergrade, 
                    remarks = @remarks, gradedby = @gradedby, gradedat = @gradedat,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            grade.modifiedon = DateTime.UtcNow;
            grade.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = grade.id;
            db.AddParameter(command, "assessmentid", DbTypes.Types.Long).Value = grade.assessmentid;
            db.AddParameter(command, "assessmentname", DbTypes.Types.String).Value = grade.assessmentname ?? "";
            db.AddParameter(command, "assessmenttype", DbTypes.Types.String).Value = grade.assessmenttype ?? "";
            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = grade.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = grade.studentname ?? "";
            
            db.AddParameter(command, "classid", DbTypes.Types.Long).Value = grade.classid;
            db.AddParameter(command, "classname", DbTypes.Types.String).Value = grade.classname ?? "";
            db.AddParameter(command, "subjectid", DbTypes.Types.Long).Value = grade.subjectid;
            db.AddParameter(command, "subjectname", DbTypes.Types.String).Value = grade.subjectname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = grade.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = grade.termname ?? "";
            
            db.AddParameter(command, "score", DbTypes.Types.Double).Value = grade.score;
            db.AddParameter(command, "maxscore", DbTypes.Types.Double).Value = grade.maxscore;
            db.AddParameter(command, "percentage", DbTypes.Types.Double).Value = grade.percentage;
            db.AddParameter(command, "lettergrade", DbTypes.Types.String).Value = grade.lettergrade ?? "";
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = grade.remarks ?? "";
            db.AddParameter(command, "gradedby", DbTypes.Types.Long).Value = grade.gradedby;
            db.AddParameter(command, "gradedat", DbTypes.Types.DateTime).Value = grade.gradedat;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = grade.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = grade.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = grade.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = grade.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = grade.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = grade.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = grade.issuspended;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                grade.version = grade.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(GradeDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, GradeDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Grade
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
