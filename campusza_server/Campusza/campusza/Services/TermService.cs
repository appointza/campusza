using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class TermService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public TermService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Term>> Select(TermSelectReq req)
        {
            List<Term> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Term>> SelectTransaction(IDb db, TermSelectReq req)
        {
            List<Term> result = new List<Term>();
            string query = @"
                SELECT 
                    id, name, start_date, end_date, status, academic_year, description,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                FROM terms
                ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id))
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.organizationid))
            {
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.academicyear))
            {
                queryBuilder.AddParameter("academic_year", "=", "academic_year", req.academicyear, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "name");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Term temp = new Term();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.startdate = reader["start_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["start_date"]);
                    temp.enddate = reader["end_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["end_date"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.academicyear = reader["academic_year"] == DBNull.Value ? "" : reader["academic_year"].ToString();
                    temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();

                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["is_active"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_active"]);
                    temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                    temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
                    temp.createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString();
                    temp.updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Term> Insert(Term term)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, term);
            }
            return term;
        }

        public async Task InsertTransaction(IDb db, Term term)
        {
            string query = @"
                INSERT INTO terms (
                    id, name, start_date, end_date, status, academic_year, description,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @id, @name, @start_date, @end_date, @status, @academic_year, @description,
                    @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                );
            ";

            DateTime now = DateTime.UtcNow;
            term.id = string.IsNullOrWhiteSpace(term.id) ? Guid.NewGuid().ToString() : term.id;
            term.status = string.IsNullOrWhiteSpace(term.status) ? "active" : term.status;
            term.isactive = true;
            term.createdat = now;
            term.updatedat = now;
            term.createdby = ResolveActor();
            term.updatedby = term.createdby;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = term.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = term.name ?? "";
            db.AddParameter(command, "start_date", DbTypes.Types.DateTime).Value = term.startdate;
            db.AddParameter(command, "end_date", DbTypes.Types.DateTime).Value = term.enddate;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = term.status ?? "";
            db.AddParameter(command, "academic_year", DbTypes.Types.String).Value = term.academicyear ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = term.description ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = term.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = term.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = term.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = term.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = term.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = term.updatedby ?? "";

            await db.ExecuteNonQuery(command);
        }

        public async Task<Term> Update(Term term)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, term);
            }
            return term;
        }

        public async Task<bool> UpdateTransaction(IDb db, Term term)
        {
            bool result = false;
            string query = @"
                UPDATE terms
                SET 
                    name = @name,
                    start_date = @start_date,
                    end_date = @end_date,
                    status = @status,
                    academic_year = @academic_year,
                    description = @description,
                    organization_id = @organization_id,
                    updated_by = @updated_by,
                    updated_at = @updated_at
                WHERE id = @id AND is_active = true
            ";

            var command = db.GetCommand(query);

            term.updatedat = DateTime.UtcNow;
            term.updatedby = ResolveActor();

            db.AddParameter(command, "id", DbTypes.Types.String).Value = term.id ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = term.name ?? "";
            db.AddParameter(command, "start_date", DbTypes.Types.DateTime).Value = term.startdate;
            db.AddParameter(command, "end_date", DbTypes.Types.DateTime).Value = term.enddate;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = term.status ?? "";
            db.AddParameter(command, "academic_year", DbTypes.Types.String).Value = term.academicyear ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = term.description ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = term.organizationid ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = term.updatedby ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = term.updatedat;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(TermDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, TermDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE terms
                SET is_active = false,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor();
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }
    }
}
