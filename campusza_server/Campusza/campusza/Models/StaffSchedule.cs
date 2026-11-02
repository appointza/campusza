using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class StaffSchedule
    {
        public string id { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string day { get; set; } = "";
        public TimeSpan starttime { get; set; }
        public TimeSpan endtime { get; set; }
        public string subject { get; set; } = "";
        public string subjectid { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string room { get; set; } = "";
        public bool isreplacement { get; set; }
        public string originalteacherid { get; set; } = "";
        public string originalteachername { get; set; } = "";
        public string replacementteacherid { get; set; } = "";
        public string replacementteachername { get; set; } = "";
        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
    }

    public class StaffScheduleSelectReq
    {
        public string id { get; set; } = "";
        public string staffid { get; set; } = "";
        public string classid { get; set; } = "";
        public string day { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class StaffScheduleDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
