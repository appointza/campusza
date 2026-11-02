using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ReferenceValueService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public ReferenceValueService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<ReferenceValue>> Select(ReferenceValueSelectReq req)
        {
            List<ReferenceValue> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<ReferenceValue>> SelectTransaction(IDb db, ReferenceValueSelectReq req)
        {
            List<ReferenceValue> result = new List<ReferenceValue>();
            string query = @"
                SELECT
                    id, category, code, name, short_name, description, value, display_order, parent_id,
                    metadata, is_system, is_default, status, organization_id, isfactory, is_active,
                    created_at, updated_at, created_by, updated_by
                FROM reference_values
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (!string.IsNullOrWhiteSpace(req.id) &&
                long.TryParse(req.id, NumberStyles.Integer, CultureInfo.InvariantCulture, out var idFilter))
                queryBuilder.AddParameter("id", "=", "id", idFilter, DbTypes.Types.Long);

            if (!string.IsNullOrWhiteSpace(req.category))
                queryBuilder.AddParameter("category", "=", "category", req.category, DbTypes.Types.String);

            if (!string.IsNullOrWhiteSpace(req.code))
                queryBuilder.AddParameter("code", "=", "code", req.code, DbTypes.Types.String);

            if (!string.IsNullOrWhiteSpace(req.status))
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);

            if (req.isdefault.HasValue)
                queryBuilder.AddParameter("is_default", "=", "is_default", req.isdefault.Value, DbTypes.Types.Boolean);

            var orgFromReq = req.organizationid;
            if (string.IsNullOrWhiteSpace(orgFromReq) && requeststate.usercontext?.organisationid > 0)
                orgFromReq = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(orgFromReq) &&
                long.TryParse(orgFromReq, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orgIdLong))
                queryBuilder.AddParameter("(organization_id = @organization_id OR organization_id IS NULL)", "organization_id", orgIdLong, DbTypes.Types.Long);

            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "display_order");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    ReferenceValue temp = new ReferenceValue();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.category = reader["category"] == DBNull.Value ? "" : reader["category"].ToString();
                    temp.code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString();
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.shortname = reader["short_name"] == DBNull.Value ? "" : reader["short_name"].ToString();
                    temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();
                    temp.value = reader["value"] == DBNull.Value ? "" : reader["value"].ToString();
                    temp.displayorder = reader["display_order"] == DBNull.Value ? 0 : Convert.ToInt32(reader["display_order"]);
                    temp.parentid = reader["parent_id"] == DBNull.Value ? "" : reader["parent_id"].ToString();
                    temp.metadata_json = reader["metadata"] == DBNull.Value ? "{}" : reader["metadata"].ToString();
                    temp.issystem = reader["is_system"] != DBNull.Value && Convert.ToBoolean(reader["is_system"]);
                    temp.isdefault = reader["is_default"] != DBNull.Value && Convert.ToBoolean(reader["is_default"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isfactory = reader["isfactory"] != DBNull.Value && Convert.ToBoolean(reader["isfactory"]);
                    temp.isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]);
                    temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                    temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
                    temp.createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString();
                    temp.updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<ReferenceValue> Insert(ReferenceValue value)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, value);
            }
            return value;
        }

        public async Task InsertTransaction(IDb db, ReferenceValue value)
        {
            if (string.IsNullOrWhiteSpace(value.category) || string.IsNullOrWhiteSpace(value.code) || string.IsNullOrWhiteSpace(value.name))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Category, code, and name are required.");

            value.category = NormalizeReferenceCategory(value.category);

            string query = @"
                INSERT INTO reference_values (
                    category, code, name, short_name, description, value, display_order, parent_id,
                    metadata, is_system, is_default, status, organization_id, isfactory, is_active,
                    created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @category, @code, @name, @short_name, @description, @value, @display_order, @parent_id,
                    @metadata, @is_system, @is_default, @status, @organization_id, @isfactory, @is_active,
                    @created_at, @updated_at, @created_by, @updated_by
                )
                RETURNING id;
            ";

            DateTime now = DateTime.UtcNow;
            value.displayorder = value.displayorder < 0 ? 0 : value.displayorder;
            value.status = string.IsNullOrWhiteSpace(value.status) ? "active" : value.status;
            value.isactive = true;
            value.issystem = false;
            value.createdat = now;
            value.updatedat = now;
            value.createdby = ResolveActor(value.createdby);
            value.updatedby = value.createdby;

            if (!value.issystem && string.IsNullOrWhiteSpace(value.organizationid) && requeststate.usercontext?.organisationid > 0)
                value.organizationid = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "category", DbTypes.Types.String).Value = value.category ?? "";
            db.AddParameter(command, "code", DbTypes.Types.String).Value = value.code ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = value.name ?? "";
            db.AddParameter(command, "short_name", DbTypes.Types.String).Value = value.shortname ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = value.description ?? "";
            db.AddParameter(command, "value", DbTypes.Types.String).Value = value.value ?? "";
            db.AddParameter(command, "display_order", DbTypes.Types.Integer).Value = value.displayorder;
            db.AddParameter(command, "parent_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(value.parentid) ? DBNull.Value : value.parentid;
            db.AddParameter(command, "metadata", DbTypes.Types.Json).Value = value.metadata_json ?? "{}";
            db.AddParameter(command, "is_system", DbTypes.Types.Boolean).Value = value.issystem;
            db.AddParameter(command, "is_default", DbTypes.Types.Boolean).Value = value.isdefault;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = value.status ?? "active";
            BindOrganizationId(db, command, value.organizationid);
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = value.isfactory;
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = value.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = value.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = value.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = value.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = value.updatedby ?? "";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    value.id = Convert.ToInt64(reader["id"]).ToString(CultureInfo.InvariantCulture);
                }
            }
        }

        public async Task<ReferenceValue> Update(ReferenceValue value)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, value);
            }
            return value;
        }

        public async Task<bool> UpdateTransaction(IDb db, ReferenceValue value)
        {
            if (string.IsNullOrWhiteSpace(value.id) ||
                !long.TryParse(value.id, NumberStyles.Integer, CultureInfo.InvariantCulture, out var idLong))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Reference value id is required.");

            await EnsureNotSystemLocked(db, idLong, "edited");

            value.issystem = false;
            value.category = NormalizeReferenceCategory(value.category);

            string query = @"
                UPDATE reference_values
                SET
                    category = @category,
                    code = @code,
                    name = @name,
                    short_name = @short_name,
                    description = @description,
                    value = @value,
                    display_order = @display_order,
                    parent_id = @parent_id,
                    metadata = @metadata,
                    is_system = @is_system,
                    is_default = @is_default,
                    status = @status,
                    organization_id = @organization_id,
                    isfactory = @isfactory,
                    is_active = @is_active,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id
            ";

            value.updatedat = DateTime.UtcNow;
            value.updatedby = ResolveActor(value.updatedby);

            if (!value.issystem && string.IsNullOrWhiteSpace(value.organizationid) && requeststate.usercontext?.organisationid > 0)
                value.organizationid = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = idLong;
            db.AddParameter(command, "category", DbTypes.Types.String).Value = value.category ?? "";
            db.AddParameter(command, "code", DbTypes.Types.String).Value = value.code ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = value.name ?? "";
            db.AddParameter(command, "short_name", DbTypes.Types.String).Value = value.shortname ?? "";
            db.AddParameter(command, "description", DbTypes.Types.String).Value = value.description ?? "";
            db.AddParameter(command, "value", DbTypes.Types.String).Value = value.value ?? "";
            db.AddParameter(command, "display_order", DbTypes.Types.Integer).Value = value.displayorder;
            db.AddParameter(command, "parent_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(value.parentid) ? DBNull.Value : value.parentid;
            db.AddParameter(command, "metadata", DbTypes.Types.Json).Value = value.metadata_json ?? "{}";
            db.AddParameter(command, "is_system", DbTypes.Types.Boolean).Value = value.issystem;
            db.AddParameter(command, "is_default", DbTypes.Types.Boolean).Value = value.isdefault;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = value.status ?? "active";
            BindOrganizationId(db, command, value.organizationid);
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = value.isfactory;
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = value.isactive;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = value.updatedat;
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = value.updatedby ?? "";

            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<bool> Delete(ReferenceValueDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await DeleteTransaction(db, req);
            }
        }

        public async Task<bool> DeleteTransaction(IDb db, ReferenceValueDeleteReq req)
        {
            if (string.IsNullOrWhiteSpace(req.id) ||
                !long.TryParse(req.id, NumberStyles.Integer, CultureInfo.InvariantCulture, out var idLong))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Reference value id is required.");

            await EnsureNotSystemLocked(db, idLong, "deleted");

            string query = @"
                UPDATE reference_values
                SET is_active = false,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = idLong;
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor(req.updatedby);
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            return await db.ExecuteNonQuery(command) > 0;
        }

        private static async Task EnsureNotSystemLocked(IDb db, long id, string action)
        {
            DbCommand check = db.GetCommand("SELECT is_system FROM reference_values WHERE id = @id");
            db.AddParameter(check, "id", DbTypes.Types.Long).Value = id;
            using (DbDataReader reader = await db.Execute(check))
            {
                if (!await reader.ReadAsync())
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Reference value not found.");
                var isSystem = reader["is_system"] != DBNull.Value && Convert.ToBoolean(reader["is_system"]);
                if (isSystem)
                    throw new AppException(AppException.ErrorCodes.BadRequest, $"System reference values cannot be {action}.");
            }
        }

        private string ResolveActor(string fromClient = null)
        {
            if (!string.IsNullOrWhiteSpace(fromClient) &&
                !string.Equals(fromClient.Trim(), "system", StringComparison.OrdinalIgnoreCase) &&
                fromClient.Trim() != "-1")
                return fromClient.Trim();

            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }

        private static void BindOrganizationId(IDb db, DbCommand command, string organizationid)
        {
            var p = db.AddParameter(command, "organization_id", DbTypes.Types.Long);
            if (string.IsNullOrWhiteSpace(organizationid) ||
                !long.TryParse(organizationid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var oid))
                p.Value = DBNull.Value;
            else
                p.Value = oid;
        }

        /// <summary>Canonical snake_case category (e.g. TERM_STATUS → term_status).</summary>
        private static string NormalizeReferenceCategory(string category)
        {
            if (string.IsNullOrWhiteSpace(category)) return "";
            var s = category.Trim().ToLowerInvariant();
            s = s.Replace(' ', '_').Replace('-', '_');
            if (s == "termstatus")
                return "term_status";
            return s;
        }
    }
}
