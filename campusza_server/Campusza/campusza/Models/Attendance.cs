using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Attendance
    {
        public string id { get; set; } = "";
        public string type { get; set; } = ""; // student, staff
        public DateTime date { get; set; }
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string status { get; set; } = ""; // present, absent, late, excused, half_day
        public string checkintime { get; set; } = "";
        public string checkouttime { get; set; } = "";
        public string remarks { get; set; } = "";
        public string markedby { get; set; } = "";
        public DateTime? markedat { get; set; }

        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime? createdat { get; set; }
        public DateTime? updatedat { get; set; }
    }

    public class AttendanceSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string classid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string staffid { get; set; } = "";
        public DateTime? fromdate { get; set; }
        public DateTime? todate { get; set; }
        public string type { get; set; } = "";
    }

    public class AttendanceDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    /// <summary>Request for one API that returns students of a class with their attendance status for a given date.</summary>
    public class StudentsWithAttendanceReq
    {
        public string organizationid { get; set; } = "";
        public string classid { get; set; } = "";
        public string date { get; set; } = ""; // yyyy-MM-dd
    }

    /// <summary>Student row with attendance status for a specific date (present, absent, late, excused, half_day, or empty if not marked).</summary>
    public class StudentWithAttendanceItem
    {
        public string id { get; set; } = "";
        public string studentid { get; set; } = "";
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string fullname { get; set; } = "";
        public int rollnumber { get; set; }
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string attendancestatus { get; set; } = ""; // present, absent, late, excused, half_day, or ""
        public string attendanceid { get; set; } = "";
    }

    public class AttendanceSummary
    {
        public int present { get; set; }
        public int absent { get; set; }
        public int late { get; set; }
        public int total { get; set; }
    }

    public class StaffAttendancePageReq
    {
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        /// <summary>Logged-in user email when JWT user context is unavailable (staff resolution fallback).</summary>
        public string email { get; set; } = "";
        public string classid { get; set; } = "";
        public string date { get; set; } = "";
    }

    public class StaffAttendancePageRes
    {
        public string staffid { get; set; } = "";
        public string date { get; set; } = "";
        public string selectedclassid { get; set; } = "";
        public string selectedclassname { get; set; } = "";
        public List<StaffAttendanceClassOption> classes { get; set; } = new();
        public List<StudentWithAttendanceItem> students { get; set; } = new();
        public AttendanceSummary summary { get; set; } = new();
    }

    public class StaffAttendanceClassOption
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
    }

    public class BulkAttendanceSaveReq
    {
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        public string email { get; set; } = "";
        public string classid { get; set; } = "";
        public string date { get; set; } = "";
        public List<BulkAttendanceSaveItem> items { get; set; } = new();
    }

    public class BulkAttendanceSaveItem
    {
        public string studentid { get; set; } = "";
        public string status { get; set; } = "";
    }
}
