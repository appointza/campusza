using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class ClassConfigurationService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public ClassConfigurationService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        // --- ClassFeeConfiguration ---
        public async Task<List<ClassFeeConfiguration>> SelectFeeConfig(ClassConfigurationSelectReq req)
        {
            List<ClassFeeConfiguration> result = new List<ClassFeeConfiguration>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    SELECT id, grade, class_id, class_name, semester_type, term_id, term_name,
                           fee_structures, total_amount, currency, due_date, payment_schedule, number_of_installments,
                           organization_id, is_active, created_at, updated_at, created_by, updated_by
                    FROM class_fee_configurations
                ";

                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (!string.IsNullOrWhiteSpace(req.id))
                    queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.organizationid))
                    queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.classid))
                    queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.termid))
                    queryBuilder.AddParameter("term_id", "=", "term_id", req.termid, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.grade))
                    queryBuilder.AddParameter("grade", "=", "grade", req.grade, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.semestertype))
                    queryBuilder.AddParameter("semester_type", "=", "semester_type", req.semestertype, DbTypes.Types.String);

                queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "grade");

                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        var temp = new ClassFeeConfiguration();
                        temp.id = reader["id"]?.ToString() ?? "";
                        temp.grade = reader["grade"]?.ToString() ?? "";
                        temp.classid = reader["class_id"]?.ToString() ?? "";
                        temp.classname = reader["class_name"]?.ToString() ?? "";
                        temp.semestertype = reader["semester_type"]?.ToString() ?? "";
                        temp.termid = reader["term_id"]?.ToString() ?? "";
                        temp.termname = reader["term_name"]?.ToString() ?? "";
                        temp.feestructures_json = reader["fee_structures"] == DBNull.Value ? "[]" : reader["fee_structures"].ToString();
                        temp.totalamount = reader["total_amount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["total_amount"]);
                        temp.currency = reader["currency"]?.ToString() ?? "";
                        temp.duedate = reader["due_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["due_date"]);
                        temp.paymentschedule = reader["payment_schedule"]?.ToString() ?? "";
                        temp.numberofinstallments = reader["number_of_installments"] == DBNull.Value ? 0 : Convert.ToInt32(reader["number_of_installments"]);
                        temp.organizationid = reader["organization_id"]?.ToString() ?? "";
                        temp.isactive = reader["is_active"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_active"]);
                        temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                        temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
                        temp.createdby = reader["created_by"]?.ToString() ?? "";
                        temp.updatedby = reader["updated_by"]?.ToString() ?? "";

                        result.Add(temp);
                    }
                }
            }
            return result;
        }

        public async Task<ClassFeeConfiguration> SaveFeeConfig(ClassFeeConfiguration config)
        {
            if (!string.IsNullOrWhiteSpace(config.id))
                return await UpdateFeeConfig(config);

            return await InsertFeeConfig(config);
        }

        public async Task<ClassFeeConfiguration> InsertFeeConfig(ClassFeeConfiguration config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    INSERT INTO class_fee_configurations (
                        id, grade, class_id, class_name, semester_type, term_id, term_name,
                        fee_structures, total_amount, currency, due_date, payment_schedule, number_of_installments,
                        organization_id, is_active, created_at, updated_at, created_by, updated_by
                    )
                    VALUES (
                        @id, @grade, @class_id, @class_name, @semester_type, @term_id, @term_name,
                        @fee_structures, @total_amount, @currency, @due_date, @payment_schedule, @number_of_installments,
                        @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                    );
                ";

                if (string.IsNullOrWhiteSpace(config.organizationid))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

                DateTime now = DateTime.UtcNow;
                config.id = string.IsNullOrWhiteSpace(config.id) ? Guid.NewGuid().ToString() : config.id;
                config.isactive = true;
                config.createdat = now;
                config.updatedat = now;
                config.createdby = ResolveActor();
                config.updatedby = config.createdby;

                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = config.id;
                db.AddParameter(command, "grade", DbTypes.Types.String).Value = config.grade ?? "";
                db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.classid) ? DBNull.Value : config.classid;
                db.AddParameter(command, "class_name", DbTypes.Types.String).Value = config.classname ?? "";
                db.AddParameter(command, "semester_type", DbTypes.Types.String).Value = config.semestertype ?? "";
                db.AddParameter(command, "term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.termid) ? DBNull.Value : config.termid;
                db.AddParameter(command, "term_name", DbTypes.Types.String).Value = config.termname ?? "";
                db.AddParameter(command, "fee_structures", DbTypes.Types.Json).Value = config.feestructures_json ?? "[]";
                db.AddParameter(command, "total_amount", DbTypes.Types.Decimal).Value = config.totalamount;
                db.AddParameter(command, "currency", DbTypes.Types.String).Value = config.currency ?? "USD";
                db.AddParameter(command, "due_date", DbTypes.Types.Date).Value = config.duedate.HasValue ? (object)config.duedate.Value.Date : DBNull.Value;
                db.AddParameter(command, "payment_schedule", DbTypes.Types.String).Value = config.paymentschedule ?? "one_time";
                db.AddParameter(command, "number_of_installments", DbTypes.Types.Integer).Value = config.numberofinstallments;
                db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = config.organizationid ?? "";
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = config.isactive;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = config.createdat;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = config.updatedat;
                db.AddParameter(command, "created_by", DbTypes.Types.String).Value = config.createdby ?? "";
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = config.updatedby ?? "";

                await db.ExecuteNonQuery(command);
            }
            return config;
        }

        public async Task<ClassFeeConfiguration> UpdateFeeConfig(ClassFeeConfiguration config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    UPDATE class_fee_configurations
                    SET grade = @grade, class_id = @class_id, class_name = @class_name,
                        semester_type = @semester_type, term_id = @term_id, term_name = @term_name,
                        fee_structures = @fee_structures, total_amount = @total_amount, currency = @currency,
                        due_date = @due_date, payment_schedule = @payment_schedule, number_of_installments = @number_of_installments,
                        organization_id = @organization_id, is_active = @is_active,
                        updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id
                ";

                config.updatedat = DateTime.UtcNow;
                config.updatedby = ResolveActor();

                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = config.id ?? "";
                db.AddParameter(command, "grade", DbTypes.Types.String).Value = config.grade ?? "";
                db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.classid) ? DBNull.Value : config.classid;
                db.AddParameter(command, "class_name", DbTypes.Types.String).Value = config.classname ?? "";
                db.AddParameter(command, "semester_type", DbTypes.Types.String).Value = config.semestertype ?? "";
                db.AddParameter(command, "term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.termid) ? DBNull.Value : config.termid;
                db.AddParameter(command, "term_name", DbTypes.Types.String).Value = config.termname ?? "";
                db.AddParameter(command, "fee_structures", DbTypes.Types.Json).Value = config.feestructures_json ?? "[]";
                db.AddParameter(command, "total_amount", DbTypes.Types.Decimal).Value = config.totalamount;
                db.AddParameter(command, "currency", DbTypes.Types.String).Value = config.currency ?? "USD";
                db.AddParameter(command, "due_date", DbTypes.Types.Date).Value = config.duedate.HasValue ? (object)config.duedate.Value.Date : DBNull.Value;
                db.AddParameter(command, "payment_schedule", DbTypes.Types.String).Value = config.paymentschedule ?? "one_time";
                db.AddParameter(command, "number_of_installments", DbTypes.Types.Integer).Value = config.numberofinstallments;
                db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = config.organizationid ?? "";
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = config.isactive;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = config.updatedat;
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = config.updatedby ?? "";

                await db.ExecuteNonQuery(command);
            }
            return config;
        }

        public async Task<bool> DeleteFeeConfig(ClassConfigurationDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    UPDATE class_fee_configurations
                    SET is_active = false, updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id
                ";
                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor();

                return await db.ExecuteNonQuery(command) > 0;
            }
        }

        // --- DocumentRequirement ---
        public async Task<List<DocumentRequirement>> SelectDocumentRequirement(ClassConfigurationSelectReq req)
        {
            List<DocumentRequirement> result = new List<DocumentRequirement>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    SELECT id, grade, class_id, class_name, semester_type, term_id, term_name,
                           document_type, action, is_required, required_at,
                           assigned_staff_id, assigned_staff_name, description, status,
                           organization_id, is_active, created_at, updated_at, created_by, updated_by
                    FROM document_requirements
                ";

                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (!string.IsNullOrWhiteSpace(req.id))
                    queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.organizationid))
                    queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.classid))
                    queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.termid))
                    queryBuilder.AddParameter("term_id", "=", "term_id", req.termid, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.grade))
                    queryBuilder.AddParameter("grade", "=", "grade", req.grade, DbTypes.Types.String);
                if (!string.IsNullOrWhiteSpace(req.semestertype))
                    queryBuilder.AddParameter("semester_type", "=", "semester_type", req.semestertype, DbTypes.Types.String);

                queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "grade");

                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        var temp = new DocumentRequirement();
                        temp.id = reader["id"]?.ToString() ?? "";
                        temp.grade = reader["grade"]?.ToString() ?? "";
                        temp.classid = reader["class_id"]?.ToString() ?? "";
                        temp.classname = reader["class_name"]?.ToString() ?? "";
                        temp.semestertype = reader["semester_type"]?.ToString() ?? "";
                        temp.termid = reader["term_id"]?.ToString() ?? "";
                        temp.termname = reader["term_name"]?.ToString() ?? "";
                        temp.documenttype = reader["document_type"]?.ToString() ?? "";
                        temp.action = reader["action"]?.ToString() ?? "";
                        temp.isrequired = reader["is_required"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_required"]);
                        temp.requiredat = reader["required_at"]?.ToString() ?? "";
                        temp.assignedstaffid = reader["assigned_staff_id"]?.ToString() ?? "";
                        temp.assignedstaffname = reader["assigned_staff_name"]?.ToString() ?? "";
                        temp.description = reader["description"]?.ToString() ?? "";
                        temp.status = reader["status"]?.ToString() ?? "pending";
                        temp.organizationid = reader["organization_id"]?.ToString() ?? "";
                        temp.isactive = reader["is_active"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_active"]);
                        temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                        temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
                        temp.createdby = reader["created_by"]?.ToString() ?? "";
                        temp.updatedby = reader["updated_by"]?.ToString() ?? "";

                        result.Add(temp);
                    }
                }
            }
            return result;
        }

        public async Task<DocumentRequirement> SaveDocumentRequirement(DocumentRequirement config)
        {
            if (!string.IsNullOrWhiteSpace(config.id))
                return await UpdateDocumentRequirement(config);

            return await InsertDocumentRequirement(config);
        }

        public async Task<DocumentRequirement> InsertDocumentRequirement(DocumentRequirement config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    INSERT INTO document_requirements (
                        id, grade, class_id, class_name, semester_type, term_id, term_name,
                        document_type, action, is_required, required_at, assigned_staff_id, assigned_staff_name, description,
                        organization_id, is_active, created_at, updated_at, created_by, updated_by
                    )
                    VALUES (
                        @id, @grade, @class_id, @class_name, @semester_type, @term_id, @term_name,
                        @document_type, @action, @is_required, @required_at, @assigned_staff_id, @assigned_staff_name, @description,
                        @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                    );
                ";

                if (string.IsNullOrWhiteSpace(config.organizationid))
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

                DateTime now = DateTime.UtcNow;
                config.id = string.IsNullOrWhiteSpace(config.id) ? Guid.NewGuid().ToString() : config.id;
                config.isactive = true;
                config.createdat = now;
                config.updatedat = now;
                config.createdby = ResolveActor();
                config.updatedby = config.createdby;

                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = config.id;
                db.AddParameter(command, "grade", DbTypes.Types.String).Value = config.grade ?? "";
                db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.classid) ? DBNull.Value : config.classid;
                db.AddParameter(command, "class_name", DbTypes.Types.String).Value = config.classname ?? "";
                db.AddParameter(command, "semester_type", DbTypes.Types.String).Value = config.semestertype ?? "";
                db.AddParameter(command, "term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.termid) ? DBNull.Value : config.termid;
                db.AddParameter(command, "term_name", DbTypes.Types.String).Value = config.termname ?? "";
                db.AddParameter(command, "document_type", DbTypes.Types.String).Value = config.documenttype ?? "";
                db.AddParameter(command, "action", DbTypes.Types.String).Value = config.action ?? "";
                db.AddParameter(command, "is_required", DbTypes.Types.Boolean).Value = config.isrequired;
                db.AddParameter(command, "required_at", DbTypes.Types.String).Value = config.requiredat ?? "";
                db.AddParameter(command, "assigned_staff_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.assignedstaffid) ? DBNull.Value : config.assignedstaffid;
                db.AddParameter(command, "assigned_staff_name", DbTypes.Types.String).Value = config.assignedstaffname ?? "";
                db.AddParameter(command, "description", DbTypes.Types.String).Value = config.description ?? "";
                db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = config.organizationid ?? "";
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = config.isactive;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = config.createdat;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = config.updatedat;
                db.AddParameter(command, "created_by", DbTypes.Types.String).Value = config.createdby ?? "";
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = config.updatedby ?? "";

                await db.ExecuteNonQuery(command);
            }
            return config;
        }

        public async Task<DocumentRequirement> UpdateDocumentRequirement(DocumentRequirement config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    UPDATE document_requirements
                    SET grade = @grade, class_id = @class_id, class_name = @class_name,
                        semester_type = @semester_type, term_id = @term_id, term_name = @term_name,
                        document_type = @document_type, action = @action, is_required = @is_required,
                        required_at = @required_at, assigned_staff_id = @assigned_staff_id,
                        assigned_staff_name = @assigned_staff_name, description = @description,
                        organization_id = @organization_id, is_active = @is_active,
                        updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id
                ";

                config.updatedat = DateTime.UtcNow;
                config.updatedby = ResolveActor();

                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = config.id ?? "";
                db.AddParameter(command, "grade", DbTypes.Types.String).Value = config.grade ?? "";
                db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.classid) ? DBNull.Value : config.classid;
                db.AddParameter(command, "class_name", DbTypes.Types.String).Value = config.classname ?? "";
                db.AddParameter(command, "semester_type", DbTypes.Types.String).Value = config.semestertype ?? "";
                db.AddParameter(command, "term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.termid) ? DBNull.Value : config.termid;
                db.AddParameter(command, "term_name", DbTypes.Types.String).Value = config.termname ?? "";
                db.AddParameter(command, "document_type", DbTypes.Types.String).Value = config.documenttype ?? "";
                db.AddParameter(command, "action", DbTypes.Types.String).Value = config.action ?? "";
                db.AddParameter(command, "is_required", DbTypes.Types.Boolean).Value = config.isrequired;
                db.AddParameter(command, "required_at", DbTypes.Types.String).Value = config.requiredat ?? "";
                db.AddParameter(command, "assigned_staff_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(config.assignedstaffid) ? DBNull.Value : config.assignedstaffid;
                db.AddParameter(command, "assigned_staff_name", DbTypes.Types.String).Value = config.assignedstaffname ?? "";
                db.AddParameter(command, "description", DbTypes.Types.String).Value = config.description ?? "";
                db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = config.organizationid ?? "";
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = config.isactive;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = config.updatedat;
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = config.updatedby ?? "";

                await db.ExecuteNonQuery(command);
            }
            return config;
        }

        public async Task<bool> DeleteDocumentRequirement(ClassConfigurationDeleteReq req)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    UPDATE document_requirements
                    SET is_active = false, updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id
                ";
                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor();

                return await db.ExecuteNonQuery(command) > 0;
            }
        }

        public async Task<bool> UpdateDocumentRequirementStatus(string id, string status)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    UPDATE document_requirements
                    SET status = @status, updated_at = @updated_at, updated_by = @updated_by
                    WHERE id = @id
                ";
                var command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.String).Value = id ?? "";
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status ?? "pending";
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor();

                return await db.ExecuteNonQuery(command) > 0;
            }
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }
    }
}
