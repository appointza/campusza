using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Fee
    {
        public long id { get; set; }
        public long studentid { get; set; }
        public string studentname { get; set; }
        public long termid { get; set; }
        public string termname { get; set; }
        public string academicyear { get; set; }
        
        public double totalamount { get; set; }
        public double paidamount { get; set; }
        public double pendingamount { get; set; }
        public string status { get; set; } // paid, partial, unpaid, overdue, waived
        public DateTime duedate { get; set; }
        
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

        public string feestructures_json { get; set; } // FeeStructureItem[]
        public string payments_json { get; set; } // PaymentRecord[]
        public string discounts_json { get; set; } // FeeDiscount[]
        public string penalties_json { get; set; } // FeePenalty[]

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

    public class FeeSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long studentid { get; set; }
        public long termid { get; set; }
        public string status { get; set; }
        public string academicyear { get; set; }
    }

    public class FeeDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
    }
}
