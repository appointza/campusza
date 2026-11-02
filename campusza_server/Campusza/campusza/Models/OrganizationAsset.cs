namespace Campusza.Models.Campusza
{
    public class OrganizationAsset
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string storageprovider { get; set; } = "local";
        public string storagekey { get; set; } = "";
        public string originalfilename { get; set; } = "";
        public string contenttype { get; set; } = "";
        public long filesizebytes { get; set; }
        public string kind { get; set; } = "generic";
        public string checksumsha256 { get; set; } = "";
        public string uploadedby { get; set; } = "";
        public bool isactive { get; set; } = true;
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class OrganizationAssetSelectReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string email { get; set; } = "";
        public string kind { get; set; } = "";
    }

    public class OrganizationAssetDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
        public string email { get; set; } = "";
    }
}
