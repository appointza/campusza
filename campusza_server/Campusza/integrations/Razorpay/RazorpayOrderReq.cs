using System.Collections.Generic;

namespace Campusza.Razorpay
{

    public class RazorpayOrderNotes
    {
        public long customerid { get; set; }
        public long? appointmentid { get; set; }
        public long organisation_location_id { get; set; }
        public long? eventid { get; set; }
        public long? website_id { get; set; }
        public int? page_count { get; set; }
    }

    public class WebsiteExportOrderReq
    {
        public long website_id { get; set; }
        public long user_id { get; set; }
        public int page_count { get; set; }
    }

    public class WebsiteExportOrderRes
    {
        public string orderid { get; set; }
        public string key { get; set; } // Razorpay key from ApplicationSettings for frontend
        public int amount { get; set; } // Amount in paise
        public string currency { get; set; }
        public string receipt { get; set; }
    }

    public class RazorpayOrderReq
    {
        public int amount { get; set; }
        public string currency { get; set; }
        public string receipt { get; set; }
        public RazorpayOrderNotes notes { get; set; }
    }
    public class RazorPayErrorContent
    {
        public string code { get; set; }
        public string description { get; set; }
        public string source { get; set; }
        public string step { get; set; }
        public string reason { get; set; }
        public RazorPayErrorMetadata metadata { get; set; }
        public string field { get; set; }
    }

    public class RazorPayErrorMetadata
    {
    }

    public class RazorPayError
    {
        public RazorPayErrorContent error { get; set; }
    }
    // Root myDeserializedClass = JsonConvert.DeserializeObject<Root>(myJsonResponse);
    public class RazorpayOrder
    {
        public string id { get; set; }
        public string entity { get; set; }
        public int amount { get; set; }
        public int amount_paid { get; set; }
        public int amount_due { get; set; }
        public string currency { get; set; }
        public string receipt { get; set; }
        public object offer_id { get; set; }
        public string status { get; set; }
        public int attempts { get; set; }
        public RazorpayOrderNotes notes { get; set; }
        public int created_at { get; set; }
    }

    public enum RazorpayErrorCodes
    {
        BAD_REQUEST_ERROR
    }
    public enum RazorpayStatusCodes
    {
        created,
        attempted,
        paid
    }
    

    public class RazorpayWebhookReqPayloadOrder
    {
        public RazorpayOrder entity { get; set; }
    }

    public class RazorpayWebhookReqPayload
    {
        public RazorpayWebhookReqPayloadOrder order { get; set; }
    }

    public class RazorpayWebhookReq
    {
        public string account_id { get; set; }
        public RazorpayWebhookReqPayload payload { get; set; }
    }

    // Razorpay Contact Models
    public class RazorpayContactReq
    {
        public string name { get; set; } = string.Empty;
        public string? email { get; set; }
        public string? contact { get; set; } // Phone number
        public string? type { get; set; } // vendor, customer, employee, self
        public string? reference_id { get; set; }
        public Dictionary<string, string>? notes { get; set; }
    }

    public class RazorpayContactRes
    {
        public string id { get; set; } = string.Empty;
        public string entity { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public string? email { get; set; }
        public string? contact { get; set; }
        public string? type { get; set; }
        public string? reference_id { get; set; }
        public Dictionary<string, string>? notes { get; set; }
        public bool active { get; set; }
        public int created_at { get; set; }
    }
}
