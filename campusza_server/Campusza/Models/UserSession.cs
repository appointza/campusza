using System;

namespace Campusza.Models
{
    public class UserSession
    {
        public long id { get; set; }
        public long userid { get; set; }
        public string code { get; set; }
        public DateTime starttime { get; set; }
        public DateTime endtime { get; set; }
        
        // Base properties
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
    }
}
