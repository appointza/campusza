using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Report
    {
        public long id { get; set; }
        public string name { get; set; }
        public string type { get; set; } // attendance, student_performance, etc.
        public string format { get; set; } // pdf, excel, etc.
        public string status { get; set; } // pending, completed, etc.
        
        public long generatedby { get; set; }
        public DateTime generatedat { get; set; }
        public string fileurl { get; set; }
        public long filesize { get; set; }
        public string errormessage { get; set; }
        public DateTime? expiresat { get; set; }

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

        public string parameters_json { get; set; } // ReportParameters
        public string filters_json { get; set; } // ReportFilters

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

    public class ReportSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public string type { get; set; }
        public string status { get; set; }
        public DateTime? fromdate { get; set; }
        public DateTime? todate { get; set; }
    }

    public class ReportDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
