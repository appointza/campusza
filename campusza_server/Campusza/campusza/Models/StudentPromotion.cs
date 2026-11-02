namespace Campusza.Models.Campusza
{
    public class StudentAcademicHistory
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string grade { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string section { get; set; } = "";
        public int? rollnumber { get; set; }
        
        // Performance data
        public decimal? totalmarks { get; set; }
        public decimal? percentage { get; set; }
        public decimal? gpa { get; set; }
        public string gradeletter { get; set; } = "";
        
        // Status
        public string promotionstatus { get; set; } = "current"; // current, promoted, retained, transferred, dropped
        public DateTime? promotiondate { get; set; }
        
        // Metadata
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class StudentPromotion
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string fromgrade { get; set; } = "";
        public string fromclassid { get; set; } = "";
        public string fromclassname { get; set; } = "";
        public string tograde { get; set; } = "";
        public string toclassid { get; set; } = "";
        public string toclassname { get; set; } = "";
        public string academicyearfrom { get; set; } = "";
        public string academicyearto { get; set; } = "";
        
        // Performance for promotion decision
        public decimal? finalpercentage { get; set; }
        public decimal? gpa { get; set; }
        
        // Decision
        public string promotiontype { get; set; } = "promoted"; // promoted, retained, transferred, dropped
        public DateTime promotiondate { get; set; }
        public string promotedby { get; set; } = "";
        public string notes { get; set; } = "";
        
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    // Request models
    public class StudentPromotionSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string grade { get; set; } = "";
        public string classid { get; set; } = "";
    }

    public class StudentPromotionSaveReq
    {
        public StudentPromotion studentpromotion { get; set; } = new StudentPromotion();
    }
}
