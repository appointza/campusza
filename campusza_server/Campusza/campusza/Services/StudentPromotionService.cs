using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public class StudentPromotionService
    {
        private IDbProvider dbprovider;
        private IQueryBuilderProvider querybuilderprovider;
        private RequestState requeststate;

        public StudentPromotionService(IDbProvider dbprov, IQueryBuilderProvider qprov, RequestState rstate)
        {
            dbprovider = dbprov;
            querybuilderprovider = qprov;
            requeststate = rstate;
        }

        // Get academic history for a student
        public async Task<List<StudentAcademicHistory>> GetStudentAcademicHistory(string studentId, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                organizationId = requeststate.usercontext.organisationid.ToString();

            List<StudentAcademicHistory> result = new List<StudentAcademicHistory>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    SELECT id, organization_id, student_id, academic_year, grade, class_id, 
                           class_name, section, roll_number, total_marks, percentage, gpa, 
                           grade_letter, promotion_status, promotion_date, is_active, 
                           created_at, updated_at, created_by, updated_by
                    FROM student_academic_history
                    WHERE student_id = @student_id AND organization_id = @organization_id
                    ORDER BY created_at DESC, academic_year DESC
                ";

                DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "student_id", DbTypes.Types.String);
                command.Parameters["student_id"].Value = studentId;
                db.AddParameter(command, "organization_id", DbTypes.Types.String);
                command.Parameters["organization_id"].Value = organizationId;

                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        result.Add(MapToAcademicHistory(reader));
                    }
                }
            }
            return result;
        }

        // Get all promotions
        public async Task<List<StudentPromotion>> SelectPromotions(StudentPromotionSelectReq req)
        {
            List<StudentPromotion> result = new List<StudentPromotion>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SelectPromotionsTransaction(db, req);
            }
            return result;
        }

        public async Task<List<StudentPromotion>> SelectPromotionsTransaction(IDb db, StudentPromotionSelectReq req)
        {
            List<StudentPromotion> result = new List<StudentPromotion>();
            
            // Auto-fill organization ID if missing
            if (string.IsNullOrWhiteSpace(req.organizationid))
                req.organizationid = requeststate.usercontext.organisationid.ToString();

            string query = @"
                SELECT id, organization_id, student_id, student_name, from_grade, from_class_id,
                       from_class_name, to_grade, to_class_id, to_class_name, academic_year_from,
                       academic_year_to, final_percentage, gpa, promotion_type, promotion_date,
                       promoted_by, notes, is_active, created_at, updated_at, created_by, updated_by
                FROM student_promotions
                WHERE is_active = true
            ";

            if (!string.IsNullOrWhiteSpace(req.organizationid))
                query += " AND organization_id = @organization_id";
            if (!string.IsNullOrWhiteSpace(req.studentid))
                query += " AND student_id = @student_id";
            if (!string.IsNullOrWhiteSpace(req.academicyear))
                query += " AND academic_year_from = @academic_year";

            query += " ORDER BY promotion_date DESC";

            DbCommand command = db.GetCommand(query);
            
            if (!string.IsNullOrWhiteSpace(req.organizationid))
            {
                db.AddParameter(command, "organization_id", DbTypes.Types.String);
                command.Parameters["organization_id"].Value = req.organizationid;
            }
            if (!string.IsNullOrWhiteSpace(req.studentid))
            {
                db.AddParameter(command, "student_id", DbTypes.Types.String);
                command.Parameters["student_id"].Value = req.studentid;
            }
            if (!string.IsNullOrWhiteSpace(req.academicyear))
            {
                db.AddParameter(command, "academic_year", DbTypes.Types.String);
                command.Parameters["academic_year"].Value = req.academicyear;
            }

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    result.Add(MapToPromotion(reader));
                }
            }
            return result;
        }

        // Map reader to StudentAcademicHistory
        private StudentAcademicHistory MapToAcademicHistory(DbDataReader reader)
        {
            return new StudentAcademicHistory
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                studentid = reader["student_id"]?.ToString() ?? "",
                academicyear = reader["academic_year"]?.ToString() ?? "",
                grade = reader["grade"]?.ToString() ?? "",
                classid = reader["class_id"]?.ToString() ?? "",
                classname = reader["class_name"]?.ToString() ?? "",
                section = reader["section"]?.ToString() ?? "",
                rollnumber = reader["roll_number"] == DBNull.Value ? null : Convert.ToInt32(reader["roll_number"]),
                totalmarks = reader["total_marks"] == DBNull.Value ? null : Convert.ToDecimal(reader["total_marks"]),
                percentage = reader["percentage"] == DBNull.Value ? null : Convert.ToDecimal(reader["percentage"]),
                gpa = reader["gpa"] == DBNull.Value ? null : Convert.ToDecimal(reader["gpa"]),
                gradeletter = reader["grade_letter"]?.ToString() ?? "",
                promotionstatus = reader["promotion_status"]?.ToString() ?? "current",
                promotiondate = reader["promotion_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["promotion_date"]),
                isactive = reader["is_active"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? ""
            };
        }

        // Map reader to StudentPromotion
        private StudentPromotion MapToPromotion(DbDataReader reader)
        {
            return new StudentPromotion
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                studentid = reader["student_id"]?.ToString() ?? "",
                studentname = reader["student_name"]?.ToString() ?? "",
                fromgrade = reader["from_grade"]?.ToString() ?? "",
                fromclassid = reader["from_class_id"]?.ToString() ?? "",
                fromclassname = reader["from_class_name"]?.ToString() ?? "",
                tograde = reader["to_grade"]?.ToString() ?? "",
                toclassid = reader["to_class_id"]?.ToString() ?? "",
                toclassname = reader["to_class_name"]?.ToString() ?? "",
                academicyearfrom = reader["academic_year_from"]?.ToString() ?? "",
                academicyearto = reader["academic_year_to"]?.ToString() ?? "",
                finalpercentage = reader["final_percentage"] == DBNull.Value ? null : Convert.ToDecimal(reader["final_percentage"]),
                gpa = reader["gpa"] == DBNull.Value ? null : Convert.ToDecimal(reader["gpa"]),
                promotiontype = reader["promotion_type"]?.ToString() ?? "promoted",
                promotiondate = reader["promotion_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["promotion_date"]),
                promotedby = reader["promoted_by"]?.ToString() ?? "",
                notes = reader["notes"]?.ToString() ?? "",
                isactive = reader["is_active"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? ""
            };
        }
    }
}
