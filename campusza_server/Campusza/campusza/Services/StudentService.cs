using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class StudentService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        StudentUserService studentUserService;

        public StudentService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            StudentUserService studentUserService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.studentUserService = studentUserService;
        }

        public async Task<List<Student>> Select(StudentSelectReq req)
        {
            List<Student> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Student>> SelectTransaction(IDb db, StudentSelectReq req)
        {
            List<Student> result = new List<Student>();
            string query = @"
                SELECT 
                    id, student_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    parent_guardian_name, parent_guardian_relationship, parent_guardian_email, parent_guardian_phone, parent_guardian_occupation,
                    class_id, class_name, grade, section, roll_number, admission_date, current_academic_year,
                    current_semester_type, current_term_id, current_term_name, status,
                    photo_url, photo_asset_id, blood_group, medical_conditions,
                    emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by,
                    extended_profile
                FROM students
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            var orgFilter = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgFilter) && requeststate.usercontext?.organisationid > 0)
                orgFilter = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);

            if (!string.IsNullOrWhiteSpace(req.id))
            {
                if (long.TryParse(req.id, NumberStyles.Integer, CultureInfo.InvariantCulture, out var idLong))
                    queryBuilder.AddParameter("id", "=", "id", idLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(orgFilter))
            {
                if (long.TryParse(orgFilter, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orgLong))
                    queryBuilder.AddParameter("organization_id", "=", "organization_id", orgLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("organization_id", "=", "organization_id", orgFilter, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.classid))
            {
                if (long.TryParse(req.classid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var classLong))
                    queryBuilder.AddParameter("class_id", "=", "class_id", classLong, DbTypes.Types.Long);
                else
                    queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.status))
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
                    Student temp = new Student();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.studentid = reader["student_id"] == DBNull.Value ? "" : reader["student_id"].ToString();
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

                    temp.parentguardianname = reader["parent_guardian_name"] == DBNull.Value ? "" : reader["parent_guardian_name"].ToString();
                    temp.parentguardianrelationship = reader["parent_guardian_relationship"] == DBNull.Value ? "" : reader["parent_guardian_relationship"].ToString();
                    temp.parentguardianemail = reader["parent_guardian_email"] == DBNull.Value ? "" : reader["parent_guardian_email"].ToString();
                    temp.parentguardianphone = reader["parent_guardian_phone"] == DBNull.Value ? "" : reader["parent_guardian_phone"].ToString();
                    temp.parentguardianoccupation = reader["parent_guardian_occupation"] == DBNull.Value ? "" : reader["parent_guardian_occupation"].ToString();

                    temp.classid = reader["class_id"] == DBNull.Value ? "" : reader["class_id"].ToString();
                    temp.classname = reader["class_name"] == DBNull.Value ? "" : reader["class_name"].ToString();
                    temp.grade = reader["grade"] == DBNull.Value ? "" : reader["grade"].ToString();
                    temp.section = reader["section"] == DBNull.Value ? "" : reader["section"].ToString();
                    temp.rollnumber = reader["roll_number"] == DBNull.Value ? 0 : Convert.ToInt32(reader["roll_number"]);
                    temp.admissiondate = reader["admission_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["admission_date"]);
                    temp.currentacademicyear = reader["current_academic_year"] == DBNull.Value ? "" : reader["current_academic_year"].ToString();
                    temp.currentsemestertype = reader["current_semester_type"] == DBNull.Value ? "" : reader["current_semester_type"].ToString();
                    temp.currenttermid = reader["current_term_id"] == DBNull.Value ? "" : reader["current_term_id"].ToString();
                    temp.currenttermname = reader["current_term_name"] == DBNull.Value ? "" : reader["current_term_name"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();

                    temp.photourl = reader["photo_url"] == DBNull.Value ? "" : reader["photo_url"].ToString();
                    temp.photoassetid = reader["photo_asset_id"] == DBNull.Value ? "" : reader["photo_asset_id"].ToString();
                    temp.bloodgroup = reader["blood_group"] == DBNull.Value ? "" : reader["blood_group"].ToString();
                    temp.medicalconditions = reader["medical_conditions"] == DBNull.Value ? "" : reader["medical_conditions"].ToString();

                    temp.emergencycontactname = reader["emergency_contact_name"] == DBNull.Value ? "" : reader["emergency_contact_name"].ToString();
                    temp.emergencycontactrelationship = reader["emergency_contact_relationship"] == DBNull.Value ? "" : reader["emergency_contact_relationship"].ToString();
                    temp.emergencycontactphone = reader["emergency_contact_phone"] == DBNull.Value ? "" : reader["emergency_contact_phone"].ToString();

                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["is_active"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_active"]);
                    temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                    temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
                    temp.createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString();
                    temp.updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString();
                    temp.extendedprofile_json = reader["extended_profile"] == DBNull.Value ? "{}" : reader["extended_profile"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Student> Insert(Student student)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, student);
            }
            return student;
        }

        public async Task InsertTransaction(IDb db, Student student)
        {
            string query = @"
                INSERT INTO students (
                    id, student_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    parent_guardian_name, parent_guardian_relationship, parent_guardian_email, parent_guardian_phone, parent_guardian_occupation,
                    class_id, class_name, grade, section, roll_number, admission_date, current_academic_year,
                    current_semester_type, current_term_id, current_term_name, status,
                    photo_url, photo_asset_id, blood_group, medical_conditions,
                    emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by, extended_profile
                )
                VALUES (
                    @id, @student_id, @first_name, @last_name, @full_name, @email, @phone, @date_of_birth, @gender,
                    @address_street, @address_city, @address_state, @address_zip_code, @address_country,
                    @parent_guardian_name, @parent_guardian_relationship, @parent_guardian_email, @parent_guardian_phone, @parent_guardian_occupation,
                    @class_id, @class_name, @grade, @section, @roll_number, @admission_date, @current_academic_year,
                    @current_semester_type, @current_term_id, @current_term_name, @status,
                    @photo_url, @photo_asset_id, @blood_group, @medical_conditions,
                    @emergency_contact_name, @emergency_contact_relationship, @emergency_contact_phone,
                    @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by, @extended_profile
                )
                RETURNING id;
            ";

            if (string.IsNullOrWhiteSpace(student.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            DateTime now = DateTime.UtcNow;
            student.id = string.IsNullOrWhiteSpace(student.id) ? Guid.NewGuid().ToString() : student.id;
            student.isactive = true;
            student.createdat = now;
            student.updatedat = now;
            student.createdby = ResolveActor();
            student.updatedby = student.createdby;

            var resolvedPhotoAssetId = await OrganizationAssetReference.ResolvePhotoAssetIdAsync(
                db, student.organizationid, student.photoassetid);

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = student.id;
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = student.studentid ?? "";
            db.AddParameter(command, "first_name", DbTypes.Types.String).Value = student.firstname ?? "";
            db.AddParameter(command, "last_name", DbTypes.Types.String).Value = student.lastname ?? "";
            db.AddParameter(command, "full_name", DbTypes.Types.String).Value = student.fullname ?? "";
            db.AddParameter(command, "email", DbTypes.Types.String).Value = student.email ?? "";
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = student.phone ?? "";
            db.AddParameter(command, "date_of_birth", DbTypes.Types.Date).Value = student.dateofbirth.Date;
            db.AddParameter(command, "gender", DbTypes.Types.String).Value = student.gender ?? "";
            db.AddParameter(command, "address_street", DbTypes.Types.String).Value = student.addressstreet ?? "";
            db.AddParameter(command, "address_city", DbTypes.Types.String).Value = student.addresscity ?? "";
            db.AddParameter(command, "address_state", DbTypes.Types.String).Value = student.addressstate ?? "";
            db.AddParameter(command, "address_zip_code", DbTypes.Types.String).Value = student.addresszipcode ?? "";
            db.AddParameter(command, "address_country", DbTypes.Types.String).Value = student.addresscountry ?? "";
            db.AddParameter(command, "parent_guardian_name", DbTypes.Types.String).Value = student.parentguardianname ?? "";
            db.AddParameter(command, "parent_guardian_relationship", DbTypes.Types.String).Value = student.parentguardianrelationship ?? "";
            db.AddParameter(command, "parent_guardian_email", DbTypes.Types.String).Value = student.parentguardianemail ?? "";
            db.AddParameter(command, "parent_guardian_phone", DbTypes.Types.String).Value = student.parentguardianphone ?? "";
            db.AddParameter(command, "parent_guardian_occupation", DbTypes.Types.String).Value = student.parentguardianoccupation ?? "";
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(student.classid) ? DBNull.Value : student.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = student.classname ?? "";
            db.AddParameter(command, "grade", DbTypes.Types.String).Value = student.grade ?? "";
            db.AddParameter(command, "section", DbTypes.Types.String).Value = student.section ?? "";
            db.AddParameter(command, "roll_number", DbTypes.Types.Integer).Value = student.rollnumber;
            db.AddParameter(command, "admission_date", DbTypes.Types.Date).Value = student.admissiondate.Date;
            db.AddParameter(command, "current_academic_year", DbTypes.Types.String).Value = student.currentacademicyear ?? "";
            db.AddParameter(command, "current_semester_type", DbTypes.Types.String).Value = student.currentsemestertype ?? "";
            db.AddParameter(command, "current_term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(student.currenttermid) ? DBNull.Value : student.currenttermid;
            db.AddParameter(command, "current_term_name", DbTypes.Types.String).Value = student.currenttermname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = student.status ?? "";
            db.AddParameter(command, "photo_url", DbTypes.Types.String).Value = student.photourl ?? "";
            db.AddParameter(command, "photo_asset_id", DbTypes.Types.String).Value =
                OrganizationAssetReference.ToDbParameter(resolvedPhotoAssetId);
            db.AddParameter(command, "blood_group", DbTypes.Types.String).Value = student.bloodgroup ?? "";
            db.AddParameter(command, "medical_conditions", DbTypes.Types.String).Value = student.medicalconditions ?? "";
            db.AddParameter(command, "emergency_contact_name", DbTypes.Types.String).Value = student.emergencycontactname ?? "";
            db.AddParameter(command, "emergency_contact_relationship", DbTypes.Types.String).Value = student.emergencycontactrelationship ?? "";
            db.AddParameter(command, "emergency_contact_phone", DbTypes.Types.String).Value = student.emergencycontactphone ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = student.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = student.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = student.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = student.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = student.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = student.updatedby ?? "";
            db.AddParameter(command, "extended_profile", DbTypes.Types.Json).Value = string.IsNullOrWhiteSpace(student.extendedprofile_json) ? "{}" : student.extendedprofile_json;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    student.id = reader["id"]?.ToString() ?? "";
                }
            }
        }

        public async Task<Student> Update(Student student)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, student);
            }
            await studentUserService.SyncStudentLogin(student, ResolveActor());
            return student;
        }

        public async Task<bool> UpdateTransaction(IDb db, Student student)
        {
            bool result = false;
            string query = @"
                UPDATE students
                SET 
                    student_id = @student_id, first_name = @first_name, last_name = @last_name, full_name = @full_name,
                    email = @email, phone = @phone, date_of_birth = @date_of_birth, gender = @gender,
                    address_street = @address_street, address_city = @address_city, address_state = @address_state,
                    address_zip_code = @address_zip_code, address_country = @address_country,
                    parent_guardian_name = @parent_guardian_name, parent_guardian_relationship = @parent_guardian_relationship,
                    parent_guardian_email = @parent_guardian_email, parent_guardian_phone = @parent_guardian_phone,
                    parent_guardian_occupation = @parent_guardian_occupation,
                    class_id = @class_id, class_name = @class_name, grade = @grade, section = @section, roll_number = @roll_number,
                    admission_date = @admission_date, current_academic_year = @current_academic_year,
                    current_semester_type = @current_semester_type, current_term_id = @current_term_id, current_term_name = @current_term_name,
                    status = @status, photo_url = @photo_url, photo_asset_id = @photo_asset_id, blood_group = @blood_group, medical_conditions = @medical_conditions,
                    emergency_contact_name = @emergency_contact_name, emergency_contact_relationship = @emergency_contact_relationship,
                    emergency_contact_phone = @emergency_contact_phone,
                    organization_id = @organization_id, is_active = @is_active,
                    updated_at = @updated_at, updated_by = @updated_by,
                    extended_profile = @extended_profile
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            student.updatedat = DateTime.UtcNow;
            student.updatedby = ResolveActor();

            var resolvedPhotoAssetId = await OrganizationAssetReference.ResolvePhotoAssetIdAsync(
                db, student.organizationid, student.photoassetid);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = student.id ?? "";
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = student.studentid ?? "";
            db.AddParameter(command, "first_name", DbTypes.Types.String).Value = student.firstname ?? "";
            db.AddParameter(command, "last_name", DbTypes.Types.String).Value = student.lastname ?? "";
            db.AddParameter(command, "full_name", DbTypes.Types.String).Value = student.fullname ?? "";
            db.AddParameter(command, "email", DbTypes.Types.String).Value = student.email ?? "";
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = student.phone ?? "";
            db.AddParameter(command, "date_of_birth", DbTypes.Types.Date).Value = student.dateofbirth.Date;
            db.AddParameter(command, "gender", DbTypes.Types.String).Value = student.gender ?? "";
            db.AddParameter(command, "address_street", DbTypes.Types.String).Value = student.addressstreet ?? "";
            db.AddParameter(command, "address_city", DbTypes.Types.String).Value = student.addresscity ?? "";
            db.AddParameter(command, "address_state", DbTypes.Types.String).Value = student.addressstate ?? "";
            db.AddParameter(command, "address_zip_code", DbTypes.Types.String).Value = student.addresszipcode ?? "";
            db.AddParameter(command, "address_country", DbTypes.Types.String).Value = student.addresscountry ?? "";
            db.AddParameter(command, "parent_guardian_name", DbTypes.Types.String).Value = student.parentguardianname ?? "";
            db.AddParameter(command, "parent_guardian_relationship", DbTypes.Types.String).Value = student.parentguardianrelationship ?? "";
            db.AddParameter(command, "parent_guardian_email", DbTypes.Types.String).Value = student.parentguardianemail ?? "";
            db.AddParameter(command, "parent_guardian_phone", DbTypes.Types.String).Value = student.parentguardianphone ?? "";
            db.AddParameter(command, "parent_guardian_occupation", DbTypes.Types.String).Value = student.parentguardianoccupation ?? "";
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(student.classid) ? DBNull.Value : student.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = student.classname ?? "";
            db.AddParameter(command, "grade", DbTypes.Types.String).Value = student.grade ?? "";
            db.AddParameter(command, "section", DbTypes.Types.String).Value = student.section ?? "";
            db.AddParameter(command, "roll_number", DbTypes.Types.Integer).Value = student.rollnumber;
            db.AddParameter(command, "admission_date", DbTypes.Types.Date).Value = student.admissiondate.Date;
            db.AddParameter(command, "current_academic_year", DbTypes.Types.String).Value = student.currentacademicyear ?? "";
            db.AddParameter(command, "current_semester_type", DbTypes.Types.String).Value = student.currentsemestertype ?? "";
            db.AddParameter(command, "current_term_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(student.currenttermid) ? DBNull.Value : student.currenttermid;
            db.AddParameter(command, "current_term_name", DbTypes.Types.String).Value = student.currenttermname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = student.status ?? "";
            db.AddParameter(command, "photo_url", DbTypes.Types.String).Value = student.photourl ?? "";
            db.AddParameter(command, "photo_asset_id", DbTypes.Types.String).Value =
                OrganizationAssetReference.ToDbParameter(resolvedPhotoAssetId);
            db.AddParameter(command, "blood_group", DbTypes.Types.String).Value = student.bloodgroup ?? "";
            db.AddParameter(command, "medical_conditions", DbTypes.Types.String).Value = student.medicalconditions ?? "";
            db.AddParameter(command, "emergency_contact_name", DbTypes.Types.String).Value = student.emergencycontactname ?? "";
            db.AddParameter(command, "emergency_contact_relationship", DbTypes.Types.String).Value = student.emergencycontactrelationship ?? "";
            db.AddParameter(command, "emergency_contact_phone", DbTypes.Types.String).Value = student.emergencycontactphone ?? "";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = student.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = student.isactive;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = student.updatedat;
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = student.updatedby ?? "";
            db.AddParameter(command, "extended_profile", DbTypes.Types.Json).Value = string.IsNullOrWhiteSpace(student.extendedprofile_json) ? "{}" : student.extendedprofile_json;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(StudentDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, StudentDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE students
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
