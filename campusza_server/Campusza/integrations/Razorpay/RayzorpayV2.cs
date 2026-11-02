using System.Text.Json.Serialization;

namespace Campusza.Razorpay
{
    public class RayzorpayV2
    {
    }
    public class RayzorpayV2OrderCreateReq
    {
        public int amount { get; set; }
        public string receipt { get; set; }
    }
    public class RayzorpayV2OrderCreateRes
    {
        public string orderid { get; set; }
    }
    public class RayzorpayV2OrderFetchReq
    {
        public string orderid { get; set; }
    }
    public class RayzorpayV2OrderFetchRes
    {
        public string status { get; set; }
        public string receipt { get; set; }
    }
    public static class RayzorpayV2OrderStatuses
    {
        public const string created = "created";
        public const string attempted = "attempted";
        public const string paid = "paid";
    }
    public static class RayzorpayV2WebhookEvents
    {
        public const string orderpaid = "order.paid";
        public const string paymentfailed = "payment.failed";
        public const string refundprocessed = "refund.processed";
        public const string refundfailed = "refund.failed";
    }
    public class RazorpayV2WebhookReq
    {
        [JsonPropertyName("event")]
        public string Event { get; set; }
        public RazorpayV2WebhookReqPayload payload { get; set; }

    }
    public class RazorpayV2WebhookReqPayload
    {
        public RazorpayV2WebhookReqPayloadPayment payment { get; set; }
        public RazorpayV2WebhookReqPayloadRefund refund { get; set; }
        public RazorpayV2WebhookReqPayloadOrder order { get; set; }
    }
    public class RazorpayV2WebhookReqPayloadPayment
    {
        public RazorpayV2WebhookReqPayloadPaymentEntity entity { get; set; }
    }
    public class RazorpayV2WebhookReqPayloadPaymentEntity
    {
        public string order_id { get; set; }
    }
    public class RazorpayV2WebhookReqPayloadRefund
    {
        public RazorpayV2WebhookReqPayloadRefundEntity entity { get; set; }
    }
    public class RazorpayV2WebhookReqPayloadRefundEntity
    {
        public string receipt { get; set; }
    }
    public class RazorpayV2WebhookReqPayloadOrder
    {
        public RazorpayV2WebhookReqPayloadOrderEntity entity { get; set; }
    }
    public class RazorpayV2WebhookReqPayloadOrderEntity
    {
        public string receipt { get; set; }
    }
    public class RazorpayV2PaymentFetchReq
    {
        public string orderid { get; set; }
    }
    public class RazorpayV2PaymentFetchRes
    {
        public string id { get; set; }
    }
    public class RazorpayV2RefundCreateInstantReq
    {
        public string paymentid { get; set; }
        public int amount { get; set; }
        public string receipt { get; set; }
    }
    public class RazorpayV2RefundCreateInstantRes
    {
        public string id { get; set; }
        public string status { get; set; }
    }
    public static class RazorpayV2RefundStatuses
    {
        public const string pending = "pending";
        public const string processed = "processed";
        public const string failed = "failed";
    }
    public class RazorpayV2RefundFetchReq
    {
        public string refundid { get; set; }
    }
    public class RazorpayV2RefundFetchRes
    {
        public string status { get; set; }
    }
}
