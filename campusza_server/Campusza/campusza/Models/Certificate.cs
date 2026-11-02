using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Certificate
    {
        public long id { get; set; }
        public string certificateno { get; set; }
        public long studentid { get; set; }
        public string studentname { get; set; }
        public long termid { get; set; }
        public string termname { get; set; }
        public string academicyear { get; set; }
        public string type { get; set; } // bonafide, transfer, etc.
        public string status { get; set; } // issued, pending, etc.
        
        public DateTime? issueddate { get; set; }
        public long issuedby { get; set; }
        public string issuedbyname { get; set; }
        public DateTime? validfrom { get; set; }
        public DateTime? validuntil { get; set; }
        
        public string remarks { get; set; }
        public string rejectionreason { get; set; }
        public string fileurl { get; set; }
        public string templateid { get; set; }

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

    public class CertificateSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long studentid { get; set; }
        public string type { get; set; }
        public string status { get; set; }
        public string certificateno { get; set; }
    }

    public class CertificateDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
