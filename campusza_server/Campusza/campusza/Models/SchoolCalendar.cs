namespace Campusza.Models.Campusza
{
    public class SchoolCalendarWeeklyRule
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string termid { get; set; } = "";
        public int weekday { get; set; }
        public string daytype { get; set; } = "";
        public string reason { get; set; } = "";
        public bool isactive { get; set; } = true;
    }

    public class SchoolCalendarDayOverride
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string termid { get; set; } = "";
        public DateTime calendardate { get; set; }
        public string daytype { get; set; } = "";
        public string reason { get; set; } = "";
        public bool isactive { get; set; } = true;
    }

    public class SchoolCalendarPageReq
    {
        public string termid { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class SchoolCalendarPageRes
    {
        public Term term { get; set; } = new Term();
        public List<SchoolCalendarWeeklyRule> weeklyrules { get; set; } = new();
        public List<SchoolCalendarDayOverride> dayoverrides { get; set; } = new();
    }

    public class SchoolCalendarWeeklyRuleSaveReq
    {
        public string id { get; set; } = "";
        public string termid { get; set; } = "";
        public string organizationid { get; set; } = "";
        public int weekday { get; set; }
        public string daytype { get; set; } = "";
        public string reason { get; set; } = "";
    }

    public class SchoolCalendarDayOverrideSaveReq
    {
        public string id { get; set; } = "";
        public string termid { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string calendardate { get; set; } = "";
        public string daytype { get; set; } = "";
        public string reason { get; set; } = "";
    }

    public class SchoolCalendarDeleteReq
    {
        public string id { get; set; } = "";
        public string termid { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
