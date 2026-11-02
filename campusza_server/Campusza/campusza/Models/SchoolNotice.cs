namespace Campusza.Models.Campusza
{
    public class SchoolNotice
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string title { get; set; } = "";
        public string body { get; set; } = "";
        /// <summary>all | staff | student</summary>
        public string audience { get; set; } = "all";
        public DateTime? publishfrom { get; set; }
        public DateTime? publishto { get; set; }
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class SchoolNoticeSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        /// <summary>Reader role: staff | student | admin (admin sees all for management)</summary>
        public string audience { get; set; } = "staff";
        public bool includemanagement { get; set; }
    }

    public class SchoolNoticeSaveReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string title { get; set; } = "";
        public string body { get; set; } = "";
        public string audience { get; set; } = "all";
        public string publishfrom { get; set; } = "";
        public string publishto { get; set; } = "";
    }

    public class SchoolNoticeDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class SchoolNotificationsPageReq
    {
        public string organizationid { get; set; } = "";
        /// <summary>staff | student | admin</summary>
        public string audience { get; set; } = "staff";
    }

    public class SchoolNotificationsPageRes
    {
        public Term? term { get; set; }
        public List<SchoolCalendarWeeklyRule> weeklyrules { get; set; } = new();
        public List<SchoolCalendarDayOverride> dayoverrides { get; set; } = new();
        public List<SchoolNotice> notices { get; set; } = new();
        public bool canmanage { get; set; }
    }
}
