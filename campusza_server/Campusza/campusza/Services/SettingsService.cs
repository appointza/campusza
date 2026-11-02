using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class SettingsService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public SettingsService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Settings>> Select(SettingsSelectReq req)
        {
            List<Settings> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Settings>> SelectTransaction(IDb db, SettingsSelectReq req)
        {
            List<Settings> result = new List<Settings>();
            string query = @"
                SELECT 
                    id, organisationid,
                    general, academic, notifications, appearance, security, integrations, features,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                FROM Settings
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

            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Settings temp = new Settings();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    
                    temp.general_json = reader["general"] == DBNull.Value ? "{}" : reader["general"].ToString();
                    temp.academic_json = reader["academic"] == DBNull.Value ? "{}" : reader["academic"].ToString();
                    temp.notifications_json = reader["notifications"] == DBNull.Value ? "{}" : reader["notifications"].ToString();
                    temp.appearance_json = reader["appearance"] == DBNull.Value ? "{}" : reader["appearance"].ToString();
                    temp.security_json = reader["security"] == DBNull.Value ? "{}" : reader["security"].ToString();
                    temp.integrations_json = reader["integrations"] == DBNull.Value ? "{}" : reader["integrations"].ToString();
                    temp.features_json = reader["features"] == DBNull.Value ? "{}" : reader["features"].ToString();
                    
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

        public async Task<Settings> Insert(Settings settings)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, settings);
            }
            return settings;
        }

        public async Task InsertTransaction(IDb db, Settings settings)
        {
            string query = @"
                INSERT INTO Settings (
                    organisationid,
                    general, academic, notifications, appearance, security, integrations, features,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                )
                VALUES (
                    @organisationid,
                    @general, @academic, @notifications, @appearance, @security, @integrations, @features,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes
                )
                RETURNING id;
            ";

            settings.isactive = true;
            settings.version = 1;
            settings.createdon = DateTime.UtcNow;
            settings.createdby = requeststate.usercontext.id;
            settings.modifiedon = DateTime.UtcNow;
            settings.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = settings.organisationid;
            
            db.AddParameter(command, "general", DbTypes.Types.Json).Value = settings.general_json ?? "{}";
            db.AddParameter(command, "academic", DbTypes.Types.Json).Value = settings.academic_json ?? "{}";
            db.AddParameter(command, "notifications", DbTypes.Types.Json).Value = settings.notifications_json ?? "{}";
            db.AddParameter(command, "appearance", DbTypes.Types.Json).Value = settings.appearance_json ?? "{}";
            db.AddParameter(command, "security", DbTypes.Types.Json).Value = settings.security_json ?? "{}";
            db.AddParameter(command, "integrations", DbTypes.Types.Json).Value = settings.integrations_json ?? "{}";
            db.AddParameter(command, "features", DbTypes.Types.Json).Value = settings.features_json ?? "{}";
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = settings.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = settings.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = settings.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = settings.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = settings.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = settings.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = settings.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = settings.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = settings.attributes_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    settings.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Settings> Update(Settings settings)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, settings);
            }
            return settings;
        }

        public async Task<bool> UpdateTransaction(IDb db, Settings settings)
        {
            bool result = false;
            string query = @"
                UPDATE Settings
                SET 
                    organisationid = @organisationid,
                    general = @general, academic = @academic, notifications = @notifications, 
                    appearance = @appearance, security = @security, integrations = @integrations, features = @features,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            settings.modifiedon = DateTime.UtcNow;
            settings.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = settings.id;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = settings.organisationid;
            
            db.AddParameter(command, "general", DbTypes.Types.Json).Value = settings.general_json ?? "{}";
            db.AddParameter(command, "academic", DbTypes.Types.Json).Value = settings.academic_json ?? "{}";
            db.AddParameter(command, "notifications", DbTypes.Types.Json).Value = settings.notifications_json ?? "{}";
            db.AddParameter(command, "appearance", DbTypes.Types.Json).Value = settings.appearance_json ?? "{}";
            db.AddParameter(command, "security", DbTypes.Types.Json).Value = settings.security_json ?? "{}";
            db.AddParameter(command, "integrations", DbTypes.Types.Json).Value = settings.integrations_json ?? "{}";
            db.AddParameter(command, "features", DbTypes.Types.Json).Value = settings.features_json ?? "{}";
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = settings.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = settings.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = settings.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = settings.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = settings.issuspended;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                settings.version = settings.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(SettingsDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, SettingsDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Settings
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
