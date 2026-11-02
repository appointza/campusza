using Microsoft.Extensions.Options;
using Campusza.WhatsAppMsg.Models;
using Campusza.Sms.Models;
using Campusza.Utils;
using System.Text;
using System.Text.Json;

namespace Campusza.WhatsAppMsg.Services
{
    public class WhatsAppService
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationEnvironment _appSettings;
        private readonly ILogger<WhatsAppService> _logger;
        private readonly Dictionary<string, OtpData> _otpStorage = new();

        public WhatsAppService(HttpClient httpClient, IOptions<ApplicationEnvironment> appSettings, ILogger<WhatsAppService> logger)
        {
            _httpClient = httpClient;
            _appSettings = appSettings.Value;
            _logger = logger;
        }

        public async Task<SendOtpResponse> SendOtpAsync(string phoneNumber, string? userName = null)
        {
            try
            {
                // Generate 6-digit OTP
                var otpCode = GenerateOtp();
                var expiryTime = DateTime.UtcNow.AddMinutes(5); // OTP expires in 5 minutes

                // Store OTP for verification
                var otpKey = $"{phoneNumber}_{DateTime.UtcNow:yyyyMMddHHmm}";
                _otpStorage[otpKey] = new OtpData
                {
                    Code = otpCode,
                    PhoneNumber = phoneNumber,
                    ExpiryTime = expiryTime,
                    CreatedAt = DateTime.UtcNow
                };

                // Clean up expired OTPs
                CleanupExpiredOtps();

                // Format phone number (remove any non-digit characters and add country code if needed)
                var formattedPhoneNumber = FormatPhoneNumber(phoneNumber);

                // Create WhatsApp message request
                var request = new WhatsAppSendMessageRequest
                {
                    To = formattedPhoneNumber,
                    Template = new WhatsAppTemplate
                    {
                        Name = "otp_verification", // You'll need to create this template in WhatsApp Business Manager
                        Language = new WhatsAppLanguage { Code = "en_US" },
                        Components = new List<WhatsAppComponent>
                        {
                            new WhatsAppComponent
                            {
                                Type = "body",
                                Parameters = new List<WhatsAppParameter>
                                {
                                    new WhatsAppParameter { Type = "text", Text = userName ?? "User" },
                                    new WhatsAppParameter { Type = "text", Text = otpCode }
                                }
                            }
                        }
                    }
                };

                // Send message via WhatsApp API
                var response = await SendWhatsAppMessageAsync(request);

                if (response.Error != null)
                {
                    _logger.LogError("WhatsApp API error: {Error}", response.Error.Message);
                    return new SendOtpResponse
                    {
                        Success = false,
                        Message = "Failed to send OTP",
                        Error = response.Error.Message
                    };
                }

                _logger.LogInformation("OTP sent successfully to {PhoneNumber}", phoneNumber);
                return new SendOtpResponse
                {
                    Success = true,
                    Message = "OTP sent successfully",
                    MessageId = response.Messages?.FirstOrDefault()?.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending OTP to {PhoneNumber}", phoneNumber);
                return new SendOtpResponse
                {
                    Success = false,
                    Message = "Failed to send OTP",
                    Error = ex.Message
                };
            }
        }

        public VerifyOtpResponse VerifyOtpAsync(string phoneNumber, string otpCode)
        {
            try
            {
                // Find the most recent OTP for this phone number
                var otpKey = _otpStorage.Keys
                    .Where(key => key.StartsWith($"{phoneNumber}_"))
                    .OrderByDescending(key => key)
                    .FirstOrDefault();

                if (otpKey == null || !_otpStorage.TryGetValue(otpKey, out var otpData))
                {
                    return new VerifyOtpResponse
                    {
                        Success = false,
                        Message = "No OTP found for this phone number",
                        IsValid = false
                    };
                }

                // Check if OTP has expired
                if (DateTime.UtcNow > otpData.ExpiryTime)
                {
                    _otpStorage.Remove(otpKey);
                    return new VerifyOtpResponse
                    {
                        Success = false,
                        Message = "OTP has expired",
                        IsValid = false
                    };
                }

                // Verify OTP code
                if (otpData.Code != otpCode)
                {
                    return new VerifyOtpResponse
                    {
                        Success = false,
                        Message = "Invalid OTP code",
                        IsValid = false
                    };
                }

                // OTP is valid, remove it from storage
                _otpStorage.Remove(otpKey);

                _logger.LogInformation("OTP verified successfully for {PhoneNumber}", phoneNumber);
                return new VerifyOtpResponse
                {
                    Success = true,
                    Message = "OTP verified successfully",
                    IsValid = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying OTP for {PhoneNumber}", phoneNumber);
                return new VerifyOtpResponse
                {
                    Success = false,
                    Message = "Failed to verify OTP",
                    IsValid = false
                };
            }
        }

        private async Task<WhatsAppSendMessageResponse> SendWhatsAppMessageAsync(WhatsAppSendMessageRequest request)
        {
            var url = $"{_appSettings.whatsapp.base_url}/{_appSettings.whatsapp.api_version}/{_appSettings.whatsapp.phone_number_id}/messages";

            var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_appSettings.whatsapp.api_key}");

            var response = await _httpClient.PostAsync(url, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("WhatsApp API request failed with status {StatusCode}: {Response}", 
                    response.StatusCode, responseContent);
            }

            return JsonSerializer.Deserialize<WhatsAppSendMessageResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }) ?? new WhatsAppSendMessageResponse();
        }

        private string GenerateOtp()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        private string FormatPhoneNumber(string phoneNumber)
        {
            // Remove all non-digit characters
            var digitsOnly = new string(phoneNumber.Where(char.IsDigit).ToArray());

            // If the number doesn't start with country code, assume it's Indian (+91)
            if (digitsOnly.Length == 10)
            {
                digitsOnly = "91" + digitsOnly;
            }

            return digitsOnly;
        }

        public string GenerateOTP(int length = 6)
        {
            return GenerateOtp();
        }

        public async Task<bool> SendOTPAsync(string phoneNumber, string otp, string? customerName = null)
        {
            try
            {
                var response = await SendOtpAsync(phoneNumber, customerName);
                return response.Success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending OTP to {PhoneNumber}", phoneNumber);
                return false;
            }
        }

        public async Task<bool> SendTextMessageAsync(string phoneNumber, string message)
        {
            try
            {
                // Format phone number
                var formattedPhoneNumber = FormatPhoneNumber(phoneNumber);

                // Create WhatsApp message request for text message
                var request = new WhatsAppSendMessageRequest
                {
                    To = formattedPhoneNumber,
                    Type = "text",
                    Text = new WhatsAppText
                    {
                        Body = message
                    }
                };

                // Send message via WhatsApp API
                var response = await SendWhatsAppMessageAsync(request);

                if (response.Error != null)
                {
                    _logger.LogError("WhatsApp API error: {Error}", response.Error.Message);
                    return false;
                }

                _logger.LogInformation("Text message sent successfully to {PhoneNumber}", phoneNumber);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending text message to {PhoneNumber}", phoneNumber);
                return false;
            }
        }

        private void CleanupExpiredOtps()
        {
            var expiredKeys = _otpStorage
                .Where(kvp => DateTime.UtcNow > kvp.Value.ExpiryTime)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in expiredKeys)
            {
                _otpStorage.Remove(key);
            }
        }

        /// <summary>
        /// Send WhatsApp notification when appointment is booked - sends to organization user
        /// </summary>
        public async Task<bool> SendBookingNotificationAsync(string customerMobile, string hospitalName, string customerName, DateTime appointmentDate, string appointmentTime, string serviceName, string department)
        {
            try
            {
                // Extract country code and mobile number
                string countryCode = "91";
                string mobileNumber = customerMobile?.Replace("+", "") ?? "";
                
                // If mobile starts with country code, extract it
                if (mobileNumber.StartsWith("91") && mobileNumber.Length > 10)
                {
                    countryCode = "91";
                    mobileNumber = mobileNumber.Substring(2);
                }
                else if (!string.IsNullOrEmpty(mobileNumber) && mobileNumber.Length > 10)
                {
                    // Try to extract country code (assume first 1-3 digits are country code)
                    countryCode = mobileNumber.Substring(0, mobileNumber.Length - 10);
                    mobileNumber = mobileNumber.Substring(countryCode.Length);
                }
                
                // Format date as DD/MM/YY
                string formattedDate = appointmentDate.ToString("dd/MM/yy");
                
                // Format time (already formatted, but ensure it's in the right format)
                string formattedTime = appointmentTime;
                
                // Build URL with query parameters
                var baseUrl = "https://api.growaasan.com/api/sendPosCommunication";
                var queryParams = new System.Collections.Specialized.NameValueCollection
                {
                    { "clietnId", "105615" },
                    { "authKey", "ZWtLVXFzM0JOWEpuenUvbUVVYzg5dz09" },
                    { "communicationType", "2" },
                    { "waTemplateName", "booking_status" },
                    { "waTemplateLang", "en" },
                    { "country_code", countryCode },
                    { "customerMobile", mobileNumber },
                    { "varCount", "6" },
                    { "var1", hospitalName ?? "" },
                    { "var2", customerName ?? "" },
                    { "var3", formattedDate },
                    { "var4", formattedTime },
                    { "var5", serviceName ?? "" },
                    { "var6", department ?? "" }
                };

                var uriBuilder = new UriBuilder(baseUrl);
                var query = string.Join("&", queryParams.AllKeys.Select(key => $"{Uri.EscapeDataString(key)}={Uri.EscapeDataString(queryParams[key])}"));
                uriBuilder.Query = query;

                _httpClient.DefaultRequestHeaders.Clear();
                var response = await _httpClient.GetAsync(uriBuilder.ToString());
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Booking notification sent successfully to {Mobile}", customerMobile);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send booking notification. Status: {StatusCode}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending booking notification to {Mobile}", customerMobile);
                return false;
            }
        }

        /// <summary>
        /// Send WhatsApp notification when appointment status changes - sends to customer
        /// </summary>
        public async Task<bool> SendStatusNotificationAsync(string customerMobile, string customerName, string status, DateTime appointmentDate, string appointmentTime, string location, string department, string hospitalName)
        {
            try
            {
                // Extract country code and mobile number
                string countryCode = "91";
                string mobileNumber = customerMobile?.Replace("+", "") ?? "";
                
                // If mobile starts with country code, extract it
                if (mobileNumber.StartsWith("91") && mobileNumber.Length > 10)
                {
                    countryCode = "91";
                    mobileNumber = mobileNumber.Substring(2);
                }
                else if (!string.IsNullOrEmpty(mobileNumber) && mobileNumber.Length > 10)
                {
                    // Try to extract country code (assume first 1-3 digits are country code)
                    countryCode = mobileNumber.Substring(0, mobileNumber.Length - 10);
                    mobileNumber = mobileNumber.Substring(countryCode.Length);
                }
                
                // Format date as DD/MM/YY
                string formattedDate = appointmentDate.ToString("dd/MM/yy");
                
                // Format time (already formatted, but ensure it's in the right format)
                string formattedTime = appointmentTime;
                
                // Build URL with query parameters
                var baseUrl = "https://api.growaasan.com/api/sendPosCommunication";
                var queryParams = new System.Collections.Specialized.NameValueCollection
                {
                    { "clietnId", "105615" },
                    { "authKey", "ZWtLVXFzM0JOWEpuenUvbUVVYzg5dz09" },
                    { "communicationType", "2" },
                    { "waTemplateName", "app_status" },
                    { "waTemplateLang", "en" },
                    { "country_code", countryCode },
                    { "customerMobile", mobileNumber },
                    { "varCount", "7" },
                    { "var1", customerName ?? "" },
                    { "var2", status ?? "" },
                    { "var3", formattedDate },
                    { "var4", formattedTime },
                    { "var5", location ?? "" },
                    { "var6", department ?? "" },
                    { "var7", hospitalName ?? "" }
                };

                var uriBuilder = new UriBuilder(baseUrl);
                var query = string.Join("&", queryParams.AllKeys.Select(key => $"{Uri.EscapeDataString(key)}={Uri.EscapeDataString(queryParams[key])}"));
                uriBuilder.Query = query;

                _httpClient.DefaultRequestHeaders.Clear();
                var response = await _httpClient.GetAsync(uriBuilder.ToString());
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Status notification sent successfully to {Mobile}", customerMobile);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send status notification. Status: {StatusCode}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending status notification to {Mobile}", customerMobile);
                return false;
            }
        }

        private class OtpData
        {
            public string Code { get; set; } = string.Empty;
            public string PhoneNumber { get; set; } = string.Empty;
            public DateTime ExpiryTime { get; set; }
            public DateTime CreatedAt { get; set; }
        }
    }
}

