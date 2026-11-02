using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class UserService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public UserService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<User>> Select(UserSelectReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await SelectTransaction(db, req);
            }
        }

        public async Task<List<User>> SelectTransaction(IDb db, UserSelectReq req)
        {
            List<User> result = new List<User>();

            string query = @"
                SELECT
                    id, email, username, passwordhash,
                    role, status, organizationid, profileid,
                    lastloginat, lastloginip,
                    emailverified, emailverifiedat, twofactorenabled,
                    version, createdby, createdon,
                    modifiedby, modifiedon,
                    isactive, issuspended, notes
                FROM UserAccount
            ";

            var qb = querybuilderprovider.GetQueryBuilder(query);

            if (req.id > 0)
                qb.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);

            if (req.organizationid > 0)
                qb.AddParameter("organizationid", "=", "organizationid", req.organizationid, DbTypes.Types.Long);

            if (!string.IsNullOrEmpty(req.email))
                qb.AddParameter("email", "=", "email", req.email, DbTypes.Types.String);

            if (!string.IsNullOrEmpty(req.role))
                qb.AddParameter("role", "=", "role", req.role, DbTypes.Types.String);

            if (!string.IsNullOrEmpty(req.status))
                qb.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);

            qb.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            qb.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = qb.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    User u = new User();

                    u.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    u.email = reader["email"]?.ToString();
                    u.username = reader["username"]?.ToString();
                    u.passwordhash = reader["passwordhash"]?.ToString();

                    u.role = reader["role"]?.ToString();
                    u.status = reader["status"]?.ToString();
                    u.organizationid = reader["organizationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organizationid"]);
                    u.profileid = reader["profileid"]?.ToString();

                    u.lastloginat = reader["lastloginat"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(reader["lastloginat"]);
                    u.lastloginip = reader["lastloginip"]?.ToString();

                    u.emailverified = reader["emailverified"] != DBNull.Value && Convert.ToBoolean(reader["emailverified"]);
                    u.emailverifiedat = reader["emailverifiedat"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(reader["emailverifiedat"]);
                    u.twofactorenabled = reader["twofactorenabled"] != DBNull.Value && Convert.ToBoolean(reader["twofactorenabled"]);

                    u.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    u.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    u.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    u.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    u.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);

                    u.isactive = reader["isactive"] != DBNull.Value && Convert.ToBoolean(reader["isactive"]);
                    u.issuspended = reader["issuspended"] != DBNull.Value && Convert.ToBoolean(reader["issuspended"]);
                    u.notes = reader["notes"]?.ToString();

                    result.Add(u);
                }
            }

            return result;
        }

        public async Task<User> Insert(User user)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, user);
            }
            return user;
        }

        public async Task InsertTransaction(IDb db, User user)
        {
            string query = @"
                INSERT INTO UserAccount (
                    email, username, passwordhash,
                    role, status, organizationid, profileid,
                    lastloginat, lastloginip,
                    emailverified, emailverifiedat, twofactorenabled,
                    version, createdby, createdon,
                    modifiedby, modifiedon,
                    isactive, issuspended, notes
                )
                VALUES (
                    @email, @username, @passwordhash,
                    @role, @status, @organizationid, @profileid,
                    @lastloginat, @lastloginip,
                    @emailverified, @emailverifiedat, @twofactorenabled,
                    @version, @createdby, @createdon,
                    @modifiedby, @modifiedon,
                    @isactive, @issuspended, @notes
                )
                RETURNING id;
            ";

            user.isactive = true;
            user.version = 1;
            user.createdon = DateTime.UtcNow;
            user.modifiedon = DateTime.UtcNow;
            user.createdby = requeststate.usercontext.id;
            user.modifiedby = requeststate.usercontext.id;

            var cmd = db.GetCommand(query);

            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = user.email ?? "";
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = user.username ?? "";
            db.AddParameter(cmd, "passwordhash", DbTypes.Types.String).Value = user.passwordhash ?? "";

            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = user.role ?? "";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = user.status ?? "";
            db.AddParameter(cmd, "organizationid", DbTypes.Types.Long).Value = user.organizationid;
            db.AddParameter(cmd, "profileid", DbTypes.Types.String).Value = user.profileid ?? "";

            db.AddParameter(cmd, "lastloginat", DbTypes.Types.DateTime).Value =
                user.lastloginat.HasValue ? user.lastloginat.Value : DBNull.Value;
            db.AddParameter(cmd, "lastloginip", DbTypes.Types.String).Value = user.lastloginip ?? "";

            db.AddParameter(cmd, "emailverified", DbTypes.Types.Boolean).Value = user.emailverified;
            db.AddParameter(cmd, "emailverifiedat", DbTypes.Types.DateTime).Value =
                user.emailverifiedat.HasValue ? user.emailverifiedat.Value : DBNull.Value;
            db.AddParameter(cmd, "twofactorenabled", DbTypes.Types.Boolean).Value = user.twofactorenabled;

            db.AddParameter(cmd, "version", DbTypes.Types.Integer).Value = user.version;
            db.AddParameter(cmd, "createdby", DbTypes.Types.Long).Value = user.createdby;
            db.AddParameter(cmd, "createdon", DbTypes.Types.DateTime).Value = user.createdon;
            db.AddParameter(cmd, "modifiedby", DbTypes.Types.Long).Value = user.modifiedby;
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = user.modifiedon;

            db.AddParameter(cmd, "isactive", DbTypes.Types.Boolean).Value = user.isactive;
            db.AddParameter(cmd, "issuspended", DbTypes.Types.Boolean).Value = user.issuspended;
            db.AddParameter(cmd, "notes", DbTypes.Types.String).Value = user.notes ?? "";

            using (DbDataReader reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                    user.id = Convert.ToInt64(reader["id"]);
            }
        }

        public async Task<User> Update(User user)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await UpdateTransaction(db, user);
            }
            return user;
        }

        public async Task<bool> UpdateTransaction(IDb db, User user)
        {
            string query = @"
                UPDATE UserAccount
                SET
                    email = @email,
                    username = @username,
                    passwordhash = @passwordhash,
                    role = @role,
                    status = @status,
                    organizationid = @organizationid,
                    profileid = @profileid,
                    lastloginat = @lastloginat,
                    lastloginip = @lastloginip,
                    emailverified = @emailverified,
                    emailverifiedat = @emailverifiedat,
                    twofactorenabled = @twofactorenabled,
                    modifiedby = @modifiedby,
                    modifiedon = @modifiedon,
                    notes = @notes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            user.modifiedon = DateTime.UtcNow;
            user.modifiedby = requeststate.usercontext.id;

            var cmd = db.GetCommand(query);

            db.AddParameter(cmd, "id", DbTypes.Types.Long).Value = user.id;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = user.email ?? "";
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = user.username ?? "";
            db.AddParameter(cmd, "passwordhash", DbTypes.Types.String).Value = user.passwordhash ?? "";
            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = user.role ?? "";
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = user.status ?? "";
            db.AddParameter(cmd, "organizationid", DbTypes.Types.Long).Value = user.organizationid;
            db.AddParameter(cmd, "profileid", DbTypes.Types.String).Value = user.profileid ?? "";

            db.AddParameter(cmd, "lastloginat", DbTypes.Types.DateTime).Value =
                user.lastloginat.HasValue ? user.lastloginat.Value : DBNull.Value;
            db.AddParameter(cmd, "lastloginip", DbTypes.Types.String).Value = user.lastloginip ?? "";

            db.AddParameter(cmd, "emailverified", DbTypes.Types.Boolean).Value = user.emailverified;
            db.AddParameter(cmd, "emailverifiedat", DbTypes.Types.DateTime).Value =
                user.emailverifiedat.HasValue ? user.emailverifiedat.Value : DBNull.Value;
            db.AddParameter(cmd, "twofactorenabled", DbTypes.Types.Boolean).Value = user.twofactorenabled;

            db.AddParameter(cmd, "modifiedby", DbTypes.Types.Long).Value = user.modifiedby;
            db.AddParameter(cmd, "modifiedon", DbTypes.Types.DateTime).Value = user.modifiedon;
            db.AddParameter(cmd, "notes", DbTypes.Types.String).Value = user.notes ?? "";
            db.AddParameter(cmd, "issuspended", DbTypes.Types.Boolean).Value = user.issuspended;

            if (await db.ExecuteNonQuery(cmd) > 0)
            {
                user.version += 1;
                return true;
            }

            return false;
        }

        public async Task<bool> Delete(UserDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await DeleteTransaction(db, req);
            }
        }

        public async Task<bool> DeleteTransaction(IDb db, UserDeleteReq req)
        {
            string query = @"
                UPDATE UserAccount
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
