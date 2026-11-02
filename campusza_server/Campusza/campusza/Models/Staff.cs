using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Staff
    {
        public string id { get; set; } = "";
        public string staffid { get; set; } = "";
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string fullname { get; set; } = "";
        public string email { get; set; } = "";
        public string phone { get; set; } = "";
        public DateTime dateofbirth { get; set; } = DateTime.MinValue;
        public string gender { get; set; } = "";

        public string addressstreet { get; set; } = "";
        public string addresscity { get; set; } = "";
        public string addressstate { get; set; } = "";
        public string addresszipcode { get; set; } = "";
        public string addresscountry { get; set; } = "";

        public string department { get; set; } = "";
        public string role { get; set; } = "";
        public string subjects_json { get; set; } = "[]";
        public string qualification { get; set; } = "";
        public int experience { get; set; } = 0;
        public DateTime joiningdate { get; set; } = DateTime.MinValue;
        public string status { get; set; } = "";

        public string photourl { get; set; } = "";
        public string photoassetid { get; set; } = "";
        public string emergencycontactname { get; set; } = "";
        public string emergencycontactrelationship { get; set; } = "";
        public string emergencycontactphone { get; set; } = "";

        public decimal salaryamount { get; set; } = 0;
        public string salarycurrency { get; set; } = "";
        public string salarypaymentfrequency { get; set; } = "";

        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
        public string generatedpassword { get; set; } = "";
    }

    public class StaffSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string department { get; set; } = "";
        public string role { get; set; } = "";
        public string status { get; set; } = "";
    }

    public class StaffDeleteReq
    {
        public string? id { get; set; }
        public string? organizationid { get; set; }
    }
}
