using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class CertificateService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public CertificateService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Certificate>> Select(CertificateSelectReq req)
        {
            List<Certificate> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Certificate>> SelectTransaction(IDb db, CertificateSelectReq req)
        {
            List<Certificate> result = new List<Certificate>();
            string query = @"
                SELECT 
                    id, certificateno, studentid, studentname, termid, termname, academicyear,
                    type, status, issueddate, issuedby, issuedbyname, validfrom, validuntil,
                    remarks, rejectionreason, fileurl, templateid,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                FROM Certificate
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
            if (req.studentid > 0)
            {
                queryBuilder.AddParameter("studentid", "=", "studentid", req.studentid, DbTypes.Types.Long);
            }
             if (!string.IsNullOrEmpty(req.type))
            {
                queryBuilder.AddParameter("type", "=", "type", req.type, DbTypes.Types.String);
            }
             if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
             if (!string.IsNullOrEmpty(req.certificateno))
            {
                queryBuilder.AddParameter("certificateno", "=", "certificateno", req.certificateno, DbTypes.Types.String);
            }

            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Certificate temp = new Certificate();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.certificateno = reader["certificateno"] == DBNull.Value ? "" : reader["certificateno"].ToString();
                    temp.studentid = reader["studentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["studentid"]);
                    temp.studentname = reader["studentname"] == DBNull.Value ? "" : reader["studentname"].ToString();
                    temp.termid = reader["termid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["termid"]);
                    temp.termname = reader["termname"] == DBNull.Value ? "" : reader["termname"].ToString();
                    temp.academicyear = reader["academicyear"] == DBNull.Value ? "" : reader["academicyear"].ToString();
                    
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.issueddate = reader["issueddate"] == DBNull.Value ? null : Convert.ToDateTime(reader["issueddate"]);
                    temp.issuedby = reader["issuedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["issuedby"]);
                    temp.issuedbyname = reader["issuedbyname"] == DBNull.Value ? "" : reader["issuedbyname"].ToString();
                    temp.validfrom = reader["validfrom"] == DBNull.Value ? null : Convert.ToDateTime(reader["validfrom"]);
                    temp.validuntil = reader["validuntil"] == DBNull.Value ? null : Convert.ToDateTime(reader["validuntil"]);
                    
                    temp.remarks = reader["remarks"] == DBNull.Value ? "" : reader["remarks"].ToString();
                    temp.rejectionreason = reader["rejectionreason"] == DBNull.Value ? "" : reader["rejectionreason"].ToString();
                    temp.fileurl = reader["fileurl"] == DBNull.Value ? "" : reader["fileurl"].ToString();
                    temp.templateid = reader["templateid"] == DBNull.Value ? "" : reader["templateid"].ToString();
                    
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

        public async Task<Certificate> Insert(Certificate certificate)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, certificate);
            }
            return certificate;
        }

        public async Task InsertTransaction(IDb db, Certificate certificate)
        {
            string query = @"
                INSERT INTO Certificate (
                    certificateno, studentid, studentname, termid, termname, academicyear,
                    type, status, issueddate, issuedby, issuedbyname, validfrom, validuntil,
                    remarks, rejectionreason, fileurl, templateid,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes
                )
                VALUES (
                    @certificateno, @studentid, @studentname, @termid, @termname, @academicyear,
                    @type, @status, @issueddate, @issuedby, @issuedbyname, @validfrom, @validuntil,
                    @remarks, @rejectionreason, @fileurl, @templateid,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes
                )
                RETURNING id;
            ";

            certificate.isactive = true;
            certificate.version = 1;
            certificate.createdon = DateTime.UtcNow;
            certificate.createdby = requeststate.usercontext.id;
            certificate.modifiedon = DateTime.UtcNow;
            certificate.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "certificateno", DbTypes.Types.String).Value = certificate.certificateno ?? "";
            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = certificate.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = certificate.studentname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = certificate.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = certificate.termname ?? "";
            db.AddParameter(command, "academicyear", DbTypes.Types.String).Value = certificate.academicyear ?? "";
            
            db.AddParameter(command, "type", DbTypes.Types.String).Value = certificate.type ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = certificate.status ?? "";
            db.AddParameter(command, "issueddate", DbTypes.Types.DateTime).Value = certificate.issueddate.HasValue ? (object)certificate.issueddate.Value : DBNull.Value;
            db.AddParameter(command, "issuedby", DbTypes.Types.Long).Value = certificate.issuedby;
            db.AddParameter(command, "issuedbyname", DbTypes.Types.String).Value = certificate.issuedbyname ?? "";
            db.AddParameter(command, "validfrom", DbTypes.Types.DateTime).Value = certificate.validfrom.HasValue ? (object)certificate.validfrom.Value : DBNull.Value;
            db.AddParameter(command, "validuntil", DbTypes.Types.DateTime).Value = certificate.validuntil.HasValue ? (object)certificate.validuntil.Value : DBNull.Value;
            
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = certificate.remarks ?? "";
            db.AddParameter(command, "rejectionreason", DbTypes.Types.String).Value = certificate.rejectionreason ?? "";
            db.AddParameter(command, "fileurl", DbTypes.Types.String).Value = certificate.fileurl ?? "";
            db.AddParameter(command, "templateid", DbTypes.Types.String).Value = certificate.templateid ?? "";
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = certificate.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = certificate.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = certificate.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = certificate.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = certificate.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = certificate.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = certificate.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = certificate.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = certificate.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = certificate.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = certificate.attributes_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    certificate.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Certificate> Update(Certificate certificate)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, certificate);
            }
            return certificate;
        }

        public async Task<bool> UpdateTransaction(IDb db, Certificate certificate)
        {
            bool result = false;
            string query = @"
                UPDATE Certificate
                SET 
                    certificateno = @certificateno, studentid = @studentid, studentname = @studentname, 
                    termid = @termid, termname = @termname, academicyear = @academicyear,
                    type = @type, status = @status,
                    issueddate = @issueddate, issuedby = @issuedby, issuedbyname = @issuedbyname, 
                    validfrom = @validfrom, validuntil = @validuntil,
                    remarks = @remarks, rejectionreason = @rejectionreason, fileurl = @fileurl, templateid = @templateid,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            certificate.modifiedon = DateTime.UtcNow;
            certificate.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = certificate.id;
            db.AddParameter(command, "certificateno", DbTypes.Types.String).Value = certificate.certificateno ?? "";
            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = certificate.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = certificate.studentname ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = certificate.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = certificate.termname ?? "";
            db.AddParameter(command, "academicyear", DbTypes.Types.String).Value = certificate.academicyear ?? "";
            
            db.AddParameter(command, "type", DbTypes.Types.String).Value = certificate.type ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = certificate.status ?? "";
            db.AddParameter(command, "issueddate", DbTypes.Types.DateTime).Value = certificate.issueddate.HasValue ? (object)certificate.issueddate.Value : DBNull.Value;
            db.AddParameter(command, "issuedby", DbTypes.Types.Long).Value = certificate.issuedby;
            db.AddParameter(command, "issuedbyname", DbTypes.Types.String).Value = certificate.issuedbyname ?? "";
            db.AddParameter(command, "validfrom", DbTypes.Types.DateTime).Value = certificate.validfrom.HasValue ? (object)certificate.validfrom.Value : DBNull.Value;
            db.AddParameter(command, "validuntil", DbTypes.Types.DateTime).Value = certificate.validuntil.HasValue ? (object)certificate.validuntil.Value : DBNull.Value;
            
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = certificate.remarks ?? "";
            db.AddParameter(command, "rejectionreason", DbTypes.Types.String).Value = certificate.rejectionreason ?? "";
            db.AddParameter(command, "fileurl", DbTypes.Types.String).Value = certificate.fileurl ?? "";
            db.AddParameter(command, "templateid", DbTypes.Types.String).Value = certificate.templateid ?? "";
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = certificate.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = certificate.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = certificate.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = certificate.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = certificate.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = certificate.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = certificate.issuspended;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                certificate.version = certificate.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(CertificateDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, CertificateDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE Certificate
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
