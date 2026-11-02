using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class ReferenceValue
    {
        public string id { get; set; } = "";
        public string category { get; set; } = "";
        public string code { get; set; } = "";
        public string name { get; set; } = "";
        public string shortname { get; set; } = "";
        public string description { get; set; } = "";
        public string value { get; set; } = "";
        public int displayorder { get; set; }
        public string parentid { get; set; } = "";
        public string metadata_json { get; set; } = "{}";
        public bool issystem { get; set; }
        public bool isdefault { get; set; }
        public string status { get; set; } = "active";
        public string organizationid { get; set; } = "";
        public bool isfactory { get; set; }
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class ReferenceValueSelectReq
    {
        public string id { get; set; } = "";
        public string category { get; set; } = "";
        public string code { get; set; } = "";
        public string status { get; set; } = "";
        public string organizationid { get; set; } = "";
        /// <summary>Optional filter: when set, only rows with this is_default value are returned.</summary>
        public bool? isdefault { get; set; }
    }

    public class ReferenceValueDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string updatedby { get; set; } = "";
    }
}
