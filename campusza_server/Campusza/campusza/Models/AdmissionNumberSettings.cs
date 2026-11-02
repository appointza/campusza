namespace Campusza.Models.Campusza
{
    public class AdmissionNumberSettings
    {
        public string prefix { get; set; } = "";
        public string suffix { get; set; } = "";
        public int nextnumber { get; set; } = 1;
        public int padding { get; set; } = 4;
        public bool autogenerate { get; set; } = true;
        public string preview { get; set; } = "";
    }

    public class AdmissionNumberSettingsSaveReq
    {
        public string organizationid { get; set; } = "";
        public string email { get; set; } = "";
        public string prefix { get; set; } = "";
        public string suffix { get; set; } = "";
        public int nextnumber { get; set; } = 1;
        public int padding { get; set; } = 4;
        public bool autogenerate { get; set; } = true;
    }
}
