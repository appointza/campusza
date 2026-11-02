using Campusza.Razorpay;
using Campusza.Services;
using Campusza.Utils;
using System.Linq;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace Campusza.PhonePe
{
    public class PhonePeService
    {
        // ApplicationSettingsService applicationsettingsservice;
        CustomCryptography customcryptography;
        bool isinitialized = false;
        string baseurl;
        string basehref;
        string merchantid;
        string payendpoint = "/pg/v1/pay";
        string checkstatusendpoint = "/pg/v1/status/{merchantId}/{merchantTransactionId}";
        string refundendpoint = "/pg/v1/refund";
        string saltkey;
        string saltindex;
        public PhonePeService(/*ApplicationSettingsService applicationsettingsservice, */CustomCryptography customcryptography)
        {
            // this.applicationsettingsservice = applicationsettingsservice;
            this.customcryptography = customcryptography;
        }
        public async Task Initialize()
        {
            /*
            var settings = (await this.applicationsettingsservice.Select(new Models.ApplicationSettingsSelectReq { })).First();
            baseurl = settings.settings.paymentsettings.phonepeconfig.url;
            basehref = settings.settings.paymentsettings.phonepeconfig.basehref;
            merchantid = settings.settings.paymentsettings.phonepeconfig.merchantid;
            saltkey = settings.settings.paymentsettings.phonepeconfig.saltkey;
            saltindex = settings.settings.paymentsettings.phonepeconfig.saltindex;
            */
            isinitialized = true;
        }
        public async Task<HttpClient> GetHttpClient()
        {
            if (!this.isinitialized)
            {
                await this.Initialize();
            }
            var client = new HttpClient();
            client.BaseAddress = new Uri(baseurl);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            //var token = customcryptography.EncodeBase64($"{appkey}:{appsecret}");
            //client.DefaultRequestHeaders.Add("Authorization", $"Basic {token}");
            return client;
        }
        public string GetXVerify(string base64payload,string endpoint)
        {
            // Step 1: Concatenate the payload, URL path, and salt key
            string concatenatedstring = base64payload + endpoint + saltkey;
            // Step 2: Hash the concatenated string using SHA256
            string hashresult = customcryptography.CalculateSHA256Hash(concatenatedstring);

            // Step 3: Concatenate the hash result, "###", and salt index
            string finalresult = hashresult + "###" + saltindex;

            return finalresult;
        }
        public async Task<PhonePeRes<PhonePePayRes>> Pay(PhonePePayReq req)
        {
            var client = await GetHttpClient();

            var result = new PhonePeRes<PhonePePayRes>();
            req.merchantId = merchantid;
            req.paymentInstrument.type = PhonePePaymentInstrumentTypes.PAY_PAGE.ToString();
            var base64payload = JsonSerializer.Serialize(req);
            base64payload = customcryptography.EncodeBase64(base64payload);
            var postdata = new PhonePeReq
            {
                request = base64payload
            };
            client.DefaultRequestHeaders.Add("X-VERIFY", GetXVerify(base64payload, payendpoint));
            var request = new HttpRequestMessage(HttpMethod.Post, basehref+payendpoint);
            request.Content = new StringContent(JsonSerializer.Serialize(postdata),
                                 Encoding.UTF8, "application/json");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<PhonePeRes<PhonePePayRes>>(responseContentText);

            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromPhonePe, responseContentText);
            }
            return result;
        }
        public async Task<PhonePeRes<PhonePeCheckStatusRes>> CheckStatus(string transactionid)
        {
            var client = await GetHttpClient();

            var result = new PhonePeRes<PhonePeCheckStatusRes>();
            var endpoint = checkstatusendpoint.Replace("{merchantId}", merchantid);
            endpoint = endpoint.Replace("{merchantTransactionId}", transactionid);

            client.DefaultRequestHeaders.Add("X-VERIFY", GetXVerify("", endpoint));
            client.DefaultRequestHeaders.Add("X-MERCHANT-ID", merchantid);
            var request = new HttpRequestMessage(HttpMethod.Get, basehref+endpoint);
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<PhonePeRes<PhonePeCheckStatusRes>>(responseContentText);

            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromPhonePe, responseContentText);
            }
            return result;
        }
        public async Task<PhonePeRes<PhonePeRefundRes>> Refund(PhonePeRefundReq req)
        {
            var client = await GetHttpClient();

            var result = new PhonePeRes<PhonePeRefundRes>();
            req.merchantId = merchantid;
            var base64payload = JsonSerializer.Serialize(req);
            base64payload = customcryptography.EncodeBase64(base64payload);
            var postdata = new PhonePeReq
            {
                request = base64payload
            };
            client.DefaultRequestHeaders.Add("X-VERIFY", GetXVerify(base64payload, refundendpoint));
            var request = new HttpRequestMessage(HttpMethod.Post, basehref + refundendpoint);
            request.Content = new StringContent(JsonSerializer.Serialize(postdata),
                                 Encoding.UTF8, "application/json");
            var response = await client.SendAsync(request);
            var responseContentText = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {

                result = JsonSerializer.Deserialize<PhonePeRes<PhonePeRefundRes>>(responseContentText);

            }
            else
            {
                throw new AppException(AppException.ErrorCodes.ErrorFromPhonePe, responseContentText);
            }
            return result;
        }
    }
}
