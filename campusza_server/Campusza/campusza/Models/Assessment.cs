using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Assessment
    {
        public long id { get; set; }
        public string name { get; set; }
        public string type { get; set; } // "quiz", "assignment", etc.
        public long subjectid { get; set; }
        public string subjectname { get; set; }
        public long classid { get; set; }
        public string classname { get; set; }
        public long termid { get; set; }
        public string termname { get; set; }
        public double maxscore { get; set; }
        public double weight { get; set; }
        public DateTime? duedate { get; set; }
        public DateTime assessmentdate { get; set; }
        public string instructions { get; set; }
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

    public class AssessmentSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public long classid { get; set; }
        public long subjectid { get; set; }
        public long termid { get; set; }
    }

    public class AssessmentDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
