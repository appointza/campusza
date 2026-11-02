namespace Campusza.Models.Campusza
{
    public class StudentGrade
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string classid { get; set; } = "";
        public string termid { get; set; } = "";
        public string assessmentrefid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string componentsjson { get; set; } = "[]";
        public double finalweightedscore { get; set; }
        public double finalpercentage { get; set; }
        public string lettergrade { get; set; } = "";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class StudentGradeSelectReq
    {
        public string? organizationid { get; set; }
        public string? classid { get; set; }
        public string? termid { get; set; }
        public string? assessmentrefid { get; set; }
        public string? studentid { get; set; }
    }
}
