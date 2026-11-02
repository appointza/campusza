using Microsoft.AspNetCore.Mvc;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Campusza.Utils;

namespace Campusza.integrations.Authentication.Controllers
{
    [ApiController]
    [Route("api/b2b/user")]
    public class B2BUserController : ControllerBase
    {
        private readonly ILogger<B2BUserController> _logger;
        private readonly StudentService _studentService;
        private readonly UserService _userService;

        public B2BUserController(
            ILogger<B2BUserController> logger,
            StudentService studentService,
            UserService userService)
        {
            _logger = logger;
            _studentService = studentService;
            _userService = userService;
        }

        /// <summary>
        /// Check if user exists by mobile number
        /// </summary>
        [HttpPost("check")]
        public async Task<IActionResult> CheckUser([FromBody] CheckUserRequest request)
        {
            try
            {
                var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
                _logger.LogInformation("B2B check user request from {CallingCompany} for mobile {MobileNumber}", callingCompany, request.MobileNumber);

                // Get all students and filter by parent mobile number
                var studentReq = new StudentSelectReq { };
                var allStudents = await _studentService.Select(studentReq);
                
                // Normalize phone numbers for comparison
                var normalizedPhone = request.MobileNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
                var students = allStudents?.Where(s => 
                    !string.IsNullOrEmpty(s.parentguardianphone) &&
                    s.parentguardianphone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "") == normalizedPhone
                ).ToList() ?? new List<Student>();
                
                var exists = students.Any();

                // Check if user is admin
                bool isAdmin = false;
                if (exists)
                {
                    // Check if there's a user with admin role
                    var users = await _userService.Select(new UserSelectReq { });
                    var adminUser = users?.FirstOrDefault(u => 
                        (u.role == "admin" || u.role == "Admin" || u.role == "ADMIN") &&
                        (u.mobilenumber == request.MobileNumber || 
                         students.Any(s => s.parentguardianphone == request.MobileNumber)));
                    isAdmin = adminUser != null;
                }

                var response = new CheckUserResponse
                {
                    Exists = exists,
                    HasAppointments = exists, // Students count as "appointments" in this context
                    IsAdmin = isAdmin
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking user by mobile number");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Get appointments (students) by mobile number
        /// </summary>
        [HttpPost("appointments/by-mobile")]
        public async Task<IActionResult> GetAppointmentsByMobile([FromBody] GetAppointmentsByMobileRequest request)
        {
            try
            {
                var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
                _logger.LogInformation("B2B get appointments request from {CallingCompany} for mobile {MobileNumber}", callingCompany, request.MobileNumber);

                // Get all students and filter by parent mobile number
                var studentReq = new StudentSelectReq { };
                var allStudents = await _studentService.Select(studentReq);
                
                // Normalize phone numbers for comparison
                var normalizedPhone = request.MobileNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
                var students = allStudents?.Where(s => 
                    !string.IsNullOrEmpty(s.parentguardianphone) &&
                    s.parentguardianphone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "") == normalizedPhone
                ).ToList() ?? new List<Student>();

                // Convert students to appointment-like format
                var appointments = (students ?? new List<Student>())
                    .Select(s => new
                    {
                        id = s.id ?? "",
                        organisationid = s.organisationid ?? "",
                        customerName = $"{s.firstname} {s.lastname}".Trim(),
                        customerEmail = s.email ?? "",
                        customerPhone = s.parentguardianphone ?? "",
                        appointmentdate = DateTime.Now, // Students don't have appointment dates
                        eventDate = DateTime.Now,
                        eventType = "Student",
                        status = s.isactive == true ? "active" : "inactive",
                        totalAmount = 0m,
                        guestCount = 0,
                        hallName = "",
                        notes = $"Student ID: {s.id}, Class: {s.classname}",
                        createdAt = DateTime.Now
                    }).ToList();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments by mobile number");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all appointments (students) for admin
        /// </summary>
        [HttpPost("appointments/all")]
        public async Task<IActionResult> GetAllAppointments([FromBody] GetAllAppointmentsRequest request)
        {
            try
            {
                var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
                _logger.LogInformation("B2B get all appointments request from {CallingCompany}", callingCompany);

                // Get all students
                var studentReq = new StudentSelectReq { };
                var students = await _studentService.Select(studentReq);

                // Filter by organization if provided
                var filteredStudents = string.IsNullOrEmpty(request.OrganizationId)
                    ? students
                    : students?.Where(s => s.organisationid?.ToString() == request.OrganizationId).ToList() ?? new List<Student>();

                var appointments = filteredStudents
                    .Select(s => new
                    {
                        id = s.id ?? "",
                        organisationid = s.organisationid ?? "",
                        customerName = $"{s.firstname} {s.lastname}".Trim(),
                        customerEmail = s.email ?? "",
                        customerPhone = s.parentguardianphone ?? "",
                        appointmentdate = DateTime.Now,
                        eventDate = DateTime.Now,
                        eventType = "Student",
                        status = s.isactive == true ? "active" : "inactive",
                        totalAmount = 0m,
                        guestCount = 0,
                        hallName = "",
                        notes = $"Student ID: {s.id}, Class: {s.classname}",
                        createdAt = DateTime.Now
                    }).ToList();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all appointments");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class CheckUserRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class CheckUserResponse
    {
        public bool Exists { get; set; }
        public bool HasAppointments { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class GetAppointmentsByMobileRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class GetAllAppointmentsRequest
    {
        public string? OrganizationId { get; set; }
    }
}
