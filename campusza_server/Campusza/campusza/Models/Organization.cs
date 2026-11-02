using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Organization
    {
        public long id { get; set; }
        public string name { get; set; }
        public string slug { get; set; }
        public string email { get; set; }
        public string phone { get; set; }
        
        public string type { get; set; } // school, college, etc.
        public string status { get; set; }
        public string subscriptionplan { get; set; }
        public DateTime subscriptionstartdate { get; set; }
        public DateTime? subscriptionenddate { get; set; }
        
        public int maxusers { get; set; }
        public int maxstudents { get; set; }
        
        // Address stored as JSON
        public string address_json { get; set; }
        public string logourl { get; set; }
        public string website { get; set; }
        
        public string settings_json { get; set; } // OrganizationSettings
        
        // Standard Audit Fields
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public string notes { get; set; }

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
             // Extensible data
        }
    }

    public class OrganizationSelectReq
    {
        public long id { get; set; }
        public string slug { get; set; }
        public string status { get; set; }
    }

    public class OrganizationDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}
