// TODO: Install Razorpay NuGet package - The Razorpay.Api package is required for this service
// Package may need to be installed manually: Install-Package Razorpay or similar
// using Razorpay.Api;
using Campusza.Models;
using Campusza.Services;
using Campusza.Utils;
using System.Linq;

namespace Campusza.Razorpay
{
    // TODO: Uncomment and restore this service once Razorpay.Api NuGet package is installed
    /*
    public class RazorpayV2Service
    {
        ApplicationSettingsService applicationsettingsservice;
        public RazorpayV2Service(ApplicationSettingsService applicationsettingsservice, CustomCryptography customcryptography)
        {
            this.applicationsettingsservice = applicationsettingsservice;            
        }
        public async Task<RayzorpayV2OrderCreateRes> OrderCreateTransaction(IDb db, RayzorpayV2OrderCreateReq req)
        {
            var appsettings = (await this.applicationsettingsservice.SelectTransaction(db, new ApplicationSettingsSelectReq())).First();

            Dictionary<string, object> input = new Dictionary<string, object>();
            input.Add("amount", req.amount);
            input.Add("currency", "INR");
            input.Add("receipt", req.receipt);

            string key = appsettings.settings.paymentsettings.razorpayconfig.appkey;
            string secret = appsettings.settings.paymentsettings.razorpayconfig.appsecret;

            RazorpayClient client = new RazorpayClient(key, secret);
            var order = client.Order.Create(input);

            var result = new RayzorpayV2OrderCreateRes();
            result.orderid = order["id"].ToString();
            return result;
        }
        // ... other methods commented out for now
    }
    */
    
    // Temporary stub to allow compilation
    public class RazorpayV2Service
    {
        // ApplicationSettingsService applicationsettingsservice;
        public RazorpayV2Service(/*ApplicationSettingsService applicationsettingsservice, */CustomCryptography customcryptography)
        {
            // this.applicationsettingsservice = applicationsettingsservice;            
        }
        public async Task<RayzorpayV2OrderCreateRes> OrderCreateTransaction(IDb db, RayzorpayV2OrderCreateReq req)
        {
            throw new System.NotImplementedException("RazorpayV2Service requires Razorpay.Api NuGet package. Please install it and uncomment the full implementation.");
        }
        public async Task<RayzorpayV2OrderFetchRes> OrderFetchTransaction(IDb db, RayzorpayV2OrderFetchReq req)
        {
            throw new System.NotImplementedException("RazorpayV2Service requires Razorpay.Api NuGet package. Please install it and uncomment the full implementation.");
        }
        public async Task<RazorpayV2PaymentFetchRes> PaymentFetchTransaction(IDb db, RazorpayV2PaymentFetchReq req)
        {
            throw new System.NotImplementedException("RazorpayV2Service requires Razorpay.Api NuGet package. Please install it and uncomment the full implementation.");
        }
        public async Task<RazorpayV2RefundCreateInstantRes> RefundCreateInstantTransaction(IDb db, RazorpayV2RefundCreateInstantReq req)
        {
            throw new System.NotImplementedException("RazorpayV2Service requires Razorpay.Api NuGet package. Please install it and uncomment the full implementation.");
        }
        public async Task<RazorpayV2RefundFetchRes> RefundFetchTransaction(IDb db, RazorpayV2RefundFetchReq req)
        {
            throw new System.NotImplementedException("RazorpayV2Service requires Razorpay.Api NuGet package. Please install it and uncomment the full implementation.");
        }
    }
}
