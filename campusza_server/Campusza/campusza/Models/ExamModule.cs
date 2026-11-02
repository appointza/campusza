namespace Campusza.Models.Campusza
{
    public static class ExamSeriesStatuses
    {
        public const string Draft = "Draft";
        public const string Scheduled = "Scheduled";
        public const string Published = "Published";
        public const string InProgress = "In Progress";
        public const string Completed = "Completed";
        public const string ResultsPublished = "Results Published";
        public const string Cancelled = "Cancelled";

        public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
        {
            Draft, Scheduled, Published, InProgress, Completed, ResultsPublished, Cancelled,
        };
    }

    public static class ExamSessionStatuses
    {
        public const string Draft = "Draft";
        public const string Scheduled = "Scheduled";
        public const string Published = "Published";
        public const string InProgress = "In Progress";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";

        public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
        {
            Draft, Scheduled, Published, InProgress, Completed, Cancelled,
        };
    }

    public static class ExamMarkAttendanceStatuses
    {
        public const string Pending = "Pending";
        public const string Present = "Present";
        public const string Absent = "Absent";
        public const string Excused = "Excused";
        public const string Exempt = "Exempt";

        public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
        {
            Pending, Present, Absent, Excused, Exempt,
        };
    }

    public static class ExamMarksWorkflowStatuses
    {
        public const string Draft = "Draft";
        public const string Submitted = "Submitted";
        public const string Approved = "Approved";
    }

    public class ExamSeries
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string termid { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string name { get; set; } = "";
        public string examtyperefid { get; set; } = "";
        public DateTime startdate { get; set; }
        public DateTime enddate { get; set; }
        public string status { get; set; } = ExamSeriesStatuses.Draft;
        public string instructions { get; set; } = "";
        public DateTime? publishedat { get; set; }
        public string publishedby { get; set; } = "";
        public DateTime? cancelledat { get; set; }
        public string cancelledby { get; set; } = "";
        public string cancelreason { get; set; } = "";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class ExamSeriesSelectReq
    {
        public string? id { get; set; }
        public string? organizationid { get; set; }
        public string? termid { get; set; }
        public string? status { get; set; }
    }

    public class ExamSeriesSaveReq
    {
        public ExamSeries series { get; set; } = new();
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamSeriesLifecycleReq
    {
        public string id { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public string? reason { get; set; }
    }

    public class ExamValidationResult
    {
        public List<string> errors { get; set; } = new();
        public bool isvalid => errors.Count == 0;

        public void Merge(ExamValidationResult other)
        {
            if (other.errors.Count > 0)
                errors.AddRange(other.errors);
        }
    }

    public class ExamSeriesValidateReq
    {
        public string id { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamSessionValidateReq
    {
        public ExamSession session { get; set; } = new();
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamSession
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string examseriesid { get; set; } = "";
        public string subjectid { get; set; } = "";
        public DateTime examdate { get; set; }
        public TimeSpan starttime { get; set; }
        public TimeSpan endtime { get; set; }
        public int durationminutes { get; set; }
        public decimal maxmarks { get; set; }
        public decimal passingmarks { get; set; }
        public string instructions { get; set; } = "";
        public string status { get; set; } = ExamSessionStatuses.Draft;
        public string marksstatus { get; set; } = ExamMarksWorkflowStatuses.Draft;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
        public List<string> classids { get; set; } = new();
    }

    public class ExamSessionSelectReq
    {
        public string? id { get; set; }
        public string? organizationid { get; set; }
        public string? examseriesid { get; set; }
        public string? classid { get; set; }
        public string? status { get; set; }
    }

    public class ExamSessionSaveReq
    {
        public ExamSession session { get; set; } = new();
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamRoom
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string name { get; set; } = "";
        public string building { get; set; } = "";
        public string floor { get; set; } = "";
        public int capacity { get; set; }
        public int? rowscount { get; set; }
        public int? columnscount { get; set; }
        public string linkedclassid { get; set; } = "";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class ExamRoomSelectReq
    {
        public string? id { get; set; }
        public string? organizationid { get; set; }
        public bool? includeinactive { get; set; }
    }

    public class ExamRoomSaveReq
    {
        public ExamRoom room { get; set; } = new();
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamMark
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string examsessionid { get; set; } = "";
        public string studentenrollmentid { get; set; } = "";
        public decimal? marksobtained { get; set; }
        public string attendancestatus { get; set; } = ExamMarkAttendanceStatuses.Pending;
        public string remarks { get; set; } = "";
        public string enteredby { get; set; } = "";
        public DateTime enteredat { get; set; }
        public DateTime updatedat { get; set; }
        public string updatedby { get; set; } = "";
    }

    public class ExamMarkRegisterCell
    {
        public string sessionid { get; set; } = "";
        public string enrollmentid { get; set; } = "";
        public decimal? marksobtained { get; set; }
        public string attendancestatus { get; set; } = ExamMarkAttendanceStatuses.Pending;
        public string? remarks { get; set; }
        public DateTime? expectedupdatedat { get; set; }
    }

    public class ExamMarkSaveRegisterReq
    {
        public string examseriesid { get; set; } = "";
        public string classid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public List<ExamMarkRegisterCell> cells { get; set; } = new();
    }

    public class ExamMarkSaveRegisterRes
    {
        public int savedcount { get; set; }
        public int errorcount { get; set; }
        public List<string> errors { get; set; } = new();
        public string marksstatus { get; set; } = ExamMarksWorkflowStatuses.Draft;
    }

    public class ExamAuditLogEntry
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string entitytype { get; set; } = "";
        public string entityid { get; set; } = "";
        public string action { get; set; } = "";
        public string reason { get; set; } = "";
        public string beforejson { get; set; } = "";
        public string afterjson { get; set; } = "";
        public string createdby { get; set; } = "";
        public DateTime createdat { get; set; }
    }

    public static class ExamSeatAllocationSources
    {
        public const string Auto = "Auto";
        public const string Manual = "Manual";
    }

    public static class ExamSeatingStrategies
    {
        public const string RollNumber = "RollNumber";
        public const string AdmissionNumber = "AdmissionNumber";

        public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
        {
            RollNumber, AdmissionNumber,
        };
    }

    public class ExamSessionRoom
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string examsessionid { get; set; } = "";
        public string examroomid { get; set; } = "";
        public string roomname { get; set; } = "";
        public int allocatedcapacity { get; set; }
        public int roomcapacity { get; set; }
        public DateTime createdat { get; set; }
    }

    public class ExamSessionRoomSelectReq
    {
        public string? organizationid { get; set; }
        public string? examsessionid { get; set; }
    }

    public class ExamSessionRoomAllocationItem
    {
        public string examroomid { get; set; } = "";
        public int allocatedcapacity { get; set; }
    }

    public class ExamSessionRoomSaveReq
    {
        public string examsessionid { get; set; } = "";
        public List<ExamSessionRoomAllocationItem> rooms { get; set; } = new();
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public bool allowcorrection { get; set; }
        public string? reason { get; set; }
    }

    public class ExamSeatAllocation
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string examsessionid { get; set; } = "";
        public string examroomid { get; set; } = "";
        public string roomname { get; set; } = "";
        public string studentenrollmentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string classname { get; set; } = "";
        public string seatlabel { get; set; } = "";
        public string allocationsource { get; set; } = ExamSeatAllocationSources.Auto;
        public bool islocked { get; set; }
        public string allocatedby { get; set; } = "";
        public DateTime allocatedat { get; set; }
    }

    public class ExamSeatSelectReq
    {
        public string? organizationid { get; set; }
        public string? examsessionid { get; set; }
    }

    public class ExamGenerateSeatsReq
    {
        public string examsessionid { get; set; } = "";
        public string strategy { get; set; } = ExamSeatingStrategies.RollNumber;
        public bool preservemanual { get; set; } = true;
        public bool forcereplaceauto { get; set; }
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public bool allowcorrection { get; set; }
        public string? reason { get; set; }
    }

    public class ExamGenerateSeatsRes
    {
        public int totalstudents { get; set; }
        public int allocatedstudents { get; set; }
        public int unallocatedstudents { get; set; }
        public List<string> errors { get; set; } = new();
    }

    public class ExamAssignSeatReq
    {
        public string examsessionid { get; set; } = "";
        public string examroomid { get; set; } = "";
        public string studentenrollmentid { get; set; } = "";
        public string seatlabel { get; set; } = "";
        public bool islocked { get; set; } = true;
        public bool replaceexisting { get; set; }
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public bool allowcorrection { get; set; }
        public string? reason { get; set; }
    }

    public class ExamInvigilator
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string examsessionid { get; set; } = "";
        public string examroomid { get; set; } = "";
        public string roomname { get; set; } = "";
        public string staffid { get; set; } = "";
        public string staffname { get; set; } = "";
        public string role { get; set; } = "Invigilator";
        public DateTime createdat { get; set; }
    }

    public class ExamInvigilatorSelectReq
    {
        public string? organizationid { get; set; }
        public string? examsessionid { get; set; }
    }

    public class ExamInvigilatorSaveReq
    {
        public ExamInvigilator invigilator { get; set; } = new();
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamInvigilatorDeleteReq
    {
        public string id { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamMarkGetRegisterReq
    {
        public string examseriesid { get; set; } = "";
        public string classid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamMarkRegisterSessionColumn
    {
        public string sessionid { get; set; } = "";
        public string subjectid { get; set; } = "";
        public string subjectname { get; set; } = "";
        public decimal maxmarks { get; set; }
        public decimal passingmarks { get; set; }
        public string examdate { get; set; } = "";
    }

    public class ExamMarkRegisterStudentRow
    {
        public string enrollmentid { get; set; } = "";
        public string studentid { get; set; } = "";
        public int? rollnumber { get; set; }
        public string studentname { get; set; } = "";
        public string classname { get; set; } = "";
        public List<ExamMarkRegisterCellOut> cells { get; set; } = new();
    }

    public class ExamMarkRegisterCellOut
    {
        public string sessionid { get; set; } = "";
        public string enrollmentid { get; set; } = "";
        public decimal? marksobtained { get; set; }
        public string attendancestatus { get; set; } = ExamMarkAttendanceStatuses.Pending;
        public string remarks { get; set; } = "";
        public DateTime? updatedat { get; set; }
        public bool ismissing => string.Equals(attendancestatus, ExamMarkAttendanceStatuses.Pending, StringComparison.OrdinalIgnoreCase)
            && !marksobtained.HasValue;
    }

    public class ExamMarkGetRegisterRes
    {
        public string examseriesid { get; set; } = "";
        public string examseriesname { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string marksstatus { get; set; } = ExamMarksWorkflowStatuses.Draft;
        public DateTime? submittedat { get; set; }
        public string submittedby { get; set; } = "";
        public DateTime? approvedat { get; set; }
        public string approvedby { get; set; } = "";
        public List<ExamMarkRegisterSessionColumn> sessions { get; set; } = new();
        public List<ExamMarkRegisterStudentRow> students { get; set; } = new();
    }

    public class ExamMarkRegisterWorkflowReq
    {
        public string examseriesid { get; set; } = "";
        public string classid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public string? reason { get; set; }
    }

    public class ExamMarkPublishResultsReq
    {
        public string examseriesid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
        public string? remarks { get; set; }
    }

    public class ExamMarkPublishResultsRes
    {
        public bool success { get; set; }
        public List<string> errors { get; set; } = new();
        public string? seriesstatus { get; set; }
    }

    public class ExamStudentResultsReq
    {
        public string examseriesid { get; set; } = "";
        public string studentid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamStudentResultSubjectRow
    {
        public string sessionid { get; set; } = "";
        public string subjectid { get; set; } = "";
        public string subjectname { get; set; } = "";
        public decimal maxmarks { get; set; }
        public decimal passingmarks { get; set; }
        public decimal? marksobtained { get; set; }
        public string attendancestatus { get; set; } = "";
        public bool? passed { get; set; }
    }

    public class ExamStudentResultsRes
    {
        public string examseriesid { get; set; } = "";
        public string examseriesname { get; set; } = "";
        public string studentid { get; set; } = "";
        public string studentname { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public bool published { get; set; }
        public List<ExamStudentResultSubjectRow> subjects { get; set; } = new();
        public decimal? totalobtained { get; set; }
        public decimal? totalmax { get; set; }
        public decimal? percentage { get; set; }
    }

    public class ExamClassResultsSummaryReq
    {
        public string examseriesid { get; set; } = "";
        public string classid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamClassResultsSummaryRes
    {
        public string examseriesid { get; set; } = "";
        public string classid { get; set; } = "";
        public string classname { get; set; } = "";
        public string marksstatus { get; set; } = "";
        public bool resultspublished { get; set; }
        public List<ExamMarkRegisterStudentRow> students { get; set; } = new();
        public List<ExamMarkRegisterSessionColumn> sessions { get; set; } = new();
    }

    public class ExamHallTicketReq
    {
        public string examsessionid { get; set; } = "";
        public string studentenrollmentid { get; set; } = "";
        public string? organizationid { get; set; }
        public string? email { get; set; }
    }

    public class ExamHallTicketRes
    {
        public string studentname { get; set; } = "";
        public string classname { get; set; } = "";
        public int? rollnumber { get; set; }
        public string admissionnumber { get; set; } = "";
        public string seriesname { get; set; } = "";
        public string subjectname { get; set; } = "";
        public string examdate { get; set; } = "";
        public string starttime { get; set; } = "";
        public string endtime { get; set; } = "";
        public string roomname { get; set; } = "";
        public string seatlabel { get; set; } = "";
        public string instructions { get; set; } = "";
    }
}
