namespace Campusza.Models.Campusza
{
    public class HomeworkAssignment
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string subject { get; set; } = "";
        public string title { get; set; } = "";
        public string description { get; set; } = "";
        public DateTime assigneddate { get; set; }
        public DateTime? duedate { get; set; }
        public string status { get; set; } = "assigned";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
    }

    public class HomeworkSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        public string classid { get; set; } = "";
        public DateTime? fromdate { get; set; }
        public DateTime? todate { get; set; }
    }

    public class HomeworkDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class StaffHomeworkPageReq
    {
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        public string email { get; set; } = "";
        public string classid { get; set; } = "";
        public string date { get; set; } = "";
    }

    public class StaffHomeworkSlot
    {
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string subject { get; set; } = "";
        public string time { get; set; } = "";
        public string room { get; set; } = "";
        public List<StaffHomeworkItem> homework { get; set; } = new();
    }

    public class StaffHomeworkItem
    {
        public string id { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string subject { get; set; } = "";
        public string title { get; set; } = "";
        public string description { get; set; } = "";
        public string assigneddate { get; set; } = "";
        public string duedate { get; set; } = "";
        public string status { get; set; } = "";
    }

    public class StaffHomeworkPageRes
    {
        public string staffid { get; set; } = "";
        public string date { get; set; } = "";
        public List<StaffHomeworkSlot> slots { get; set; } = new();
    }

    public class HomeworkSaveReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
        public string email { get; set; } = "";
        public string classid { get; set; } = "";
        public string subject { get; set; } = "";
        public string title { get; set; } = "";
        public string description { get; set; } = "";
        public string assigneddate { get; set; } = "";
        public string duedate { get; set; } = "";
    }

    public class HomeworkDeletePageReq
    {
        public HomeworkDeleteReq delete { get; set; } = new();
        public StaffHomeworkPageReq page { get; set; } = new();
    }

    public class AdminHomeworkPageReq
    {
        public string organizationid { get; set; } = "";
        public string date { get; set; } = "";
    }

    public class AdminHomeworkPageRes
    {
        public string date { get; set; } = "";
        public List<AdminHomeworkClassCard> classes { get; set; } = new();
    }

    public class AdminHomeworkClassCard
    {
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public List<AdminHomeworkSubjectGroup> subjects { get; set; } = new();
    }

    public class AdminHomeworkSubjectGroup
    {
        public string subject { get; set; } = "";
        public List<AdminHomeworkItem> homework { get; set; } = new();
    }

    public class AdminHomeworkItem
    {
        public string id { get; set; } = "";
        public string subject { get; set; } = "";
        public string title { get; set; } = "";
        public string description { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string assigneddate { get; set; } = "";
        public string duedate { get; set; } = "";
        public string status { get; set; } = "";
    }

    public class StudentHomeworkPageReq
    {
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string date { get; set; } = "";
    }

    public class StudentHomeworkPageRes
    {
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public string date { get; set; } = "";
        public List<AdminHomeworkSubjectGroup> subjects { get; set; } = new();
    }
}
