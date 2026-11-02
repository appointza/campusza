using Microsoft.AspNetCore.Mvc;
using Campusza.Sms.Models;
using Campusza.WhatsAppMsg.Services;

namespace Campusza.Sms.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OtpController : ControllerBase
    {
        private readonly WhatsAppMsg.Services.WhatsAppService _whatsAppService;
        private readonly ILogger<OtpController> _logger;

        public OtpController(WhatsAppMsg.Services.WhatsAppService whatsAppService, ILogger<OtpController> logger)
        {
            _whatsAppService = whatsAppService;
            _logger = logger;
        }

        /// <summary>
        /// Send OTP via WhatsApp to the specified phone number
        /// </summary>
        /// <param name="request">SendOtpRequest containing phone number and optional user name</param>
        /// <returns>SendOtpResponse indicating success or failure</returns>
        [HttpPost("send")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.PhoneNumber))
                {
                    return BadRequest(new { success = false, message = "Phone number is required" });
                }

                // Basic phone number validation
                if (request.PhoneNumber.Length < 10)
                {
                    return BadRequest(new { success = false, message = "Invalid phone number format" });
                }

                _logger.LogInformation("Sending OTP to phone number: {PhoneNumber}", request.PhoneNumber);

                var result = await _whatsAppService.SendOtpAsync(request.PhoneNumber, request.UserName);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        message_id = result.MessageId
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = result.Message,
                        error = result.Error
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending OTP to {PhoneNumber}", request.PhoneNumber);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error occurred while sending OTP",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Verify the OTP code for the specified phone number
        /// </summary>
        /// <param name="request">VerifyOtpRequest containing phone number and OTP code</param>
        /// <returns>VerifyOtpResponse indicating if OTP is valid</returns>
        [HttpPost("verify")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.PhoneNumber))
                {
                    return BadRequest(new { success = false, message = "Phone number is required" });
                }

                if (string.IsNullOrEmpty(request.OtpCode))
                {
                    return BadRequest(new { success = false, message = "OTP code is required" });
                }

                // Basic OTP validation
                if (request.OtpCode.Length != 6 || !request.OtpCode.All(char.IsDigit))
                {
                    return BadRequest(new { success = false, message = "Invalid OTP code format" });
                }

                _logger.LogInformation("Verifying OTP for phone number: {PhoneNumber}", request.PhoneNumber);

                var result = _whatsAppService.VerifyOtpAsync(request.PhoneNumber, request.OtpCode);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        is_valid = result.IsValid
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = result.Message,
                        is_valid = result.IsValid
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying OTP for {PhoneNumber}", request.PhoneNumber);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error occurred while verifying OTP",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Health check endpoint for OTP service
        /// </summary>
        /// <returns>Service status</returns>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new
            {
                success = true,
                message = "OTP service is running",
                timestamp = DateTime.UtcNow
            });
        }
    }
}

