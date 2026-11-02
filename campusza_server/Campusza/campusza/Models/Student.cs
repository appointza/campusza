namespace Campusza.Models.Campusza
{
    public class Student
    {
        internal string? organisationid;

        public string id { get; set; } = "";
        public string studentid { get; set; } = "";
        public string firstname { get; set; } = "";
        public string lastname { get; set; } = "";
        public string fullname { get; set; } = "";
        public string email { get; set; } = "";
        public string phone { get; set; } = "";
        public DateTime dateofbirth { get; set; }
        public string gender { get; set; } = "";

        public string addressstreet { get; set; } = "";
        public string addresscity { get; set; } = "";
        public string addressstate { get; set; } = "";
        public string addresszipcode { get; set; } = "";
        public string addresscountry { get; set; } = "";

        public string parentguardianname { get; set; } = "";
        public string parentguardianrelationship { get; set; } = "";
        public string parentguardianemail { get; set; } = "";
        public string parentguardianphone { get; set; } = "";
        public string parentguardianoccupation { get; set; } = "";

        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string grade { get; set; } = "";
        public string section { get; set; } = "";
        public int rollnumber { get; set; }
        public DateTime admissiondate { get; set; }
        public string currentacademicyear { get; set; } = "";
        public string currentsemestertype { get; set; } = "";
        public string currenttermid { get; set; } = "";
        public string currenttermname { get; set; } = "";
        public string status { get; set; } = "";
        public string photourl { get; set; } = "";
        public string photoassetid { get; set; } = "";
        public string bloodgroup { get; set; } = "";
        public string medicalconditions { get; set; } = "";

        public string emergencycontactname { get; set; } = "";
        public string emergencycontactrelationship { get; set; } = "";
        public string emergencycontactphone { get; set; } = "";

        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
        public string extendedprofile_json { get; set; } = "{}";
        /// <summary>Normalized mobile used for student login (not persisted on students table).</summary>
        public string loginmobile { get; set; } = "";
    }

    public class StudentSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string classid { get; set; } = "";
        public string status { get; set; } = "";
    }

    public class StudentDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
