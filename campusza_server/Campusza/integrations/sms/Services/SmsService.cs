using System.Net.Http.Headers;
using Campusza.Sms.Models;

namespace Campusza.Sms.Services
{
    public class SmsService
    {
        public async Task SendOtp(SmsSendOtpReq req)
        {
            var s = $"https://api.growaasan.com/api/sendPosCommunication?clietnId=105615&authKey=ZWtLVXFzM0JOWEpuenUvbUVVYzg5dz09&communicationType=1&smsTemplateId=1707175983182978377&country_code=91&customerMobile={req.mobilenumber}&varCount=1&var1={req.otp}";
            
            var handler = new HttpClientHandler();
            handler.ClientCertificateOptions = ClientCertificateOption.Manual;
            handler.ServerCertificateCustomValidationCallback =
                (httpRequestMessage, cert, cetChain, policyErrors) =>
                {
                    return true;
                };
            var client = new HttpClient(handler);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            var gstres = await client.GetAsync(s);
            var gstrescontentstring = await gstres.Content.ReadAsStringAsync();
        }

        public async Task SendAppointmentStatus(AppointmentStatusSmsReq req)
        {
            var url = $"https://api.growaasan.com/api/sendPosCommunication?clietnId=105615&authKey=ZWtLVXFzM0JOWEpuenUvbUVVYzg5dz09&communicationType=2&waTemplateName=app_status&waTemplateLang=en&country_code=91&customerMobile={req.mobilenumber}&varCount=7&var1={Uri.EscapeDataString(req.CustomerName)}&var2={Uri.EscapeDataString(req.AppointmentStatus)}&var3={Uri.EscapeDataString(req.AppointmentDate)}&var4={Uri.EscapeDataString(req.AppointmentTime)}&var5={Uri.EscapeDataString(req.Location)}&var6={Uri.EscapeDataString(req.ServiceType)}&var7={Uri.EscapeDataString(req.OrganisationName)}";
            
            var handler = new HttpClientHandler();
            handler.ClientCertificateOptions = ClientCertificateOption.Manual;
            handler.ServerCertificateCustomValidationCallback =
                (httpRequestMessage, cert, cetChain, policyErrors) =>
                {
                    return true;
                };
            var client = new HttpClient(handler);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            var response = await client.GetAsync(url);
            var responseContent = await response.Content.ReadAsStringAsync();
        }

        public async Task SendUserBookAppointment(UserBookAppointmentSmsReq req)
        {
            var url = $"https://api.growaasan.com/api/sendPosCommunication?clietnId=105615&authKey=ZWtLVXFzM0JOWEpuenUvbUVVYzg5dz09&communicationType=2&waTemplateName=booking_status&waTemplateLang=en&country_code=91&customerMobile={req.mobilenumber}&varCount=6&var1={Uri.EscapeDataString(req.OrganizationName)}&var2={Uri.EscapeDataString(req.CustomerName)}&var3={Uri.EscapeDataString(req.AppointmentDate)}&var4={Uri.EscapeDataString(req.AppointmentTime)}&var5={Uri.EscapeDataString(req.ServiceType)}&var6={Uri.EscapeDataString(req.Location)}";
            
            var handler = new HttpClientHandler();
            handler.ClientCertificateOptions = ClientCertificateOption.Manual;
            handler.ServerCertificateCustomValidationCallback =
                (httpRequestMessage, cert, cetChain, policyErrors) =>
                {
                    return true;
                };
            var client = new HttpClient(handler);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            var response = await client.GetAsync(url);
            var responseContent = await response.Content.ReadAsStringAsync();
        }
    }
}

