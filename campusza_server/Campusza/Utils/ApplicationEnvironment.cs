
namespace Campusza.Utils
{
    public class ApplicationEnvironment
    {
        public string postgresqlconnection { get; set; }
        public ApplicationEnvironmentAwsS3ConfigData awss3config { get; set; } = new ApplicationEnvironmentAwsS3ConfigData();
        public string jwtsecret { get; set; }
        public ApplicationEnvironmentRazorpayConfigData razorpay { get; set; } = new ApplicationEnvironmentRazorpayConfigData();
        public ApplicationEnvironmentFirebaseConfigData firebase { get; set; } = new ApplicationEnvironmentFirebaseConfigData();
        public ApplicationEnvironmentWhatsAppConfigData whatsapp { get; set; } = new ApplicationEnvironmentWhatsAppConfigData();
        public ApplicationEnvironmentRedisConfigData redis { get; set; } = new ApplicationEnvironmentRedisConfigData();
        public string baseUrl { get; set; }
    }
    public class ApplicationEnvironmentAwsS3ConfigData
    {
        public bool iss3enabled { get; set; }
        public string endpoint { get; set; }
        public string accesskey { get; set; }
        public string secretaccesskey { get; set; }
        public string bucketname { get; set; }
        public string path { get; set; }
    }

    public class ApplicationEnvironmentRazorpayConfigData
    {
        public string key_id { get; set; }
        public string key_secret { get; set; }
        public bool is_test_mode { get; set; }
    }

    public class ApplicationEnvironmentFirebaseConfigData
    {
        public string server_key { get; set; }
        public string sender_id { get; set; }
        public string project_id { get; set; }
    }

    public class ApplicationEnvironmentWhatsAppConfigData
    {
        public string api_key { get; set; }
        public string phone_number_id { get; set; }
        public string api_version { get; set; }
        public string base_url { get; set; }
    }

    public class ApplicationEnvironmentRedisConfigData
    {
        public string connection_string { get; set; }
        public string instance_name { get; set; }
        public int default_database { get; set; }
    }
}
