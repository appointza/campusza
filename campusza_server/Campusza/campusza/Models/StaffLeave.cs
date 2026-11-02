using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class StaffLeave
    {
        public string id { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string leavetype { get; set; } = "";
        public DateTime startdate { get; set; }
        public DateTime enddate { get; set; }
        public string reason { get; set; } = "";
        public string status { get; set; } = "";
        public DateTime applieddate { get; set; }
        public string approvedby { get; set; } = "";
        public DateTime? approveddate { get; set; }
        public string rejectedreason { get; set; } = "";
        public int totaldays { get; set; }
        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
    }

    public class StaffLeaveSelectReq
    {
        public string id { get; set; } = "";
        public string staffid { get; set; } = "";
        public string status { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class StaffLeaveDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
