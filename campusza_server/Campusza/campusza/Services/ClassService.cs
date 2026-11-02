using Campusza.Models.Campusza;
using Campusza.Models;
using Campusza.Utils;
using Npgsql;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    public class ClassService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public ClassService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Class>> Select(ClassSelectReq req)
        {
            List<Class> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Class>> SelectTransaction(IDb db, ClassSelectReq req)
        {
            List<Class> result = new List<Class>();
            var queryBuilder = querybuilderprovider.GetQueryBuilder(ClassSelectQuery(includeSchoolRoomId: true));
            ApplyClassSelectFilters(queryBuilder, req);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            try
            {
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                        result.Add(MapClassFromReader(reader));
                }
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedColumn
                && ex.MessageText.Contains("school_room_id", StringComparison.OrdinalIgnoreCase))
            {
                queryBuilder = querybuilderprovider.GetQueryBuilder(ClassSelectQuery(includeSchoolRoomId: false));
                ApplyClassSelectFilters(queryBuilder, req);
                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");
                command = queryBuilder.GetCommand(db);
                using DbDataReader reader = await db.Execute(command);
                while (await reader.ReadAsync())
                    result.Add(MapClassFromReader(reader, includeSchoolRoomId: false));
            }
            return result;
        }

        private const string ClassSelectCore = @"
                SELECT 
                    id, name, grade, section, academic_year, term_id, capacity, current_enrollment,
                    room, {0} class_teacher_id, class_teacher_name, assistant_mentor_id, assistant_mentor_name,
                    subjects, schedule, status,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                FROM classes
            ";

        private static string ClassSelectQuery(bool includeSchoolRoomId) =>
            string.Format(ClassSelectCore, includeSchoolRoomId ? "school_room_id," : "");

        private void ApplyClassSelectFilters(IQueryBuilder queryBuilder, ClassSelectReq req)
        {
            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.organizationid))
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            if (!string.IsNullOrEmpty(req.academicyear))
                queryBuilder.AddParameter("academic_year", "=", "academic_year", req.academicyear, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.termid))
                queryBuilder.AddParameter("term_id", "=", "term_id", req.termid, DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.classteacherid))
                queryBuilder.AddParameter("class_teacher_id", "=", "class_teacher_id", req.classteacherid, DbTypes.Types.String);
            if (!string.IsNullOrEmpty(req.status))
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);
        }

        private static Class MapClassFromReader(DbDataReader reader, bool includeSchoolRoomId = true)
        {
            Class temp = new Class();
            temp.id = reader["id"]?.ToString() ?? "";
            temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
            temp.grade = reader["grade"] == DBNull.Value ? "" : reader["grade"].ToString();
            temp.section = reader["section"] == DBNull.Value ? "" : reader["section"].ToString();
            temp.academicyear = reader["academic_year"] == DBNull.Value ? "" : reader["academic_year"].ToString();
            temp.termid = reader["term_id"] == DBNull.Value ? "" : reader["term_id"].ToString();

            temp.capacity = reader["capacity"] == DBNull.Value ? 0 : Convert.ToInt32(reader["capacity"]);
            temp.currentenrollment = reader["current_enrollment"] == DBNull.Value ? 0 : Convert.ToInt32(reader["current_enrollment"]);
            temp.room = reader["room"] == DBNull.Value ? "" : reader["room"].ToString();
            temp.schoolroomid = includeSchoolRoomId ? ReadOptionalString(reader, "school_room_id") : temp.room;
            if (string.IsNullOrWhiteSpace(temp.schoolroomid))
                temp.schoolroomid = temp.room;
            temp.classteacherid = reader["class_teacher_id"] == DBNull.Value ? "" : reader["class_teacher_id"].ToString();
            temp.classteachername = reader["class_teacher_name"] == DBNull.Value ? "" : reader["class_teacher_name"].ToString();
            temp.assistantmentorid = reader["assistant_mentor_id"] == DBNull.Value ? "" : reader["assistant_mentor_id"].ToString();
            temp.assistantmentorname = reader["assistant_mentor_name"] == DBNull.Value ? "" : reader["assistant_mentor_name"].ToString();
            temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();

            temp.subjects_json = reader["subjects"] == DBNull.Value ? "[]" : reader["subjects"].ToString();
            temp.schedule_json = reader["schedule"] == DBNull.Value ? "[]" : reader["schedule"].ToString();
            temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
            temp.isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]);
            temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
            temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
            temp.createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString();
            temp.updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString();
            return temp;
        }

        public async Task<List<Class>> GetAssignedToStaff(ClassAssignedToStaffReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString();
            var staffId = req.staffid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) || string.IsNullOrWhiteSpace(staffId))
                return new List<Class>();

            var all = await Select(new ClassSelectReq { organizationid = orgId });
            return all
                .Where(c =>
                    string.Equals(c.classteacherid, staffId, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(c.assistantmentorid, staffId, StringComparison.OrdinalIgnoreCase))
                .OrderBy(c => c.name ?? "", StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public async Task<Class> Insert(Class classObj)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, classObj);
            }
            return classObj;
        }

        /// <summary>
        /// Applies the same name/term defaults as insert, then returns an existing class id if
        /// (organization_id, name, academic_year) already exists (matches DB unique constraint).
        /// </summary>
        public async Task<string?> FindExistingClassIdAfterDefaults(Class classObj)
        {
            if (string.IsNullOrWhiteSpace(classObj.organizationid))
                return null;

            ApplyInsertNameEnrollmentStatus(classObj);

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await EnsureTermDefaults(db, classObj);
                return await FindExistingClassIdByUniqueKeyTransaction(db, classObj);
            }
        }

        public async Task InsertTransaction(IDb db, Class classObj)
        {
            string query = @"
                INSERT INTO classes (
                    id, name, grade, section, academic_year, term_id, capacity, current_enrollment,
                    room, school_room_id, class_teacher_id, class_teacher_name, assistant_mentor_id, assistant_mentor_name,
                    subjects, schedule, status,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @id, @name, @grade, @section, @academic_year, @term_id, @capacity, @current_enrollment,
                    @room, @school_room_id, @class_teacher_id, @class_teacher_name, @assistant_mentor_id, @assistant_mentor_name,
                    @subjects, @schedule, @status,
                    @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                );
            ";

            if (string.IsNullOrWhiteSpace(classObj.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            ApplyInsertNameEnrollmentStatus(classObj);
            await EnsureTermDefaults(db, classObj);

            var duplicateId = await FindExistingClassIdByUniqueKeyTransaction(db, classObj);
            if (!string.IsNullOrWhiteSpace(duplicateId))
                throw new AppException(
                    AppException.ErrorCodes.BadRequest,
                    $"A class named \"{classObj.name}\" already exists for academic year {classObj.academicyear}. Use Save to update it, change the name/grade/section, or pick another year.");

            DateTime now = DateTime.UtcNow;
            classObj.id = string.IsNullOrWhiteSpace(classObj.id) ? Guid.NewGuid().ToString() : classObj.id;
            classObj.isactive = true;
            classObj.createdat = now;
            classObj.updatedat = now;
            classObj.createdby = ResolveActor();
            classObj.updatedby = classObj.createdby;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = classObj.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = classObj.name ?? "";
            db.AddParameter(command, "grade", DbTypes.Types.String).Value = classObj.grade ?? "";
            db.AddParameter(command, "section", DbTypes.Types.String).Value = classObj.section ?? "";
            db.AddParameter(command, "academic_year", DbTypes.Types.String).Value = classObj.academicyear ?? "";
            db.AddParameter(command, "term_id", DbTypes.Types.String).Value = classObj.termid ?? "";

            db.AddParameter(command, "capacity", DbTypes.Types.Integer).Value = classObj.capacity;
            db.AddParameter(command, "current_enrollment", DbTypes.Types.Integer).Value = classObj.currentenrollment;
            ApplySchoolRoomFields(classObj);
            await ApplyValidatedSchoolRoomTransaction(db, classObj);
            await SchoolRoomTenant.EnsureUniqueClassHomeroomTransaction(
                db,
                classObj.organizationid,
                classObj.id,
                classObj.schoolroomid ?? classObj.room,
                classObj.academicyear);
            db.AddParameter(command, "room", DbTypes.Types.String).Value = classObj.room ?? "";
            db.AddParameter(command, "school_room_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(classObj.schoolroomid) ? DBNull.Value : classObj.schoolroomid;
            db.AddParameter(command, "class_teacher_id", DbTypes.Types.String).Value = classObj.classteacherid ?? "";
            db.AddParameter(command, "class_teacher_name", DbTypes.Types.String).Value = classObj.classteachername ?? "";
            db.AddParameter(command, "assistant_mentor_id", DbTypes.Types.String).Value = classObj.assistantmentorid ?? "";
            db.AddParameter(command, "assistant_mentor_name", DbTypes.Types.String).Value = classObj.assistantmentorname ?? "";

            db.AddParameter(command, "subjects", DbTypes.Types.Json).Value = classObj.subjects_json ?? "[]";
            db.AddParameter(command, "schedule", DbTypes.Types.Json).Value = classObj.schedule_json ?? "[]";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = classObj.status ?? "";

            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = classObj.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = classObj.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = classObj.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = classObj.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = classObj.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = classObj.updatedby ?? "";

            await db.ExecuteNonQuery(command);
        }

        public async Task<Class> Update(Class classObj, bool reactivateDeleted = false)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, classObj, reactivateDeleted);
            }
            return classObj;
        }

        public async Task<bool> UpdateTransaction(IDb db, Class classObj, bool reactivateDeleted = false)
        {
            bool result = false;
            string activeSet = reactivateDeleted ? "is_active = @is_active," : "";
            string whereActive = reactivateDeleted ? "" : " AND is_active = true";
            string query = $@"
                UPDATE classes
                SET 
                    name = @name, grade = @grade, section = @section, academic_year = @academic_year, term_id = @term_id,
                    capacity = @capacity, current_enrollment = @current_enrollment,
                    room = @room, school_room_id = @school_room_id, class_teacher_id = @class_teacher_id, class_teacher_name = @class_teacher_name,
                    assistant_mentor_id = @assistant_mentor_id, assistant_mentor_name = @assistant_mentor_name, status = @status,
                    subjects = @subjects, schedule = @schedule,
                    organization_id = @organization_id,
                    {activeSet}
                    updated_by = @updated_by, updated_at = @updated_at
                WHERE id = @id{whereActive}
            ";

            var command = db.GetCommand(query);

            classObj.updatedat = DateTime.UtcNow;
            classObj.updatedby = ResolveActor();
            await EnsureTermDefaults(db, classObj);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = classObj.id ?? "";
            db.AddParameter(command, "name", DbTypes.Types.String).Value = classObj.name ?? "";
            db.AddParameter(command, "grade", DbTypes.Types.String).Value = classObj.grade ?? "";
            db.AddParameter(command, "section", DbTypes.Types.String).Value = classObj.section ?? "";
            db.AddParameter(command, "academic_year", DbTypes.Types.String).Value = classObj.academicyear ?? "";
            db.AddParameter(command, "term_id", DbTypes.Types.String).Value = classObj.termid ?? "";
            
            db.AddParameter(command, "capacity", DbTypes.Types.Integer).Value = classObj.capacity;
            db.AddParameter(command, "current_enrollment", DbTypes.Types.Integer).Value = classObj.currentenrollment;
            ApplySchoolRoomFields(classObj);
            await ApplyValidatedSchoolRoomTransaction(db, classObj);
            await SchoolRoomTenant.EnsureUniqueClassHomeroomTransaction(
                db,
                classObj.organizationid,
                classObj.id,
                classObj.schoolroomid ?? classObj.room,
                classObj.academicyear);
            db.AddParameter(command, "room", DbTypes.Types.String).Value = classObj.room ?? "";
            db.AddParameter(command, "school_room_id", DbTypes.Types.String).Value =
                string.IsNullOrWhiteSpace(classObj.schoolroomid) ? DBNull.Value : classObj.schoolroomid;
            db.AddParameter(command, "class_teacher_id", DbTypes.Types.String).Value = classObj.classteacherid ?? "";
            db.AddParameter(command, "class_teacher_name", DbTypes.Types.String).Value = classObj.classteachername ?? "";
            db.AddParameter(command, "assistant_mentor_id", DbTypes.Types.String).Value = classObj.assistantmentorid ?? "";
            db.AddParameter(command, "assistant_mentor_name", DbTypes.Types.String).Value = classObj.assistantmentorname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = classObj.status ?? "";
            
            db.AddParameter(command, "subjects", DbTypes.Types.Json).Value = classObj.subjects_json ?? "[]";
            db.AddParameter(command, "schedule", DbTypes.Types.Json).Value = classObj.schedule_json ?? "[]";
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = classObj.organizationid ?? "";
            if (reactivateDeleted)
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = classObj.isactive;

            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = classObj.updatedby ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = classObj.updatedat;

            if (await db.ExecuteNonQuery(command) > 0)
                result = true;
            return result;
        }

        private static void ApplyInsertNameEnrollmentStatus(Class classObj)
        {
            classObj.name = string.IsNullOrWhiteSpace(classObj.name)
                ? $"{classObj.grade}-{classObj.section}".Trim('-')
                : classObj.name;
            classObj.currentenrollment = classObj.currentenrollment < 0 ? 0 : classObj.currentenrollment;
            classObj.status = string.IsNullOrWhiteSpace(classObj.status) ? "active" : classObj.status;
        }

        private static async Task<string?> FindExistingClassIdByUniqueKeyTransaction(IDb db, Class classObj)
        {
            string sql = @"
                SELECT id FROM classes
                WHERE organization_id = @organization_id
                  AND name = @name
                  AND COALESCE(academic_year, '') = COALESCE(@academic_year, '')
                LIMIT 1";
            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = classObj.organizationid ?? "";
            db.AddParameter(cmd, "name", DbTypes.Types.String).Value = classObj.name ?? "";
            db.AddParameter(cmd, "academic_year", DbTypes.Types.String).Value = classObj.academicyear ?? "";
            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                    return reader["id"]?.ToString();
            }
            return null;
        }

        public async Task<bool> Delete(ClassDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, ClassDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE classes
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
                result = true;
            return result;
        }

        private async Task EnsureTermDefaults(IDb db, Class classObj)
        {
            if (!string.IsNullOrWhiteSpace(classObj.termid) && !string.IsNullOrWhiteSpace(classObj.academicyear))
                return;

            string query = @"
                SELECT id, academic_year
                FROM terms
                WHERE organization_id = @organization_id
                  AND is_active = true
                  AND status = 'active'
                ORDER BY start_date
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = classObj.organizationid ?? "";

            string? termId = null;
            string? academicYear = null;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    termId = reader["id"]?.ToString();
                    academicYear = reader["academic_year"]?.ToString();
                }
            }

            if (string.IsNullOrWhiteSpace(termId))
            {
                string fallbackQuery = @"
                    SELECT id, academic_year
                    FROM terms
                    WHERE organization_id = @organization_id
                      AND is_active = true
                    ORDER BY start_date
                    LIMIT 1;
                ";
                var fallbackCmd = db.GetCommand(fallbackQuery);
                db.AddParameter(fallbackCmd, "organization_id", DbTypes.Types.String).Value = classObj.organizationid ?? "";
                using (var reader = await db.Execute(fallbackCmd))
                {
                    if (await reader.ReadAsync())
                    {
                        termId = reader["id"]?.ToString();
                        academicYear = reader["academic_year"]?.ToString();
                    }
                }
            }

            if (string.IsNullOrWhiteSpace(termId))
            {
                DateTime startDate = DateTime.UtcNow.Date;
                DateTime endDate = startDate.AddMonths(6);
                string generatedAcademicYear = !string.IsNullOrWhiteSpace(classObj.academicyear)
                    ? classObj.academicyear
                    : $"{startDate.Year}-{(startDate.Year + 1) % 100:D2}";
                string newTermId = Guid.NewGuid().ToString();
                string actor = ResolveActor();

                string insertQuery = @"
                    INSERT INTO terms (
                        id, name, start_date, end_date, status, academic_year,
                        organization_id, description, is_active,
                        created_at, updated_at, created_by, updated_by
                    )
                    VALUES (
                        @id, @name, @start_date, @end_date, @status, @academic_year,
                        @organization_id, @description, @is_active,
                        @created_at, @updated_at, @created_by, @updated_by
                    );
                ";

                var insertCmd = db.GetCommand(insertQuery);
                db.AddParameter(insertCmd, "id", DbTypes.Types.String).Value = newTermId;
                db.AddParameter(insertCmd, "name", DbTypes.Types.String).Value = "Default Term";
                db.AddParameter(insertCmd, "start_date", DbTypes.Types.DateTime).Value = startDate;
                db.AddParameter(insertCmd, "end_date", DbTypes.Types.DateTime).Value = endDate;
                db.AddParameter(insertCmd, "status", DbTypes.Types.String).Value = "active";
                db.AddParameter(insertCmd, "academic_year", DbTypes.Types.String).Value = generatedAcademicYear;
                db.AddParameter(insertCmd, "organization_id", DbTypes.Types.String).Value = classObj.organizationid ?? "";
                db.AddParameter(insertCmd, "description", DbTypes.Types.String).Value = "Auto-created term";
                db.AddParameter(insertCmd, "is_active", DbTypes.Types.Boolean).Value = true;
                db.AddParameter(insertCmd, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(insertCmd, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(insertCmd, "created_by", DbTypes.Types.String).Value = actor;
                db.AddParameter(insertCmd, "updated_by", DbTypes.Types.String).Value = actor;

                await db.ExecuteNonQuery(insertCmd);

                termId = newTermId;
                academicYear = generatedAcademicYear;
            }

            if (string.IsNullOrWhiteSpace(classObj.termid))
                classObj.termid = termId ?? "";
            if (string.IsNullOrWhiteSpace(classObj.academicyear))
                classObj.academicyear = academicYear ?? "";

            if (string.IsNullOrWhiteSpace(classObj.termid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Term is required. Please create a term first.");
        }

        private static void ApplySchoolRoomFields(Class classObj)
        {
            if (string.IsNullOrWhiteSpace(classObj.schoolroomid) && !string.IsNullOrWhiteSpace(classObj.room))
                classObj.schoolroomid = classObj.room.Trim();
            if (!string.IsNullOrWhiteSpace(classObj.schoolroomid))
                classObj.room = classObj.schoolroomid;
        }

        private static async Task ApplyValidatedSchoolRoomTransaction(IDb db, Class classObj)
        {
            if (string.IsNullOrWhiteSpace(classObj.organizationid))
                return;
            if (string.IsNullOrWhiteSpace(classObj.schoolroomid) && string.IsNullOrWhiteSpace(classObj.room))
                return;

            try
            {
                var resolved = await SchoolRoomTenant.ResolveRoomIdTransaction(
                    db,
                    classObj.organizationid,
                    classObj.schoolroomid ?? classObj.room);
                if (string.IsNullOrWhiteSpace(resolved))
                    return;

                classObj.schoolroomid = resolved;
                classObj.room = resolved;
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable
                && ex.MessageText.Contains("school_rooms", StringComparison.OrdinalIgnoreCase))
            {
                ApplySchoolRoomFields(classObj);
            }
        }

        private static string ReadOptionalString(DbDataReader reader, string column)
        {
            try
            {
                int idx = reader.GetOrdinal(column);
                if (reader[idx] == DBNull.Value)
                    return "";
                return reader[idx]?.ToString() ?? "";
            }
            catch (IndexOutOfRangeException)
            {
                return "";
            }
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }
    }
}
