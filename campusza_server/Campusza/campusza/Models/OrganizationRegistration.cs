namespace Campusza.Models.Campusza
{
    public class OrganizationRegistrationReq
    {
        public string organizationName { get; set; }
        public string organizationType { get; set; }
        public string address { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string country { get; set; }
        public string phone { get; set; }
        public string website { get; set; }
        public string studentCount { get; set; }
        public string adminFirstName { get; set; }
        public string adminLastName { get; set; }
        public string adminEmail { get; set; }
        public string adminPhone { get; set; }
        public string adminPassword { get; set; }
    }

    public class OrganizationRegistrationRes
    {
        public string organizationId { get; set; }
        public string adminUserId { get; set; }
        public string slug { get; set; }
    }
}
