using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class DocumentRequirementStudentService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public DocumentRequirementStudentService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<DocumentRequirementStudent>> Select(DocumentRequirementStudentSelectReq req)
        {
            List<DocumentRequirementStudent> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<DocumentRequirementStudent>> SelectTransaction(IDb db, DocumentRequirementStudentSelectReq req)
        {
            List<DocumentRequirementStudent> result = new List<DocumentRequirementStudent>();
            string query = @"
                SELECT 
                    id, organization_id, document_requirement_id, student_id,
                    status, notes, is_active, created_at, updated_at, created_by, updated_by
                FROM document_requirement_students
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            
            // Auto-fill organization_id from user context if missing
            if (string.IsNullOrEmpty(req.organizationid) && requeststate?.usercontext != null)
            {
                req.organizationid = requeststate.usercontext.organisationid.ToString();
            }

            if (!string.IsNullOrEmpty(req.organizationid))
            {
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(req.documentrequirementid))
            {
                queryBuilder.AddParameter("document_requirement_id", "=", "document_requirement_id", req.documentrequirementid, DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(req.studentid))
            {
                queryBuilder.AddParameter("student_id", "=", "student_id", req.studentid, DbTypes.Types.String);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "student_id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var item = new DocumentRequirementStudent
                    {
                        id = reader["id"] == DBNull.Value ? "" : reader["id"].ToString(),
                        organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString(),
                        documentrequirementid = reader["document_requirement_id"] == DBNull.Value ? "" : reader["document_requirement_id"].ToString(),
                        studentid = reader["student_id"] == DBNull.Value ? "" : reader["student_id"].ToString(),
                        status = reader["status"] == DBNull.Value ? "pending" : reader["status"].ToString(),
                        notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString(),
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

        public async Task<DocumentRequirementStudent> Save(DocumentRequirementStudent item)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.SaveTransaction(db, item);
            }
            return item;
        }

        public async Task SaveTransaction(IDb db, DocumentRequirementStudent item)
        {
            if (string.IsNullOrEmpty(item.id))
            {
                item.id = Guid.NewGuid().ToString();
            }

            // Auto-fill from user context if missing
            if (string.IsNullOrEmpty(item.organizationid) && requeststate?.usercontext != null)
            {
                item.organizationid = requeststate.usercontext.organisationid.ToString();
            }
            if (string.IsNullOrEmpty(item.createdby) && requeststate?.usercontext != null)
            {
                item.createdby = requeststate.usercontext.userid.ToString();
            }
            if (string.IsNullOrEmpty(item.updatedby) && requeststate?.usercontext != null)
            {
                item.updatedby = requeststate.usercontext.userid.ToString();
            }

            item.updatedat = DateTime.UtcNow;
            if (item.createdat == DateTime.MinValue)
            {
                item.createdat = DateTime.UtcNow;
            }

            string query = @"
                INSERT INTO document_requirement_students 
                (id, organization_id, document_requirement_id, student_id, status, notes, is_active, created_at, updated_at, created_by, updated_by)
                VALUES 
                (@id, @organization_id, @document_requirement_id, @student_id, @status, @notes, @is_active, @created_at, @updated_at, @created_by, @updated_by)
                ON CONFLICT (organization_id, document_requirement_id, student_id)
                DO UPDATE SET
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes,
                    updated_at = EXCLUDED.updated_at,
                    updated_by = EXCLUDED.updated_by;
                ";

            var command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = item.id ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = item.organizationid ?? "";
            db.AddParameter(command, "document_requirement_id", DbTypes.Types.String).Value = item.documentrequirementid ?? "";
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = item.studentid ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = item.status ?? "pending";
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = item.notes ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = item.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = item.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = item.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = item.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = item.updatedby ?? "";

            await db.ExecuteNonQuery(command);
        }
    }
}
