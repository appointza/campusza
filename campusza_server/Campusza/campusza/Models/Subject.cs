using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Subject
    {
        public long id { get; set; }
        public string code { get; set; }
        public string name { get; set; }
        public string shortname { get; set; }
        public string description { get; set; }
        public string type { get; set; } // "core", "elective"
        public string department { get; set; }
        public int credits { get; set; }
        public int weeklyhours { get; set; }
        
        public string status { get; set; }
        
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public string notes { get; set; }

        public string prerequisites_json { get; set; } // string[] subject IDs

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

    public class SubjectSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public string department { get; set; }
        public string type { get; set; }
    }

    public class SubjectDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
