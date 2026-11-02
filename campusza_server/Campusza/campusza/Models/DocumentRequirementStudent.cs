namespace Campusza.Models.Campusza
{
    public class DocumentRequirementStudent
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string documentrequirementid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string status { get; set; } = "pending"; // pending, issued, collected, not_required
        public string notes { get; set; } = "";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class DocumentRequirementStudentSelectReq
    {
        public string? organizationid { get; set; }
        public string? documentrequirementid { get; set; }
        public string? studentid { get; set; }
    }
}
