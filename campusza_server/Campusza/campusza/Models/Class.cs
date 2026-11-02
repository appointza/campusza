using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Class
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string termid { get; set; } = "";
        public int capacity { get; set; }
        public int currentenrollment { get; set; }
        public string room { get; set; } = "";
        public string schoolroomid { get; set; } = "";
        public string classteacherid { get; set; } = "";
        public string classteachername { get; set; } = "";
        public string assistantmentorid { get; set; } = "";
        public string assistantmentorname { get; set; } = "";
        public string subjects_json { get; set; } = "[]";
        public string schedule_json { get; set; } = "[]";
        public string status { get; set; } = "";
        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class ClassSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string termid { get; set; } = "";
        public string classteacherid { get; set; } = "";
        public string status { get; set; } = "";
    }

    public class ClassDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class ClassAssignedToStaffReq
    {
        public string organizationid { get; set; } = "";
        public string staffid { get; set; } = "";
    }
}
