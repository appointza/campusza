using System;

namespace Campusza.Models
{
    public class Users
    {
        public long id { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
        public string mobilecountrycode { get; set; }
        public string designation { get; set; }
        public string otp { get; set; }
        public DateTime otpexpirationtime { get; set; }
        public long organisationid { get; set; }
        public long locationid { get; set; }
        public long profileimage { get; set; }
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public string attributes_json { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public long parentid { get; set; }
        public bool isfactory { get; set; }
        public string notes { get; set; }
        public bool isverified { get; set; }
        public bool accountactive { get; set; }
        public string push_token { get; set; }
        public string webpushnotification { get; set; }
        public string iospushnotification { get; set; }
        public string androidpushnotification { get; set; }

       
    }
}
