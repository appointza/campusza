using Microsoft.AspNetCore.Mvc;
using Campusza.Models;
using Campusza.Services;
using Campusza.Razorpay;
using Campusza.Utils;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace Campusza.Razorpay
{
    [Route("api/[controller]")]
    [ApiController]
    public class RazorpayController : ControllerBase
    {
        RazorpayService razorpayservice;
        // PaymentGatewayCredentialsService paymentGatewayCredentialsService;
        RequestState requeststate;
        IDbProvider dbprovider;
        IConfiguration configuration;
        
        // Price per page for website export (in rupees)
        private const int PRICE_PER_PAGE = 1;
        
        public RazorpayController(
            RazorpayService razorpayservice, 
            // PaymentGatewayCredentialsService paymentGatewayCredentialsService,
            RequestState requeststate,
            IDbProvider dbprovider,
            IConfiguration configuration)
        {
            this.razorpayservice = razorpayservice;
            // this.paymentGatewayCredentialsService = paymentGatewayCredentialsService;
            this.requeststate = requeststate;
            this.dbprovider = dbprovider;
            this.configuration = configuration;
        }
        
        /*
        private async Task<PaymentGatewayCredentials> GetRazorpayCredentialsFromDb(long organizationId)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                var credentials = await paymentGatewayCredentialsService.SelectTransaction(db, new PaymentGatewayCredentialsSelectReq
                {
                    organization_id = organizationId,
                    gateway_name = "razorpay",
                    is_active = true
                });
                
                if (credentials == null || credentials.Count == 0)
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, 
                        $"Razorpay credentials not found for organization {organizationId}. Please configure payment gateway credentials.");
                }
                
                return credentials.First();
            }
        }
        */
        
        /*
        private HttpClient CreateHttpClientWithCredentials(PaymentGatewayCredentials credentials)
        {
            var baseUrl = "https://api.razorpay.com/v1/";
            var client = new HttpClient();
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            // Create Basic Auth token: base64(api_key:api_secret)
            // IMPORTANT: Use ASCII encoding for Basic Auth (Razorpay requirement)
            var authString = $"{credentials.api_key}:{credentials.api_secret}";
            var authBytes = Encoding.ASCII.GetBytes(authString);
            var token = Convert.ToBase64String(authBytes);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", token);
            
            return client;
        }
        */
        /*
        [HttpPost("Order")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<RazorpayOrder>>> Select(ActionReq<RazorpayOrderReq> req)
        {
            ActionRes<RazorpayOrder> result = new ActionRes<RazorpayOrder>();

            try
            {
                // Get organization ID from user context
                long organizationId = requeststate.usercontext.organisationid;
                if (organizationId <= 0)
                {
                    return BadRequest(new { error = "Organization ID is required", message = "User must be associated with an organization" });
                }

                // Get Razorpay credentials from database
                var credentials = await GetRazorpayCredentialsFromDb(organizationId);
                
                // Create HttpClient with database credentials
                var client = CreateHttpClientWithCredentials(credentials);
                
                // Create order request
                var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, "orders");
                request.Content = new StringContent(JsonSerializer.Serialize(req.item), Encoding.UTF8, "application/json");
                
                var response = await client.SendAsync(request);
                var responseContentText = await response.Content.ReadAsStringAsync();
                
                if (response.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    result.item = JsonSerializer.Deserialize<RazorpayOrder>(responseContentText);
                }
                else
                {
                    throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, responseContentText);
                }
            }
            catch (AppException appEx)
            {
                return BadRequest(new { error = appEx.Message, message = "Error creating Razorpay order" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, message = "Unexpected error creating Razorpay order" });
            }

            return Ok(result);
        }
        */

        [HttpPost("CreateWebsiteExportOrder")]
        [AuthenticateMvc]
        public async Task<ActionResult<ActionRes<WebsiteExportOrderRes>>> CreateWebsiteExportOrder(ActionReq<WebsiteExportOrderReq> req)
        {
            ActionRes<WebsiteExportOrderRes> result = new ActionRes<WebsiteExportOrderRes>();

            try
            {
                // Calculate amount: PRICE_PER_PAGE per page
                int amount = req.item.page_count * PRICE_PER_PAGE; // Amount in rupees
                
                // Create Razorpay order request
                var razorpayReq = new RazorpayOrderReq
                {
                    amount = amount * 100, // Convert to paise (multiply by 100)
                    currency = "INR",
                    receipt = $"WEBZYS_EXPORT_{req.item.website_id}_{DateTime.UtcNow:yyyyMMddHHmmss}",
                    notes = new RazorpayOrderNotes
                    {
                        customerid = req.item.user_id,
                        organisation_location_id = 0,
                        appointmentid = null,
                        eventid = null,
                        website_id = req.item.website_id,
                        page_count = req.item.page_count
                    }
                };

                // For Webzys export, get Razorpay credentials from appsettings.json (not database)
                var client = GetHttpClientFromAppSettings();
                
                // Create order request
                var orderRequest = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, "orders");
                orderRequest.Content = new StringContent(JsonSerializer.Serialize(razorpayReq), Encoding.UTF8, "application/json");
                
                var orderResponse = await client.SendAsync(orderRequest);
                var orderResponseText = await orderResponse.Content.ReadAsStringAsync();
                
                RazorpayOrder razorpayOrder;
                if (orderResponse.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    razorpayOrder = JsonSerializer.Deserialize<RazorpayOrder>(orderResponseText);
                }
                else
                {
                    throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, orderResponseText);
                }
                
                // Get Razorpay key from appsettings.json (for frontend)
                string razorpayKey = configuration["ApplicationSettings:razorpay:key_id"] ?? "";
                if (string.IsNullOrEmpty(razorpayKey))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest, 
                        "Razorpay key_id is not configured in appsettings.json. Please configure ApplicationSettings:razorpay:key_id");
                }

                // Return response with key from appsettings.json
                result.item = new WebsiteExportOrderRes
                {
                    orderid = razorpayOrder.id,
                    key = razorpayKey,
                    amount = razorpayOrder.amount, // Already in paise
                    currency = razorpayOrder.currency,
                    receipt = razorpayOrder.receipt
                };
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, message = "Error creating payment order" });
            }

            return Ok(result);
        }

        /// <summary>
        /// Get HttpClient with Razorpay credentials from appsettings.json (for Webzys export)
        /// </summary>
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

        /*
        [HttpPost("CreateContact")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<RazorpayContactRes>>> CreateContact(ActionReq<RazorpayContactReq> req)
        {
            ActionRes<RazorpayContactRes> result = new ActionRes<RazorpayContactRes>();

            try
            {
                // Validate required fields
                if (string.IsNullOrEmpty(req.item?.name))
                {
                    return BadRequest(new { error = "Name is required", message = "Contact name cannot be empty" });
                }

                // Set default type to "vendor" if not provided
                if (string.IsNullOrEmpty(req.item.type))
                {
                    req.item.type = "vendor";
                }

                // Get organization ID from user context
                long organizationId = requeststate.usercontext.organisationid;
                if (organizationId <= 0)
                {
                    return BadRequest(new { error = "Organization ID is required", message = "User must be associated with an organization" });
                }

                // Get Razorpay credentials from database
                var credentials = await GetRazorpayCredentialsFromDb(organizationId);
                
                // Create HttpClient with database credentials
                var client = CreateHttpClientWithCredentials(credentials);
                
                // Create contact request
                var contactRequest = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, "contacts");
                
                var options = new JsonSerializerOptions
                {
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                };
                contactRequest.Content = new StringContent(JsonSerializer.Serialize(req.item, options), Encoding.UTF8, "application/json");
                
                var contactResponse = await client.SendAsync(contactRequest);
                var contactResponseText = await contactResponse.Content.ReadAsStringAsync();
                
                if (contactResponse.StatusCode == System.Net.HttpStatusCode.OK)
                {
                    result.item = JsonSerializer.Deserialize<RazorpayContactRes>(contactResponseText);
                }
                else
                {
                    throw new AppException(AppException.ErrorCodes.ErrorFromRazorpay, contactResponseText);
                }
            }
            catch (AppException appEx)
            {
                // Handle application-specific exceptions with detailed messages
                return BadRequest(new { error = appEx.Message, message = "Error creating contact in Razorpay" });
            }
            catch (Exception ex)
            {
                // Handle unexpected exceptions
                return BadRequest(new { error = ex.Message, message = "Unexpected error creating contact in Razorpay", stackTrace = ex.StackTrace });
            }

            return Ok(result);
        }
        */
    }
}
