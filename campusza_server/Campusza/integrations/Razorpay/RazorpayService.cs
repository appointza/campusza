using Campusza.Models;
using Campusza.Services;
using Campusza.Utils;
using System.Linq;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using static System.Net.WebRequestMethods;
using Microsoft.Extensions.Configuration;

namespace Campusza.Razorpay
{
    public class RazorpayService
    {
        // ApplicationSettingsService applicationsettingsservice;
        CustomCryptography customcryptography;
        IConfiguration configuration;
        bool isinitialized = false;
        string appkey;
        string appsecret;
        string baseurl;
        string orderendpoint = "orders";

        // ... methods ...

        public RazorpayService(/*ApplicationSettingsService applicationsettingsservice, */CustomCryptography customcryptography, IConfiguration configuration)
        {
            // this.applicationsettingsservice = applicationsettingsservice;
            this.customcryptography = customcryptography;
            this.configuration = configuration;
        }
        public async Task Initialize()
        {
            /*
            var settings = (await this.applicationsettingsservice.Select(new Models.ApplicationSettingsSelectReq { })).First();
            baseurl = settings.settings.paymentsettings.razorpayconfig.produrl;
            appkey = settings.settings.paymentsettings.razorpayconfig.appkey;
            appsecret = settings.settings.paymentsettings.razorpayconfig.appsecret;
            */
            
            // Validate and set default if empty
            if (string.IsNullOrEmpty(baseurl))
            {
                // Default Razorpay API URL
                baseurl = "https://api.razorpay.com/v1/";
            }
            else if (!baseurl.EndsWith("/"))
            {
                baseurl = baseurl + "/";
            }
            
            // Validate credentials are loaded from appsettings.json
            if (string.IsNullOrEmpty(appkey))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    "Razorpay App Key (key_id) is not configured in appsettings.json. " +
                    "Please add it under ApplicationSettings.razorpay.key_id");
            }
            
            if (string.IsNullOrEmpty(appsecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    "Razorpay App Secret (key_secret) is not configured in appsettings.json. " +
                    "Please add it under ApplicationSettings.razorpay.key_secret");
            }
            
            isinitialized = true;
        }
        public async Task<HttpClient> GetHttpClient()
        {
            if(!this.isinitialized)
            {
                await this.Initialize();
            }
            
            // Safety check - should not happen if Initialize() worked correctly
            if (string.IsNullOrEmpty(baseurl))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Razorpay base URL is not configured. Please configure it in Application Settings.");
            }

            // Validate credentials before creating client
            if (string.IsNullOrEmpty(appkey) || string.IsNullOrEmpty(appsecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, "Razorpay credentials (appkey or appsecret) are missing. Please check appsettings.json under ApplicationSettings.razorpay");
            }
            
            var client = new HttpClient();
            client.BaseAddress = new Uri(baseurl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            // Create Basic Auth token: base64(key_id:key_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var credentials = $"{appkey}:{appsecret}";
            var credentialsBytes = Encoding.ASCII.GetBytes(credentials);
            var token = Convert.ToBase64String(credentialsBytes);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            
            return client;
        }
        public async Task<RazorpayOrder> CreateOrder(RazorpayOrderReq req)
        {
            var result = new RazorpayOrder();
            var client = await GetHttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, orderendpoint);
            request.Content = new StringContent(JsonSerializer.Serialize(req),
                                 Encoding.UTF8, "application/json");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<RazorpayOrder>(responseContentText);
                
            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
            }
            return result;
        }
        public async Task<RazorpayOrder> FetchOrder(string orderid)
        {
            var result = new RazorpayOrder();
            var client = await GetHttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, $"{orderendpoint}/{orderid}");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<RazorpayOrder>(responseContentText);

            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
            }
            return result;
        }

        private HttpClient GetHttpClientFromAppSettings()
        {
            // Get credentials directly from appsettings.json
            var keyId = configuration["ApplicationSettings:razorpay:key_id"];
            var keySecret = configuration["ApplicationSettings:razorpay:key_secret"];
            
            if (string.IsNullOrEmpty(keyId) || string.IsNullOrEmpty(keySecret))
            {
                throw new AppException(AppException.ErrorCodes.BadRequest, 
                    "Razorpay credentials are missing in appsettings.json. Please configure ApplicationSettings:razorpay:key_id and ApplicationSettings:razorpay:key_secret");
            }
            
            var baseUrl = "https://api.razorpay.com/v1/";
            var client = new HttpClient();
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            // Create Basic Auth token: base64(key_id:key_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var credentials = $"{keyId}:{keySecret}";
            var credentialsBytes = Encoding.ASCII.GetBytes(credentials);
            var token = Convert.ToBase64String(credentialsBytes);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            
            return client;
        }

        public async Task<RazorpayContactRes> CreateContact(RazorpayContactReq req)
        {
            var result = new RazorpayContactRes();
            var client = GetHttpClientFromAppSettings();
            var request = new HttpRequestMessage(HttpMethod.Post, "contacts");
            
            var options = new JsonSerializerOptions
            {
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
            request.Content = new StringContent(JsonSerializer.Serialize(req, options), Encoding.UTF8, "application/json");
            
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                result = JsonSerializer.Deserialize<RazorpayContactRes>(responseContentText);
            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
            }
            return result;
        }
    }
}
