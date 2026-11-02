using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class StaffReplacement
    {
        public string id { get; set; } = "";
        public string scheduleid { get; set; } = "";
        public string originalteacherid { get; set; } = "";
        public string originalteachername { get; set; } = "";
        public string replacementteacherid { get; set; } = "";
        public string replacementteachername { get; set; } = "";
        public string? subjectid { get; set; }
        public string? subject { get; set; }
        public DateTime date { get; set; }
        public string reason { get; set; } = "";
        public string assignedby { get; set; } = "";
        public DateTime assigneddate { get; set; }
        public string status { get; set; } = "";
        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
    }

    public class StaffReplacementSelectReq
    {
        public string id { get; set; } = "";
        public string scheduleid { get; set; } = "";
        public string status { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class StaffReplacementDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
