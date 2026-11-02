namespace Campusza.Sms.Models
{
    public class SmsSendOtpReq
    {
        public string otp { get; set; }
        public string mobilenumber { get; set; }
    }

    public class AppointmentStatusSmsReq
    {
        public string mobilenumber { get; set; }
        public string CustomerName { get; set; }
        public string AppointmentStatus { get; set; }
        public string AppointmentDate { get; set; }
        public string AppointmentTime { get; set; }
        public string Location { get; set; }
        public string ServiceType { get; set; }
        public string OrganisationName { get; set; }
    }

    public class UserBookAppointmentSmsReq
    {
        public string mobilenumber { get; set; }
        public string OrganizationName { get; set; }
        public string CustomerName { get; set; }
        public string AppointmentDate { get; set; }
        public string AppointmentTime { get; set; }
        public string ServiceType { get; set; }
        public string Location { get; set; }
    }

    // OTP specific DTOs
    public class SendOtpRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string? UserName { get; set; }
    }

    public class SendOtpResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? MessageId { get; set; }
        public string? Error { get; set; }
    }

    public class VerifyOtpRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }

    public class VerifyOtpResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsValid { get; set; }
    }
}

