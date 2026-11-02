using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class StaffService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        CustomCryptography cryptography;
        AuthenticationService authenticationService;

        public StaffService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            CustomCryptography cryptography,
            AuthenticationService authenticationService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.cryptography = cryptography;
            this.authenticationService = authenticationService;
        }

        public async Task<List<Staff>> Select(StaffSelectReq req)
        {
            List<Staff> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Staff>> SelectTransaction(IDb db, StaffSelectReq req)
        {
            List<Staff> result = new List<Staff>();
            string query = @"
                SELECT 
                    id, staff_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    department, role, subjects, qualification, experience, joining_date, status,
                    photo_url, photo_asset_id, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                    salary_amount, salary_currency, salary_payment_frequency,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                FROM staff
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
            if (!string.IsNullOrEmpty(req.department))
            {
                queryBuilder.AddParameter("department", "=", "department", req.department, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.role))
            {
                queryBuilder.AddParameter("role", "=", "role", req.role, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Staff temp = new Staff();
                    temp.id = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.staffid = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.firstname = reader["first_name"] == DBNull.Value ? "" : reader["first_name"].ToString();
                    temp.lastname = reader["last_name"] == DBNull.Value ? "" : reader["last_name"].ToString();
                    temp.fullname = reader["full_name"] == DBNull.Value ? "" : reader["full_name"].ToString();
                    temp.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    temp.phone = reader["phone"] == DBNull.Value ? "" : reader["phone"].ToString();
                    temp.dateofbirth = reader["date_of_birth"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["date_of_birth"]);
                    temp.gender = reader["gender"] == DBNull.Value ? "" : reader["gender"].ToString();
                    
                    temp.addressstreet = reader["address_street"] == DBNull.Value ? "" : reader["address_street"].ToString();
                    temp.addresscity = reader["address_city"] == DBNull.Value ? "" : reader["address_city"].ToString();
                    temp.addressstate = reader["address_state"] == DBNull.Value ? "" : reader["address_state"].ToString();
                    temp.addresszipcode = reader["address_zip_code"] == DBNull.Value ? "" : reader["address_zip_code"].ToString();
                    temp.addresscountry = reader["address_country"] == DBNull.Value ? "" : reader["address_country"].ToString();
                    
                    temp.department = reader["department"] == DBNull.Value ? "" : reader["department"].ToString();
                    temp.role = reader["role"] == DBNull.Value ? "" : reader["role"].ToString();
                    temp.subjects_json = reader["subjects"] == DBNull.Value ? "[]" : reader["subjects"].ToString();
                    temp.qualification = reader["qualification"] == DBNull.Value ? "" : reader["qualification"].ToString();
                    temp.experience = reader["experience"] == DBNull.Value ? 0 : Convert.ToInt32(reader["experience"]);
                    temp.joiningdate = reader["joining_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["joining_date"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    
                    temp.photourl = reader["photo_url"] == DBNull.Value ? "" : reader["photo_url"].ToString();
                    temp.photoassetid = reader["photo_asset_id"] == DBNull.Value ? "" : reader["photo_asset_id"].ToString();
                    temp.emergencycontactname = reader["emergency_contact_name"] == DBNull.Value ? "" : reader["emergency_contact_name"].ToString();
                    temp.emergencycontactrelationship = reader["emergency_contact_relationship"] == DBNull.Value ? "" : reader["emergency_contact_relationship"].ToString();
                    temp.emergencycontactphone = reader["emergency_contact_phone"] == DBNull.Value ? "" : reader["emergency_contact_phone"].ToString();
                    
                    temp.salaryamount = reader["salary_amount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["salary_amount"]);
                    temp.salarycurrency = reader["salary_currency"] == DBNull.Value ? "" : reader["salary_currency"].ToString();
                    temp.salarypaymentfrequency = reader["salary_payment_frequency"] == DBNull.Value ? "" : reader["salary_payment_frequency"].ToString();
                    
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

        public async Task<Staff> Insert(Staff staff)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                try
                {
                    await this.InsertTransaction(db, staff);
                    await this.CreateUserForStaffTransaction(db, staff);
                    await db.CommitTransaction();
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return staff;
        }

        public async Task InsertTransaction(IDb db, Staff staff)
        {
            string query = @"
                INSERT INTO staff (
                    id, staff_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    department, role, subjects, qualification, experience, joining_date, status,
                    photo_url, photo_asset_id, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                    salary_amount, salary_currency, salary_payment_frequency,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @id, @staff_id, @first_name, @last_name, @full_name, @email, @phone, @date_of_birth, @gender,
                    @address_street, @address_city, @address_state, @address_zip_code, @address_country,
                    @department, @role, @subjects, @qualification, @experience, @joining_date, @status,
                    @photo_url, @photo_asset_id, @emergency_contact_name, @emergency_contact_relationship, @emergency_contact_phone,
                    @salary_amount, @salary_currency, @salary_payment_frequency,
                    @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                );
            ";

            if (string.IsNullOrWhiteSpace(staff.organizationid) && requeststate.usercontext?.organisationid > 0)
                staff.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(staff.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            DateTime now = DateTime.UtcNow;
            staff.staffid = string.IsNullOrWhiteSpace(staff.staffid) ? Guid.NewGuid().ToString() : staff.staffid;
            staff.staffid = string.IsNullOrWhiteSpace(staff.staffid) ? GenerateStaffId() : staff.staffid;
            staff.fullname = string.IsNullOrWhiteSpace(staff.fullname)
                ? $"{staff.firstname} {staff.lastname}".Trim()
                : staff.fullname;
            staff.joiningdate = staff.joiningdate == DateTime.MinValue ? now.Date : staff.joiningdate;
            staff.status = string.IsNullOrWhiteSpace(staff.status) ? "active" : staff.status;
            staff.isactive = true;
            staff.createdat = now;
            staff.updatedat = now;
            staff.createdby = ResolveActor();
            staff.updatedby = staff.createdby;
            staff.salarypaymentfrequency = string.IsNullOrWhiteSpace(staff.salarypaymentfrequency)
                ? "monthly"
                : staff.salarypaymentfrequency;

            var resolvedPhotoAssetId = await OrganizationAssetReference.ResolvePhotoAssetIdAsync(
                db, staff.organizationid, staff.photoassetid);

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = staff.staffid;
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = staff.staffid ?? "";
            db.AddParameter(command, "first_name", DbTypes.Types.String).Value = staff.firstname ?? "";
            db.AddParameter(command, "last_name", DbTypes.Types.String).Value = staff.lastname ?? "";
            db.AddParameter(command, "full_name", DbTypes.Types.String).Value = staff.fullname ?? "";
            db.AddParameter(command, "email", DbTypes.Types.String).Value = staff.email ?? "";
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = staff.phone ?? "";
            db.AddParameter(command, "date_of_birth", DbTypes.Types.DateTime).Value =
                staff.dateofbirth == DateTime.MinValue ? DBNull.Value : staff.dateofbirth;
            db.AddParameter(command, "gender", DbTypes.Types.String).Value = staff.gender ?? "";

            db.AddParameter(command, "address_street", DbTypes.Types.String).Value = staff.addressstreet ?? "";
            db.AddParameter(command, "address_city", DbTypes.Types.String).Value = staff.addresscity ?? "";
            db.AddParameter(command, "address_state", DbTypes.Types.String).Value = staff.addressstate ?? "";
            db.AddParameter(command, "address_zip_code", DbTypes.Types.String).Value = staff.addresszipcode ?? "";
            db.AddParameter(command, "address_country", DbTypes.Types.String).Value = staff.addresscountry ?? "";

            db.AddParameter(command, "department", DbTypes.Types.String).Value = staff.department ?? "";
            db.AddParameter(command, "role", DbTypes.Types.String).Value = staff.role ?? "";
            db.AddParameter(command, "subjects", DbTypes.Types.Json).Value = staff.subjects_json ?? "[]";
            db.AddParameter(command, "qualification", DbTypes.Types.String).Value = staff.qualification ?? "";
            db.AddParameter(command, "experience", DbTypes.Types.Integer).Value = staff.experience;
            db.AddParameter(command, "joining_date", DbTypes.Types.DateTime).Value = staff.joiningdate;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = staff.status ?? "";

            db.AddParameter(command, "photo_url", DbTypes.Types.String).Value = staff.photourl ?? "";
            db.AddParameter(command, "photo_asset_id", DbTypes.Types.String).Value =
                OrganizationAssetReference.ToDbParameter(resolvedPhotoAssetId);
            db.AddParameter(command, "emergency_contact_name", DbTypes.Types.String).Value = staff.emergencycontactname ?? "";
            db.AddParameter(command, "emergency_contact_relationship", DbTypes.Types.String).Value = staff.emergencycontactrelationship ?? "";
            db.AddParameter(command, "emergency_contact_phone", DbTypes.Types.String).Value = staff.emergencycontactphone ?? "";

            db.AddParameter(command, "salary_amount", DbTypes.Types.Decimal).Value = staff.salaryamount;
            db.AddParameter(command, "salary_currency", DbTypes.Types.String).Value = staff.salarycurrency ?? "";
            db.AddParameter(command, "salary_payment_frequency", DbTypes.Types.String).Value = staff.salarypaymentfrequency ?? "monthly";

            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = staff.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = staff.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = staff.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = staff.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = staff.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = staff.updatedby ?? "";

            await db.ExecuteNonQuery(command);
        }

        public async Task<Staff> Update(Staff staff)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                try
                {
                    var updated = await this.UpdateTransaction(db, staff);
                    if (updated)
                    {
                        await this.UpdateUserForStaffTransaction(db, staff);
                    }
                    await db.CommitTransaction();
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return staff;
        }

        public async Task<bool> UpdateTransaction(IDb db, Staff staff)
        {
            bool result = false;
            string query = @"
                UPDATE staff
                SET 
                    staff_id = @staff_id, first_name = @first_name, last_name = @last_name, full_name = @full_name,
                    email = @email, phone = @phone, date_of_birth = @date_of_birth, gender = @gender,
                    address_street = @address_street, address_city = @address_city, address_state = @address_state,
                    address_zip_code = @address_zip_code, address_country = @address_country,
                    department = @department, role = @role, subjects = @subjects, qualification = @qualification, experience = @experience,
                    joining_date = @joining_date, status = @status,
                    photo_url = @photo_url, photo_asset_id = @photo_asset_id,
                    emergency_contact_name = @emergency_contact_name,
                    emergency_contact_relationship = @emergency_contact_relationship,
                    emergency_contact_phone = @emergency_contact_phone,
                    salary_amount = @salary_amount, salary_currency = @salary_currency, salary_payment_frequency = @salary_payment_frequency,
                    organization_id = @organization_id,
                    updated_by = @updated_by, updated_at = @updated_at
                WHERE id = @id AND is_active = true
            ";

            var command = db.GetCommand(query);

            if (string.IsNullOrWhiteSpace(staff.organizationid) && requeststate.usercontext?.organisationid > 0)
                staff.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(staff.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            staff.updatedat = DateTime.UtcNow;
            staff.updatedby = ResolveActor();

            var resolvedPhotoAssetId = await OrganizationAssetReference.ResolvePhotoAssetIdAsync(
                db, staff.organizationid, staff.photoassetid);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = staff.staffid ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = staff.staffid ?? "";
            db.AddParameter(command, "first_name", DbTypes.Types.String).Value = staff.firstname ?? "";
            db.AddParameter(command, "last_name", DbTypes.Types.String).Value = staff.lastname ?? "";
            db.AddParameter(command, "full_name", DbTypes.Types.String).Value = staff.fullname ?? "";
            db.AddParameter(command, "email", DbTypes.Types.String).Value = staff.email ?? "";
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = staff.phone ?? "";
            db.AddParameter(command, "date_of_birth", DbTypes.Types.DateTime).Value =
                staff.dateofbirth == DateTime.MinValue ? DBNull.Value : staff.dateofbirth;
            db.AddParameter(command, "gender", DbTypes.Types.String).Value = staff.gender ?? "";
            
            db.AddParameter(command, "address_street", DbTypes.Types.String).Value = staff.addressstreet ?? "";
            db.AddParameter(command, "address_city", DbTypes.Types.String).Value = staff.addresscity ?? "";
            db.AddParameter(command, "address_state", DbTypes.Types.String).Value = staff.addressstate ?? "";
            db.AddParameter(command, "address_zip_code", DbTypes.Types.String).Value = staff.addresszipcode ?? "";
            db.AddParameter(command, "address_country", DbTypes.Types.String).Value = staff.addresscountry ?? "";

            db.AddParameter(command, "department", DbTypes.Types.String).Value = staff.department ?? "";
            db.AddParameter(command, "role", DbTypes.Types.String).Value = staff.role ?? "";
            db.AddParameter(command, "subjects", DbTypes.Types.Json).Value = staff.subjects_json ?? "[]";
            db.AddParameter(command, "qualification", DbTypes.Types.String).Value = staff.qualification ?? "";
            db.AddParameter(command, "experience", DbTypes.Types.Integer).Value = staff.experience;
            db.AddParameter(command, "joining_date", DbTypes.Types.DateTime).Value = staff.joiningdate;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = staff.status ?? "";
            
            db.AddParameter(command, "photo_url", DbTypes.Types.String).Value = staff.photourl ?? "";
            db.AddParameter(command, "photo_asset_id", DbTypes.Types.String).Value =
                OrganizationAssetReference.ToDbParameter(resolvedPhotoAssetId);
            db.AddParameter(command, "emergency_contact_name", DbTypes.Types.String).Value = staff.emergencycontactname ?? "";
            db.AddParameter(command, "emergency_contact_relationship", DbTypes.Types.String).Value = staff.emergencycontactrelationship ?? "";
            db.AddParameter(command, "emergency_contact_phone", DbTypes.Types.String).Value = staff.emergencycontactphone ?? "";
            
            db.AddParameter(command, "salary_amount", DbTypes.Types.Decimal).Value = staff.salaryamount;
            db.AddParameter(command, "salary_currency", DbTypes.Types.String).Value = staff.salarycurrency ?? "";
            db.AddParameter(command, "salary_payment_frequency", DbTypes.Types.String).Value = staff.salarypaymentfrequency ?? "";
            
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = staff.organizationid ?? "";
            
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = staff.updatedby ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = staff.updatedat;

            if (await db.ExecuteNonQuery(command) > 0)
                result = true;
            return result;
        }

        public async Task<bool> Delete(StaffDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, StaffDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE staff
                SET is_active = false,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id AND is_active = true
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

        private async Task CreateUserForStaffTransaction(IDb db, Staff staff)
        {
            if (string.IsNullOrWhiteSpace(staff.email))
                return;

            string email = staff.email.Trim();
            if (await UserExistsByEmail(db, email))
                return;

            string userId = Guid.NewGuid().ToString();
            string unusableSecret = AuthVerificationHelpers.GenerateUrlSafeToken(48);
            string username = BuildUsername(staff);
            string status = MapUserStatus(staff.status);

            string query = @"
                INSERT INTO users (
                    id, email, username, password_hash,
                    role, status, organization_id, profile_id,
                    last_login_at, last_login_ip,
                    email_verified, email_verified_at, two_factor_enabled,
                    password_setup_required,
                    is_active, created_at, updated_at, created_by
                )
                VALUES (
                    @id, @email, @username, @password_hash,
                    @role, @status, @organization_id, @profile_id,
                    @last_login_at, @last_login_ip,
                    @email_verified, @email_verified_at, @two_factor_enabled,
                    @password_setup_required,
                    @is_active, @created_at, @updated_at, @created_by
                );
            ";

            DateTime now = DateTime.UtcNow;
            var cmd = db.GetCommand(query);

            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = userId;
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = username;
            db.AddParameter(cmd, "password_hash", DbTypes.Types.String).Value = cryptography.CalculateSHA256Hash(unusableSecret);

            db.AddParameter(cmd, "role", DbTypes.Types.String).Value =
                StaffUserRoleMapper.MapStaffJobRoleToUserRole(staff.role);
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = staff.organizationid ?? "";
            db.AddParameter(cmd, "profile_id", DbTypes.Types.String).Value = staff.staffid ?? "";

            db.AddParameter(cmd, "last_login_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "last_login_ip", DbTypes.Types.String).Value = "";
            db.AddParameter(cmd, "email_verified", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(cmd, "email_verified_at", DbTypes.Types.DateTime).Value = DBNull.Value;
            db.AddParameter(cmd, "two_factor_enabled", DbTypes.Types.Boolean).Value = false;
            db.AddParameter(cmd, "password_setup_required", DbTypes.Types.Boolean).Value = true;

            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean).Value = true;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = ResolveActor();

            await db.ExecuteNonQuery(cmd);

            staff.generatedpassword = "";
            string displayName = string.IsNullOrWhiteSpace(staff.fullname)
                ? $"{staff.firstname} {staff.lastname}".Trim()
                : staff.fullname;
            await authenticationService.IssueInitialSetupForUserAsync(
                db,
                userId,
                email,
                staff.organizationid ?? "",
                displayName);
        }

        private async Task UpdateUserForStaffTransaction(IDb db, Staff staff)
        {
            if (string.IsNullOrWhiteSpace(staff.staffid) || string.IsNullOrWhiteSpace(staff.email))
                return;

            var currentUserRole = await GetUserRoleByProfileIdAsync(db, staff.staffid ?? "");
            var syncedRole = StaffUserRoleMapper.ResolveUserRoleForStaffSync(currentUserRole, staff.role);

            string query = @"
                UPDATE users
                SET email = @email,
                    username = @username,
                    role = @role,
                    status = @status,
                    organization_id = @organization_id,
                    updated_at = @updated_at
                WHERE profile_id = @profile_id
                  AND is_active = true
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = staff.email.Trim();
            db.AddParameter(cmd, "username", DbTypes.Types.String).Value = BuildUsername(staff);
            db.AddParameter(cmd, "role", DbTypes.Types.String).Value = syncedRole;
            db.AddParameter(cmd, "status", DbTypes.Types.String).Value = MapUserStatus(staff.status);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = staff.organizationid ?? "";
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(cmd, "profile_id", DbTypes.Types.String).Value = staff.staffid ?? "";

            await db.ExecuteNonQuery(cmd);
        }

        private static async Task<string?> GetUserRoleByProfileIdAsync(IDb db, string profileId)
        {
            if (string.IsNullOrWhiteSpace(profileId))
                return null;

            const string sql = @"
                SELECT role
                FROM users
                WHERE profile_id = @profile_id
                  AND is_active = true
                LIMIT 1";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "profile_id", DbTypes.Types.String).Value = profileId;

            using var reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return null;

            return reader["role"]?.ToString()?.Trim();
        }

        private static async Task<bool> UserExistsByEmail(IDb db, string email)
        {
            string query = @"SELECT 1 FROM users WHERE lower(email) = lower(@email) LIMIT 1";
            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;

            using (var reader = await db.Execute(cmd))
            {
                return await reader.ReadAsync();
            }
        }

        private static string MapUserStatus(string staffStatus)
        {
            string normalized = staffStatus?.Trim().ToLowerInvariant() ?? "";
            return normalized switch
            {
                "inactive" => "inactive",
                "suspended" => "suspended",
                _ => "active"
            };
        }

        private static string BuildUsername(Staff staff)
        {
            string first = (staff.firstname ?? "").Trim();
            string last = (staff.lastname ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(first) || !string.IsNullOrWhiteSpace(last))
            {
                string combined = $"{first}.{last}".Trim('.').Replace(" ", "").ToLowerInvariant();
                return string.IsNullOrWhiteSpace(combined) ? "staff" : combined;
            }

            if (!string.IsNullOrWhiteSpace(staff.email))
            {
                string email = staff.email.Trim().ToLowerInvariant();
                int atIndex = email.IndexOf("@", StringComparison.Ordinal);
                return atIndex > 0 ? email.Substring(0, atIndex) : email;
            }

            return "staff";
        }

        /// <summary>
        /// Resolves staff.staff_id for the current or requested staff member.
        /// Uses explicit id, JWT email, or request email hint (frontend session).
        /// </summary>
        public async Task<string> ResolveStaffIdAsync(string organizationId, string requestedStaffId = "", string emailHint = "")
        {
            var staffId = requestedStaffId?.Trim() ?? "";
            if (!string.IsNullOrWhiteSpace(staffId))
                return staffId;

            var orgId = organizationId?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            var email = requeststate.usercontext?.useremail?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(email))
                email = emailHint?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(email))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Staff record could not be resolved.");

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();

                var fromStaff = await LookupStaffIdByEmailAsync(db, orgId, email);
                if (!string.IsNullOrWhiteSpace(fromStaff))
                    return fromStaff;

                var fromProfile = await LookupStaffIdFromUserProfileAsync(db, orgId, email);
                if (!string.IsNullOrWhiteSpace(fromProfile))
                    return fromProfile;
            }

            throw new AppException(AppException.ErrorCodes.BadRequest, "Staff record could not be resolved.");
        }

        private static async Task<string?> LookupStaffIdByEmailAsync(IDb db, string organizationId, string email)
        {
            const string query = @"
                SELECT staff_id
                FROM staff
                WHERE lower(email) = lower(@email)
                  AND organization_id = @organization_id
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;

            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                var id = reader["staff_id"]?.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(id))
                    return id;
            }

            return null;
        }

        private static async Task<string?> LookupStaffIdFromUserProfileAsync(IDb db, string organizationId, string email)
        {
            const string query = @"
                SELECT u.profile_id
                FROM users u
                WHERE lower(u.email) = lower(@email)
                  AND u.organization_id = @organization_id
                  AND u.is_active = true
                  AND u.profile_id IS NOT NULL
                  AND trim(u.profile_id) <> ''
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId;

            using var reader = await db.Execute(cmd);
            if (await reader.ReadAsync())
            {
                var id = reader["profile_id"]?.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(id))
                    return id;
            }

            return null;
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }

        private string GenerateStaffId()
        {
            return $"STF-{DateTime.UtcNow:yyyyMMddHHmmss}";
        }
    }
}
