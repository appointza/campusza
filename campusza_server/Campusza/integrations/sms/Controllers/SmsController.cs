using Microsoft.AspNetCore.Mvc;
using Campusza.Sms.Services;
using Campusza.Sms.Models;

namespace Campusza.Sms.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmsController : ControllerBase
    {
        private readonly SmsService _smsService;
        private readonly ILogger<SmsController> _logger;

        public SmsController(SmsService smsService, ILogger<SmsController> logger)
        {
            _smsService = smsService;
            _logger = logger;
        }

        /// <summary>
        /// Send appointment status notification via WhatsApp/SMS
        /// </summary>
        /// <param name="request">AppointmentStatusSmsReq containing appointment details</param>
        /// <returns>Response indicating success or failure</returns>
        [HttpPost("send-appointment-status")]
        public async Task<IActionResult> SendAppointmentStatus([FromBody] AppointmentStatusSmsReq request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.mobilenumber))
                {
                    return BadRequest(new { success = false, message = "Mobile number is required" });
                }

                if (string.IsNullOrEmpty(request.CustomerName))
                {
                    return BadRequest(new { success = false, message = "Customer name is required" });
                }

                if (string.IsNullOrEmpty(request.AppointmentStatus))
                {
                    return BadRequest(new { success = false, message = "Appointment status is required" });
                }

                // Basic phone number validation
                if (request.mobilenumber.Length < 10)
                {
                    return BadRequest(new { success = false, message = "Invalid phone number format" });
                }

                _logger.LogInformation("Sending appointment status notification to phone number: {PhoneNumber}", request.mobilenumber);

                await _smsService.SendAppointmentStatus(request);

                return Ok(new
                {
                    success = true,
                    message = "Appointment status notification sent successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending appointment status notification to {PhoneNumber}", request?.mobilenumber);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error occurred while sending appointment status notification",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Send user book appointment notification via WhatsApp/SMS
        /// </summary>
        /// <param name="request">UserBookAppointmentSmsReq containing booking details</param>
        /// <returns>Response indicating success or failure</returns>
        [HttpPost("send-user-book-appointment")]
        public async Task<IActionResult> SendUserBookAppointment([FromBody] UserBookAppointmentSmsReq request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.mobilenumber))
                {
                    return BadRequest(new { success = false, message = "Mobile number is required" });
                }

                if (string.IsNullOrEmpty(request.OrganizationName))
                {
                    return BadRequest(new { success = false, message = "Organization name is required" });
                }

                if (string.IsNullOrEmpty(request.CustomerName))
                {
                    return BadRequest(new { success = false, message = "Customer name is required" });
                }

                // Basic phone number validation
                if (request.mobilenumber.Length < 10)
                {
                    return BadRequest(new { success = false, message = "Invalid phone number format" });
                }

                _logger.LogInformation("Sending user book appointment notification to phone number: {PhoneNumber}", request.mobilenumber);

                await _smsService.SendUserBookAppointment(request);

                return Ok(new
                {
                    success = true,
                    message = "User book appointment notification sent successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending user book appointment notification to {PhoneNumber}", request?.mobilenumber);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error occurred while sending user book appointment notification",
                    error = ex.Message
                });
            }
        }
    }
}

