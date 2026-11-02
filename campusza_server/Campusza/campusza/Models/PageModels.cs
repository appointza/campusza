namespace Campusza.Models.Campusza
{
    public class PageReq
    {
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        /// <summary>Logged-in user email when JWT user context is unavailable (staff resolution fallback).</summary>
        public string email { get; set; } = "";
        /// <summary>Optional date (yyyy-MM-dd) for date-wise effective timetable.</summary>
        public string date { get; set; } = "";
    }

    public class ReferenceValueItem
    {
        public string id { get; set; } = "";
        public string category { get; set; } = "";
        public string code { get; set; } = "";
        public string name { get; set; } = "";
        public int displayorder { get; set; }
        public string status { get; set; } = "";
    }

    // --- Staff Dashboard ---
    public class StaffDashboardPageRes
    {
        public long totalstudents { get; set; }
        public long classestoday { get; set; }
        public string attendancemarked { get; set; } = "0/0";
        public string nextclassin { get; set; } = "—";
        public List<StaffTodayClassItem> todayclasses { get; set; } = new();
    }

    public class StaffTodayClassItem
    {
        public string subject { get; set; } = "";
        public string classname { get; set; } = "";
        public string time { get; set; } = "";
        public string status { get; set; } = "";
    }

    // --- Staff Classes ---
    public class StaffClassesPageRes
    {
        public long totalstudents { get; set; }
        public long totalhours { get; set; }
        public List<StaffClassCardItem> classes { get; set; } = new();
    }

    public class StaffClassCardItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string subject { get; set; } = "";
        public int students { get; set; }
        public string room { get; set; } = "";
        public string schedule { get; set; } = "";
    }

    // --- Staff Students ---
    public class StaffStudentsPageRes
    {
        public string staffid { get; set; } = "";
        public List<StaffStudentRowItem> students { get; set; } = new();
        public List<StaffClassOptionItem> classes { get; set; } = new();
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
        public List<string> academicyears { get; set; } = new();
        public List<string> sections { get; set; } = new();
    }

    public class StaffStudentRowItem : StudentEnrollmentWithProfile
    {
        public string displayname { get; set; } = "";
    }

    public class StaffClassOptionItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public string academicyear { get; set; } = "";
    }

    // --- Staff Schedule ---
    public class StaffSchedulePageRes
    {
        public string date { get; set; } = "";
        public string todayday { get; set; } = "";
        public bool onleavetoday { get; set; }
        public string leavetype { get; set; } = "";
        public List<string> weekdays { get; set; } = new();
        public List<string> timeslots { get; set; } = new();
        public List<StaffScheduleGridCell> cells { get; set; } = new();
        public List<StaffScheduleTodayItem> todayitems { get; set; } = new();
    }

    public class StaffScheduleGridCell
    {
        public string scheduleid { get; set; } = "";
        public string day { get; set; } = "";
        public string timeslot { get; set; } = "";
        public string subject { get; set; } = "";
        public string classname { get; set; } = "";
        public string room { get; set; } = "";
        public string color { get; set; } = "primary";
        public bool istoday { get; set; }
        /// <summary>regular | on_leave | covered | substitute</summary>
        public string itemtype { get; set; } = "regular";
        public string replacementteachername { get; set; } = "";
        public string originalteachername { get; set; } = "";
        public string note { get; set; } = "";
    }

    public class StaffScheduleTodayItem
    {
        public string scheduleid { get; set; } = "";
        public string subject { get; set; } = "";
        public string classname { get; set; } = "";
        public string room { get; set; } = "";
        public string timeslot { get; set; } = "";
        public string time { get; set; } = "";
        public string color { get; set; } = "primary";
        /// <summary>regular | on_leave | covered | substitute</summary>
        public string itemtype { get; set; } = "regular";
        public string replacementteachername { get; set; } = "";
        public string originalteachername { get; set; } = "";
        public string leavetype { get; set; } = "";
        public string note { get; set; } = "";
        public string status { get; set; } = "";
        public int sortorder { get; set; }
    }

    // --- Student Timetable ---
    public class StudentTimetablePageReq
    {
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string date { get; set; } = "";
    }

    public class StudentTimetablePageRes
    {
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public string date { get; set; } = "";
        public string todayday { get; set; } = "";
        public List<string> weekdays { get; set; } = new();
        public List<string> timeslots { get; set; } = new();
        public List<StudentTimetableGridCell> cells { get; set; } = new();
        public List<StudentTimetableTodayItem> todayitems { get; set; } = new();
    }

    public class StudentTimetableGridCell
    {
        public string scheduleid { get; set; } = "";
        public string day { get; set; } = "";
        public string timeslot { get; set; } = "";
        public string time { get; set; } = "";
        public string subject { get; set; } = "";
        public string staffname { get; set; } = "";
        public string room { get; set; } = "";
        public bool istoday { get; set; }
        public string itemtype { get; set; } = "regular";
        public string replacementteachername { get; set; } = "";
        public string originalteachername { get; set; } = "";
        public string note { get; set; } = "";
    }

    public class StudentTimetableTodayItem
    {
        public string scheduleid { get; set; } = "";
        public string subject { get; set; } = "";
        public string staffname { get; set; } = "";
        public string room { get; set; } = "";
        public string timeslot { get; set; } = "";
        public string time { get; set; } = "";
        public string itemtype { get; set; } = "regular";
        public string replacementteachername { get; set; } = "";
        public string originalteachername { get; set; } = "";
        public string leavetype { get; set; } = "";
        public string note { get; set; } = "";
        public string status { get; set; } = "";
        public int sortorder { get; set; }
    }

    // --- Admin Students ---
    public class AdminStudentsPageRes
    {
        public List<AdminStudentRowItem> rows { get; set; } = new();
        public List<StaffClassOptionItem> classoptions { get; set; } = new();
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
    }

    public class AdminStudentRowItem
    {
        public string id { get; set; } = "";
        public string studentid { get; set; } = "";
        public string name { get; set; } = "";
        public string grade { get; set; } = "";
        public string email { get; set; } = "";
        public string phone { get; set; } = "";
        public string status { get; set; } = "";
        public string enrollmentid { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string classgrade { get; set; } = "";
        public string section { get; set; } = "";
        public string academicyear { get; set; } = "";
        public int? rollnumber { get; set; }
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string admissionnumber { get; set; } = "";
    }

    // --- Admin Staff ---
    public class AdminStaffPageRes
    {
        public List<AdminStaffRowItem> staff { get; set; } = new();
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
    }

    public class AdminStaffRowItem
    {
        public string id { get; set; } = "";
        public string staffid { get; set; } = "";
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string fullname { get; set; } = "";
        public string email { get; set; } = "";
        public string phone { get; set; } = "";
        public string role { get; set; } = "";
        public string rolename { get; set; } = "";
        public string department { get; set; } = "";
        public string departmentname { get; set; } = "";
        public string status { get; set; } = "";
        public string subjects { get; set; } = "";
    }

    // --- Admin Terms ---
    public class AdminTermsPageRes
    {
        public List<AdminTermRowItem> terms { get; set; } = new();
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
    }

    public class AdminTermRowItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string startdate { get; set; } = "";
        public string enddate { get; set; } = "";
        public string status { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string academicyearname { get; set; } = "";
        public string description { get; set; } = "";
    }

    // --- Admin Classes (list view) ---
    public class AdminClassesPageRes
    {
        public List<AdminClassRowItem> classes { get; set; } = new();
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
        public List<AdminStaffOptionItem> staffoptions { get; set; } = new();
        public List<AdminTermOptionItem> termoptions { get; set; } = new();
    }

    public class AdminClassRowItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string subject { get; set; } = "";
        public string teacher { get; set; } = "";
        public int students { get; set; }
        public string room { get; set; } = "";
        public string schedule { get; set; } = "";
        public string mentorid { get; set; } = "";
        public string mentorname { get; set; } = "";
        public string assistantmentorid { get; set; } = "";
        public string assistantmentorname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public int capacity { get; set; }
        public string academicyear { get; set; } = "";
        public string termid { get; set; } = "";
        public string status { get; set; } = "";
    }

    public class AdminStaffOptionItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
    }

    public class AdminTermOptionItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string academicyearname { get; set; } = "";
    }

    // --- Admin Settings ---
    public class OrganizationBrandingItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string slug { get; set; } = "";
        public string email { get; set; } = "";
        public string phone { get; set; } = "";
        public string addressstreet { get; set; } = "";
        public string addresscity { get; set; } = "";
        public string addressstate { get; set; } = "";
        public string addresszipcode { get; set; } = "";
        public string addresscountry { get; set; } = "";
        public string website { get; set; } = "";
        public string logourl { get; set; } = "";
        public string logoassetid { get; set; } = "";
        public string brandprimarycolor { get; set; } = "";
    }

    public class SaveOrganizationBrandingReq
    {
        public string organizationid { get; set; } = "";
        /// <summary>Admin session email for org scope validation.</summary>
        public string email { get; set; } = "";
        public string name { get; set; } = "";
        public string organizationemail { get; set; } = "";
        public string phone { get; set; } = "";
        public string addressstreet { get; set; } = "";
        public string addresscity { get; set; } = "";
        public string addressstate { get; set; } = "";
        public string addresszipcode { get; set; } = "";
        public string addresscountry { get; set; } = "";
        public string website { get; set; } = "";
        public string logoassetid { get; set; } = "";
        public string brandprimarycolor { get; set; } = "";
    }

    public class AdminSettingsPageRes
    {
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
        public Dictionary<string, int> categorycounts { get; set; } = new();
        public AdmissionNumberSettings admissionnumber { get; set; } = new();
        public OrganizationBrandingItem organization { get; set; } = new();
    }

    // --- Admin Onboarding ---
    public class AdminOnboardingPageRes
    {
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
        public List<AdminTermRowItem> terms { get; set; } = new();
        public bool iscomplete { get; set; }
        public int progresspercent { get; set; }
    }

    // --- Admin Exams ---
    public class AdminExamsPageRes
    {
        public List<AdminExamSeriesRowItem> series { get; set; } = new();
        public List<AdminTermOptionItem> termoptions { get; set; } = new();
        public List<AdminClassOptionItem> classoptions { get; set; } = new();
        public List<ReferenceValueItem> referencevalues { get; set; } = new();
        public AdminExamSchedulingPolicyItem schedulingpolicy { get; set; } = new();
    }

    public class AdminExamSchedulingPolicyItem
    {
        /// <summary>Latest allowed session end on half-days (HH:mm:ss), from org settings or default.</summary>
        public string halfdaylatestend { get; set; } = "12:00:00";
        public string halfdaypolicy { get; set; } = "";
    }

    public class AdminExamSeriesRowItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string termid { get; set; } = "";
        public string termname { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string startdate { get; set; } = "";
        public string enddate { get; set; } = "";
        public string status { get; set; } = "";
        public string examtypename { get; set; } = "";
        public int sessioncount { get; set; }
    }

    public class AdminClassOptionItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string grade { get; set; } = "";
        public string graderefid { get; set; } = "";
        public string section { get; set; } = "";
        public string termid { get; set; } = "";
    }

    // --- Student exam timetable ---
    public class StudentExamTimetablePageReq
    {
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
    }

    public class StudentExamTimetablePageRes
    {
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public List<StudentExamTimetableItem> exams { get; set; } = new();
    }

    public class StudentExamTimetableItem
    {
        public string sessionid { get; set; } = "";
        public string seriesid { get; set; } = "";
        public string seriesname { get; set; } = "";
        public string subjectid { get; set; } = "";
        public string subjectname { get; set; } = "";
        public string examdate { get; set; } = "";
        public string starttime { get; set; } = "";
        public string endtime { get; set; } = "";
        public int durationminutes { get; set; }
        public string instructions { get; set; } = "";
    }
}
