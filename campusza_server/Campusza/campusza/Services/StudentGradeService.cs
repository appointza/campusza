using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class StudentGradeService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public StudentGradeService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<StudentGrade>> Select(StudentGradeSelectReq req)
        {
            List<StudentGrade> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<StudentGrade>> SelectTransaction(IDb db, StudentGradeSelectReq req)
        {
            List<StudentGrade> result = new List<StudentGrade>();
            string query = @"
                SELECT 
                    id, organization_id, class_id, term_id, assessment_ref_id, student_id,
                    components_json, final_weighted_score, final_percentage, letter_grade, is_active,
                    created_at, updated_at, created_by, updated_by
                FROM student_grades
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            // Always filter by active status
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            
            // Auto-fill organization_id from user context if missing
            if (string.IsNullOrEmpty(req.organizationid) && requeststate?.usercontext != null)
            {
                req.organizationid = requeststate.usercontext.organisationid.ToString();
            }

            if (!string.IsNullOrEmpty(req.organizationid))
            {
                if (long.TryParse(req.organizationid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orgLong))
                    queryBuilder.AddParameter("organization_id", "=", "organization_id", orgLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(req.classid))
            {
                if (long.TryParse(req.classid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var classLong))
                    queryBuilder.AddParameter("class_id", "=", "class_id", classLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(req.termid))
            {
                if (long.TryParse(req.termid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var termLong))
                    queryBuilder.AddParameter("term_id", "=", "term_id", termLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("term_id", "=", "term_id", req.termid, DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(req.assessmentrefid))
            {
                if (long.TryParse(req.assessmentrefid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var arLong))
                    queryBuilder.AddParameter("assessment_ref_id", "=", "assessment_ref_id", arLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("assessment_ref_id", "=", "assessment_ref_id", req.assessmentrefid, DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(req.studentid))
            {
                if (long.TryParse(req.studentid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var stLong))
                    queryBuilder.AddParameter("student_id", "=", "student_id", stLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("student_id", "=", "student_id", req.studentid, DbTypes.Types.String);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "created_at");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var item = new StudentGrade
                    {
                        id = reader["id"] == DBNull.Value ? "" : reader["id"].ToString(),
                        organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString(),
                        classid = reader["class_id"] == DBNull.Value ? "" : reader["class_id"].ToString(),
                        termid = reader["term_id"] == DBNull.Value ? "" : reader["term_id"].ToString(),
                        assessmentrefid = reader["assessment_ref_id"] == DBNull.Value ? "" : reader["assessment_ref_id"].ToString(),
                        studentid = reader["student_id"] == DBNull.Value ? "" : reader["student_id"].ToString(),
                        componentsjson = reader["components_json"] == DBNull.Value ? "[]" : reader["components_json"].ToString(),
                        finalweightedscore = reader["final_weighted_score"] == DBNull.Value ? 0 : Convert.ToDouble((decimal)reader["final_weighted_score"]),
                        finalpercentage = reader["final_percentage"] == DBNull.Value ? 0 : Convert.ToDouble((decimal)reader["final_percentage"]),
                        lettergrade = reader["letter_grade"] == DBNull.Value ? "" : reader["letter_grade"].ToString(),
                        isactive = reader["is_active"] == DBNull.Value ? false : (bool)reader["is_active"],
                        createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : (DateTime)reader["created_at"],
                        updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : (DateTime)reader["updated_at"],
                        createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString(),
                        updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString()
                    };
                    result.Add(item);
                }
            }

            return result;
        }

        public async Task UpsertMany(List<StudentGrade> grades)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpsertManyTransaction(db, grades);
            }
        }

        public async Task UpsertManyTransaction(IDb db, List<StudentGrade> grades)
        {
            if (grades == null || grades.Count == 0)
                return;

            // Auto-fill organization_id from user context if missing
            foreach (var grade in grades)
            {
                if (string.IsNullOrEmpty(grade.organizationid) && requeststate?.usercontext != null)
                {
                    grade.organizationid = requeststate.usercontext.organisationid.ToString();
                }
                if (string.IsNullOrEmpty(grade.createdby) && requeststate?.usercontext != null)
                {
                    grade.createdby = requeststate.usercontext.userid.ToString();
                }
                if (string.IsNullOrEmpty(grade.updatedby) && requeststate?.usercontext != null)
                {
                    grade.updatedby = requeststate.usercontext.userid.ToString();
                }
                if (grade.id == "")
                {
                    grade.id = Guid.NewGuid().ToString();
                }
                if (grade.createdat == DateTime.MinValue)
                {
                    grade.createdat = DateTime.UtcNow;
                }
                grade.updatedat = DateTime.UtcNow;
            }

            string query = @"
                INSERT INTO student_grades 
                (id, organization_id, class_id, term_id, assessment_ref_id, student_id,
                 components_json, final_weighted_score, final_percentage, letter_grade, is_active,
                 created_at, updated_at, created_by, updated_by)
                VALUES 
                (@id, @organization_id, @class_id, @term_id, @assessment_ref_id, @student_id,
                 @components_json::jsonb, @final_weighted_score, @final_percentage, @letter_grade, @is_active,
                 @created_at, @updated_at, @created_by, @updated_by)
                ON CONFLICT (organization_id, class_id, term_id, assessment_ref_id, student_id)
                DO UPDATE SET
                    components_json = EXCLUDED.components_json,
                    final_weighted_score = EXCLUDED.final_weighted_score,
                    final_percentage = EXCLUDED.final_percentage,
                    letter_grade = EXCLUDED.letter_grade,
                    updated_at = EXCLUDED.updated_at,
                    updated_by = EXCLUDED.updated_by;
                ";

            foreach (var grade in grades)
            {
                var command = db.GetCommand(query);

                db.AddParameter(command, "id", DbTypes.Types.String).Value = grade.id ?? "";
                AddRequiredBigInt(db, command, "organization_id", grade.organizationid, "Organization ID");
                AddRequiredBigInt(db, command, "class_id", grade.classid, "Class ID");
                AddRequiredBigInt(db, command, "term_id", grade.termid, "Term ID");
                AddRequiredBigInt(db, command, "assessment_ref_id", grade.assessmentrefid, "Assessment reference ID");
                AddRequiredBigInt(db, command, "student_id", grade.studentid, "Student ID");
                db.AddParameter(command, "components_json", DbTypes.Types.Json).Value = grade.componentsjson ?? "[]";
                db.AddParameter(command, "final_weighted_score", DbTypes.Types.Decimal).Value = (decimal)grade.finalweightedscore;
                db.AddParameter(command, "final_percentage", DbTypes.Types.Decimal).Value = (decimal)grade.finalpercentage;
                db.AddParameter(command, "letter_grade", DbTypes.Types.String).Value = grade.lettergrade ?? "";
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = grade.isactive;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = grade.createdat;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = grade.updatedat;
                db.AddParameter(command, "created_by", DbTypes.Types.String).Value = grade.createdby ?? "";
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = grade.updatedby ?? "";

                await db.ExecuteNonQuery(command);
            }
        }

        private static void AddRequiredBigInt(IDb db, DbCommand command, string parameterName, string? raw, string label)
        {
            if (string.IsNullOrWhiteSpace(raw))
                throw new AppException(AppException.ErrorCodes.BadRequest, $"{label} is required.");
            if (!long.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var v))
                throw new AppException(AppException.ErrorCodes.BadRequest, $"{label} must be a valid number.");
            db.AddParameter(command, parameterName, DbTypes.Types.Long).Value = v;
        }
    }
}
