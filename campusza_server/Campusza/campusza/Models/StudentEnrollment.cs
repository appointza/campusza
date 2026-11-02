namespace Campusza.Models.Campusza
{
    public class StudentEnrollment
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public int? rollnumber { get; set; }
        public string enrollmentstatus { get; set; } = "enrolled";
        public DateTime? joineddate { get; set; }
        public DateTime? leftdate { get; set; }
        public string status { get; set; } = "current";
        public bool iscurrent { get; set; } = false;
        public string termid { get; set; } = "";
        public string termname { get; set; } = "";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class StudentEnrollmentWithProfile
    {
        public string enrollmentid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string admissionnumber { get; set; } = "";
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string fullname { get; set; } = "";
        public string email { get; set; } = "";
        public string phone { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public int? rollnumber { get; set; }
        public string enrollmentstatus { get; set; } = "";
        public string status { get; set; } = "";
        public bool iscurrent { get; set; }
        public string studentstatus { get; set; } = "";
        public DateTime? admissiondate { get; set; }
        public DateTime? joineddate { get; set; }
    }

    public class StudentTransfer
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string enrollmentid { get; set; } = "";
        public string fromclassid { get; set; } = "";
        public string fromclassname { get; set; } = "";
        public string fromsection { get; set; } = "";
        public string toclassid { get; set; } = "";
        public string toclassname { get; set; } = "";
        public string tosection { get; set; } = "";
        public string reason { get; set; } = "";
        public DateTime effectivedate { get; set; }
        public string createdby { get; set; } = "";
        public DateTime createdat { get; set; }
        public bool isactive { get; set; } = true;
    }

    public class StudentEnrollmentSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string classid { get; set; } = "";
        public string section { get; set; } = "";
        public string status { get; set; } = "";
        public bool? iscurrent { get; set; }
    }

    public class CreateStudentWithEnrollmentReq
    {
        public Student student { get; set; } = new Student();
        public StudentEnrollment enrollment { get; set; } = new StudentEnrollment();
        public string email { get; set; } = "";
    }

    public class UpdateEnrollmentReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string email { get; set; } = "";
        public int? rollnumber { get; set; }
    }

    public class StudentPromotionOutcome
    {
        public string studentid { get; set; } = "";
        public string outcome { get; set; } = "promote";
        public int? rollnumber { get; set; }
    }

    public class PromoteStudentsRequest
    {
        public string organizationid { get; set; } = "";
        public string fromacademicyear { get; set; } = "";
        public string fromclassid { get; set; } = "";
        public string fromsection { get; set; } = "";
        public string toacademicyear { get; set; } = "";
        public string toclassid { get; set; } = "";
        public string toclassname { get; set; } = "";
        public string tograde { get; set; } = "";
        public string tosection { get; set; } = "";
        public string newtermid { get; set; } = "";
        public string newtermname { get; set; } = "";
        public string promotedby { get; set; } = "";
        public string notes { get; set; } = "";
        public List<StudentPromotionOutcome> students { get; set; } = new List<StudentPromotionOutcome>();
    }

    public class TransferStudentRequest
    {
        public string organizationid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string enrollmentid { get; set; } = "";
        public string toclassid { get; set; } = "";
        public string toclassname { get; set; } = "";
        public string tograde { get; set; } = "";
        public string tosection { get; set; } = "";
        public int? rollnumber { get; set; }
        public string reason { get; set; } = "";
        public DateTime effectivedate { get; set; }
    }
}
