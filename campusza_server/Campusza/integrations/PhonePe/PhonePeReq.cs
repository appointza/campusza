using System.Transactions;

namespace Campusza.PhonePe
{

    public class PhonePeReq
    {
        public string request { get; set; } = "";
    }
    public class PhonePeBase64Res
    {
        public string response { get; set; } = "";
    }
    public class PhonePeRes<T>
    {
        public bool success { get; set; }
        public string code { get; set; } = "";
        public string message { get; set; } = "";
        public T data { get; set; }
    }
    public enum PhonePeTransactionStatusCodes
    {
        PAYMENT_SUCCESS,
        PAYMENT_PENDING
    }
    public class PhonePePayReq
    {
        public string merchantId { get; set; } = "";
        public string merchantTransactionId { get; set; } = "";
        public string merchantUserId { get; set; } = "";
        public int amount { get; set; }
        public string redirectUrl { get; set; } = "";
        public string redirectMode { get; set; } = "";
        public string callbackUrl { get; set; } = "";
        public string mobileNumber { get; set; } = "";
        public PhonePePaymentInstrument paymentInstrument { get; set; } = new PhonePePaymentInstrument();
    }
    public enum PhonePePayRedirectModes
    {
        REDIRECT,
        POST
    }
    public class PhonePePaymentInstrument
    {
        public string type { get; set; }
        
    }
    public enum PhonePePaymentInstrumentTypes
    {
        PAY_PAGE
    }
    public class PhonePePayResRedirectInfo
    {
        public string url { get; set; }
        public string method { get; set; }
    }

    public class PhonePePayResInstrumentResponse
    {
        public string type { get; set; }
        public PhonePePayResRedirectInfo redirectInfo { get; set; }
    }

    public class PhonePePayRes
    {
        public string merchantId { get; set; }
        public string merchantTransactionId { get; set; }
        public PhonePePayResInstrumentResponse instrumentResponse { get; set; }
    }
   

    public class PhonePeServerToServerCallbackReq
    {
        //public string MerchantId { get; set; }
        public string merchantTransactionId { get; set; }
        //public string TransactionId { get; set; }
        //public int Amount { get; set; }
        //public string State { get; set; }
        //public string ResponseCode { get; set; }
        //public PhonePePaymentInstrument PaymentInstrument { get; set; }
    }
    public class PhonePeCheckStatusRes
    {
        public string merchantId { get; set; }
        public string merchantTransactionId { get; set; }
        public string transactionId { get; set; }
        public int amount { get; set; }
        public string state { get; set; }
        public string responseCode { get; set; }
        public PhonePePaymentInstrument paymentInstrument { get; set; }
    }
    public class PhonePeRefundReq
    {
        public string merchantId { get; set; }
        public string merchantUserId { get; set; }
        public string originalTransactionId { get; set; }
        public string merchantTransactionId { get; set; }
        public int amount { get; set; }
        public string callbackUrl { get; set; }
    }
    public class PhonePeRefundRes
    {
        public string merchantId { get; set; }
        public string merchantTransactionId { get; set; }
        public string transactionId { get; set; }
        public int amount { get; set; }
        public string state { get; set; }
        public string responseCode { get; set; }
    }
}
