using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class User
    {
        internal string mobilenumber;

        public long id { get; set; }
        public string email { get; set; }
        public string username { get; set; }
        public string passwordhash { get; set; } // Hashed password
        
        public string role { get; set; } // UserRole enum
        public string status { get; set; } // UserStatus enum
        
        public long organizationid { get; set; }
        public string profileid { get; set; } // Reference to Staff/Student ID
        
        public DateTime? lastloginat { get; set; }
        public string lastloginip { get; set; }
        
        public bool emailverified { get; set; }
        public DateTime? emailverifiedat { get; set; }
        public bool twofactorenabled { get; set; }
        
        // Standard Audit Fields
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }
        public bool isactive { get; set; }
        public bool issuspended { get; set; }
        public string notes { get; set; }
    }

    public class UserSelectReq
    {
        public long id { get; set; }
        public long organizationid { get; set; }
        public string email { get; set; }
        public string role { get; set; }
        public string status { get; set; }
    }

    public class UserDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organizationid { get; set; }
    }
}
