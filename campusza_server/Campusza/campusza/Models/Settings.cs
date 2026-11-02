using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Settings
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        
        // JSON storage for complex nested settings
        public string general_json { get; set; }
        public string academic_json { get; set; }
        public string notifications_json { get; set; }
        public string appearance_json { get; set; }
        public string security_json { get; set; }
        public string integrations_json { get; set; }
        public string features_json { get; set; }
        
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
        }
    }

    public class SettingsSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
    }

    public class SettingsDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
