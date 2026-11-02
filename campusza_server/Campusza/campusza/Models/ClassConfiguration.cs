namespace Campusza.Models.Campusza
{
    public class ClassFeeConfiguration
    {
        public string id { get; set; } = "";
        public string grade { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string semestertype { get; set; } = "";
        public string termid { get; set; } = "";
        public string termname { get; set; } = "";
        public string feestructures_json { get; set; } = "[]";
        public decimal totalamount { get; set; }
        public string currency { get; set; } = "";
        public DateTime? duedate { get; set; }
        public string paymentschedule { get; set; } = "";
        public int numberofinstallments { get; set; }
        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class DocumentRequirement
    {
        public string id { get; set; } = "";
        public string grade { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string semestertype { get; set; } = "";
        public string termid { get; set; } = "";
        public string termname { get; set; } = "";
        public string documenttype { get; set; } = "";
        public string action { get; set; } = "";
        public bool isrequired { get; set; }
        public string requiredat { get; set; } = "";
        public string assignedstaffid { get; set; } = "";
        public string assignedstaffname { get; set; } = "";
        public string description { get; set; } = "";
        public string status { get; set; } = "pending";
        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }
    
    // Request classes for multiple entities
    public class ClassConfigurationSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string grade { get; set; } = "";
        public string classid { get; set; } = "";
        public string semestertype { get; set; } = "";
        public string termid { get; set; } = "";
    }

    public class ClassConfigurationDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
