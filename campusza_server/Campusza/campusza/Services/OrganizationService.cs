using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class OrganizationService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public OrganizationService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Organization>> Select(OrganizationSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<Organization>> SelectTransaction(IDb db, OrganizationSelectReq req)
        {
            List<Organization> result = new List<Organization>();

            string query = @"
                SELECT
                    id, name, slug, email, phone, type, status,
                    subscriptionplan, subscriptionstartdate, subscriptionenddate,
                    maxusers, maxstudents,
                    address, logourl, website, settings,
                    version, createdby, createdon, modifiedby, modifiedon,
                    isactive, issuspended, notes, attributes
                FROM Organization
            ";

            var qb = querybuilderprovider.GetQueryBuilder(query);

            if (req.id > 0)
                qb.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);

            if (!string.IsNullOrEmpty(req.slug))
                qb.AddParameter("slug", "=", "slug", req.slug, DbTypes.Types.String);

            if (!string.IsNullOrEmpty(req.status))
                qb.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);

            qb.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            qb.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = qb.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Organization o = new Organization();

                    o.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    o.name = reader["name"]?.ToString();
                    o.slug = reader["slug"]?.ToString();
                    o.email = reader["email"]?.ToString();
                    o.phone = reader["phone"]?.ToString();
                    o.type = reader["type"]?.ToString();
                    o.status = reader["status"]?.ToString();

                    o.subscriptionplan = reader["subscriptionplan"]?.ToString();
                    o.subscriptionstartdate = reader["subscriptionstartdate"] == DBNull.Value
                        ? DateTime.MinValue
                        : Convert.ToDateTime(reader["subscriptionstartdate"]);
                    o.subscriptionenddate = reader["subscriptionenddate"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(reader["subscriptionenddate"]);

                    o.maxusers = reader["maxusers"] == DBNull.Value ? 0 : Convert.ToInt32(reader["maxusers"]);
                    o.maxstudents = reader["maxstudents"] == DBNull.Value ? 0 : Convert.ToInt32(reader["maxstudents"]);

                    o.address_json = reader["address"] == DBNull.Value ? "null" : reader["address"].ToString();
                    o.logourl = reader["logourl"]?.ToString();
                    o.website = reader["website"]?.ToString();
                    o.settings_json = reader["settings"] == DBNull.Value ? "null" : reader["settings"].ToString();

                    o.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    o.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    o.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    o.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    o.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);

                    o.isactive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]);
                    o.issuspended = reader["issuspended"] != DBNull.Value && Convert.ToBoolean(reader["issuspended"]);
                    o.notes = reader["notes"]?.ToString();
                    o.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();

                    result.Add(o);
                }
            }
            return result;
        }

        public async Task<Organization> Insert(Organization org)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, org);
            }
            return org;
        }

        public async Task InsertTransaction(IDb db, Organization org)
        {
            string query = @"
                INSERT INTO Organization (
                    name, slug, email, phone, type, status,
                    subscriptionplan, subscriptionstartdate, subscriptionenddate,
                    maxusers, maxstudents,
                    address, logourl, website, settings,
                    version, createdby, createdon, modifiedby, modifiedon,
                    isactive, issuspended, notes, attributes
                )
                VALUES (
                    @name, @slug, @email, @phone, @type, @status,
                    @subscriptionplan, @subscriptionstartdate, @subscriptionenddate,
                    @maxusers, @maxstudents,
                    @address, @logourl, @website, @settings,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon,
                    @isactive, @issuspended, @notes, @attributes
                )
                RETURNING id;
            ";

            org.isactive = true;
            org.version = 1;
            org.createdon = DateTime.UtcNow;
            org.modifiedon = DateTime.UtcNow;
            org.createdby = requeststate.usercontext.id;
            org.modifiedby = requeststate.usercontext.id;

            var cmd = db.GetCommand(query);

            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = org.name ?? "";
            db.AddParameter(cmd, "slug", DbTypes.Types.String).Value = org.slug ?? "";
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = org.email ?? "";
            db.AddParameter(cmd, "phone", DbTypes.Types.String).Value = org.phone ?? "";
            db.AddParameter(cmd, "type", DbTypes.Types.String).Value = org.type ?? "";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = org.status ?? "";

            db.AddParameter(cmd, "subscriptionplan", DbTypes.Types.String).Value = org.subscriptionplan ?? "";
            db.AddParameter(cmd, "subscriptionstartdate", DbTypes.Types.DateTime).Value = org.subscriptionstartdate;
            db.AddParameter(cmd, "subscriptionenddate", DbTypes.Types.DateTime).Value =
                org.subscriptionenddate.HasValue ? org.subscriptionenddate.Value : DBNull.Value;

            db.AddParameter(cmd, "maxusers", DbTypes.Types.Integer).Value = org.maxusers;
            db.AddParameter(cmd, "maxstudents", DbTypes.Types.Integer).Value = org.maxstudents;

            db.AddParameter(cmd, "address", DbTypes.Types.Json).Value = org.address_json ?? "{}";
            db.AddParameter(cmd, "logourl", DbTypes.Types.String).Value = org.logourl ?? "";
            db.AddParameter(cmd, "website", DbTypes.Types.String).Value = org.website ?? "";
            db.AddParameter(cmd, "settings", DbTypes.Types.Json).Value = org.settings_json ?? "{}";

            db.AddParameter(cmd, "version", DbTypes.Types.Integer).Value = org.version;
            db.AddParameter(cmd, "createdby", DbTypes.Types.Long).Value = org.createdby;
            db.AddParameter(cmd, "createdon", DbTypes.Types.DateTime).Value = org.createdon;
            db.AddParameter(cmd, "modifiedby", DbTypes.Types.Long).Value = org.modifiedby;
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = org.modifiedon;

            db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = org.isactive;
            db.AddParameter(cmd, "issuspended", DbTypes.Types.Boolean).Value = org.issuspended;
            db.AddParameter(cmd, "notes", DbTypes.Types.String).Value = org.notes ?? "";
            db.AddParameter(cmd, "attributes", DbTypes.Types.Json).Value = org.attributes_json ?? "{}";

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                    org.id = Convert.ToInt64(reader["id"]);
            }
        }

        public async Task<Organization> Update(Organization org)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, org);
            }
            return org;
        }

        public async Task UpdateTransaction(IDb db, Organization org)
        {
            string query = @"
        UPDATE Organization
        SET
            name = @name,
            slug = @slug,
            email = @email,
            phone = @phone,
            type = @type,
            status = @status,
            subscriptionplan = @subscriptionplan,
            subscriptionstartdate = @subscriptionstartdate,
            subscriptionenddate = @subscriptionenddate,
            maxusers = @maxusers,
            maxstudents = @maxstudents,
            address = @address,
            logourl = @logourl,
            website = @website,
            settings = @settings,
            issuspended = @issuspended,
            notes = @notes,
            attributes = @attributes,
            version = version + 1,
            modifiedby = @modifiedby,
            modifiedon = @modifiedon
        WHERE id = @id
          AND isactive = true
    ";

            org.modifiedby = requeststate.usercontext.id;
            org.modifiedon = DateTime.UtcNow;

            var cmd = db.GetCommand(query);

            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = org.id;

            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = org.name ?? "";
            db.AddParameter(cmd, "slug", DbTypes.Types.String).Value = org.slug ?? "";
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = org.email ?? "";
            db.AddParameter(cmd, "phone", DbTypes.Types.String).Value = org.phone ?? "";
            db.AddParameter(cmd, "type", DbTypes.Types.String).Value = org.type ?? "";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = org.status ?? "";

            db.AddParameter(cmd, "subscriptionplan", DbTypes.Types.String).Value = org.subscriptionplan ?? "";
            db.AddParameter(cmd, "subscriptionstartdate", DbTypes.Types.DateTime).Value = org.subscriptionstartdate;
            db.AddParameter(cmd, "subscriptionenddate", DbTypes.Types.DateTime).Value =
                org.subscriptionenddate.HasValue ? org.subscriptionenddate.Value : DBNull.Value;

            db.AddParameter(cmd, "maxusers", DbTypes.Types.Integer).Value = org.maxusers;
            db.AddParameter(cmd, "maxstudents", DbTypes.Types.Integer).Value = org.maxstudents;

            db.AddParameter(cmd, "address", DbTypes.Types.Json).Value = org.address_json ?? "{}";
            db.AddParameter(cmd, "logourl", DbTypes.Types.String).Value = org.logourl ?? "";
            db.AddParameter(cmd, "website", DbTypes.Types.String).Value = org.website ?? "";
            db.AddParameter(cmd, "settings", DbTypes.Types.Json).Value = org.settings_json ?? "{}";

            db.AddParameter(cmd, "issuspended", DbTypes.Types.Boolean).Value = org.issuspended;
            db.AddParameter(cmd, "notes", DbTypes.Types.String).Value = org.notes ?? "";
            db.AddParameter(cmd, "attributes", DbTypes.Types.Json).Value = org.attributes_json ?? "{}";

            db.AddParameter(cmd, "modifiedby", DbTypes.Types.Long).Value = org.modifiedby;
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = org.modifiedon;

            await db.ExecuteNonQuery(cmd);

            // reflect version increment in object
            org.version += 1;
        }


        public async Task<bool> Delete(OrganizationDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await DeleteTransaction(db, req);
            }
        }

        public async Task<bool> DeleteTransaction(IDb db, OrganizationDeleteReq req)
        {
            string query = @"
                UPDATE Organization
                SET isactive = '0',
                    version = version + 1,
                    modifiedby = @modifiedby,
                    modifiedon = @modifiedon
                WHERE id = @id
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(cmd, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            return await db.ExecuteNonQuery(cmd) > 0;
        }
    }
}
