using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class GradePeriod
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string gradeid { get; set; } = "";
        public string gradename { get; set; } = "";
        public string periodcode { get; set; } = "";
        public string periodname { get; set; } = "";
        public TimeSpan starttime { get; set; }
        public TimeSpan endtime { get; set; }
        public int displayorder { get; set; }
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class GradePeriodSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string gradeid { get; set; } = "";
    }

    public class GradePeriodDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class GradePeriodCopyReq
    {
        public string organizationid { get; set; } = "";
        public string fromgradeid { get; set; } = "";
        public string togradeid { get; set; } = "";
        public string togradename { get; set; } = "";
    }

    public class GradePeriodReplaceReq
    {
        public string organizationid { get; set; } = "";
        public string gradeid { get; set; } = "";
        public string gradename { get; set; } = "";
        public List<GradePeriod> periods { get; set; } = new();
    }
}
