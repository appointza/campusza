using System.Text.Json.Serialization;

namespace Campusza.WhatsAppMsg.Models
{
    public class WhatsAppSendMessageRequest
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = "whatsapp";

        [JsonPropertyName("to")]
        public string To { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = "template";

        [JsonPropertyName("template")]
        public WhatsAppTemplate? Template { get; set; }

        [JsonPropertyName("text")]
        public WhatsAppText? Text { get; set; }
    }

    public class WhatsAppTemplate
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("language")]
        public WhatsAppLanguage Language { get; set; } = new();

        [JsonPropertyName("components")]
        public List<WhatsAppComponent>? Components { get; set; }
    }

    public class WhatsAppLanguage
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = "en_US";
    }

    public class WhatsAppComponent
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("parameters")]
        public List<WhatsAppParameter>? Parameters { get; set; }
    }

    public class WhatsAppParameter
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "text";

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }

    public class WhatsAppText
    {
        [JsonPropertyName("body")]
        public string Body { get; set; } = string.Empty;
    }

    public class WhatsAppSendMessageResponse
    {
        [JsonPropertyName("messaging_product")]
        public string MessagingProduct { get; set; } = string.Empty;

        [JsonPropertyName("contacts")]
        public List<WhatsAppContact>? Contacts { get; set; }

        [JsonPropertyName("messages")]
        public List<WhatsAppMessage>? Messages { get; set; }

        [JsonPropertyName("error")]
        public WhatsAppError? Error { get; set; }
    }

    public class WhatsAppContact
    {
        [JsonPropertyName("input")]
        public string Input { get; set; } = string.Empty;

        [JsonPropertyName("wa_id")]
        public string WaId { get; set; } = string.Empty;
    }

    public class WhatsAppMessage
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
    }

    public class WhatsAppError
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("error_subcode")]
        public int? ErrorSubcode { get; set; }

        [JsonPropertyName("fbtrace_id")]
        public string FbTraceId { get; set; } = string.Empty;
    }
}

