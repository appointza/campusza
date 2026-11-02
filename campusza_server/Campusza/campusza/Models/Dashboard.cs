using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    // For persisting dashboard configuration/layout
    public class DashboardConfig
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public string role { get; set; } // admin, staff, student, parent
        public string layout { get; set; } // grid, list
        public string widgets_json { get; set; } // DashboardWidget[]
        
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        
        public AttributesData attributes { get; set; } = new AttributesData();
        [JsonIgnore]
        public string attributes_json
        {
            get { return JsonSerializer.Serialize(attributes); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    attributes = JsonSerializer.Deserialize<AttributesData>(value);
            }
        }
        
        public class AttributesData
        {
        }
    }

    public class DashboardStatsDTO
    {
        public long totalstudents { get; set; }
        public long totalstaff { get; set; }
        public long totalclasses { get; set; }
        public double attendancerate { get; set; }
        public long pendingtasks { get; set; }
        public long upcomingevents { get; set; }
        
        // Admin specific
        public double totalfees { get; set; }
        public double collectedfees { get; set; }
        public double pendingfees { get; set; }
        
        public List<DashboardActivityDTO> recentactivities { get; set; } = new List<DashboardActivityDTO>();
    }

    public class DashboardActivityDTO
    {
        public string action { get; set; }
        public string entity { get; set; }
        public string description { get; set; }
        public DateTime timestamp { get; set; }
        public string performedby { get; set; }
    }

    public class DashboardSelectReq
    {
        public long organisationid { get; set; }
        public string organizationid { get; set; } = "";
        public string role { get; set; } = "";
    }

    public class AdminDashboardPageReq
    {
        public string organizationid { get; set; } = "";
    }

    public class AdminDashboardPageRes
    {
        public long totalstudents { get; set; }
        public long totalstaff { get; set; }
        public long classestoday { get; set; }
        public string attendancerate { get; set; } = "—";
        public List<AdminDashboardActivityItem> recentactivities { get; set; } = new();
    }

    public class AdminDashboardActivityItem
    {
        public string action { get; set; } = "";
        public string name { get; set; } = "";
        public string timeago { get; set; } = "";
    }

    /// <summary>Platform super admin (users.isfactory) — registered schools overview.</summary>
    public class PlatformDashboardPageRes
    {
        public long totalorganizations { get; set; }
        public long totalschools { get; set; }
        public List<PlatformOrganizationListItem> organizations { get; set; } = new();
    }

    /// <summary>Campusza platform license: amount charged per active student.</summary>
    public class PlatformStudentPricingConfig
    {
        /// <summary>per_year | per_term</summary>
        public string billingperiod { get; set; } = "per_year";
        public string currencycode { get; set; } = "INR";
        public decimal amountperstudentyearly { get; set; }
        public List<PlatformStudentPricingTermItem> termamounts { get; set; } = new();
    }

    public class PlatformStudentPricingTermItem
    {
        public string label { get; set; } = "";
        public decimal amount { get; set; }
    }

    public class PlatformStudentPricingSaveReq
    {
        public string email { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string billingperiod { get; set; } = "per_year";
        public string currencycode { get; set; } = "INR";
        public decimal amountperstudentyearly { get; set; }
        public List<PlatformStudentPricingTermItem> termamounts { get; set; } = new();
    }

    public class PlatformOrganizationListItem
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string slug { get; set; } = "";
        public string status { get; set; } = "";
        public string type { get; set; } = "";
        public long studentcount { get; set; }
        public long staffcount { get; set; }
        public string createdat { get; set; } = "";
        public string adminname { get; set; } = "";
        public string adminmobile { get; set; } = "";
        public PlatformStudentPricingConfig studentpricing { get; set; } = new();
    }
    
    public class DashboardConfigSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public string role { get; set; }
    }
    
    public class DashboardConfigDeleteReq
    {
        public long id { get; set; }
         public int version { get; set; }
        public long organisationid { get; set; }
    }
}
