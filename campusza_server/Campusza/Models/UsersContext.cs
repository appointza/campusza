namespace Campusza.Models
{
    public class UsersContext
    {
        public long id { get; set; }
        public long userid { get; set; }
        public string usermobile { get; set; }
        public string username { get; set; }
        public string useremail { get; set; }
        public long profileimage { get; set; }
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public int organisationtype { get; set; }
        public long organisationlocationid { get; set; }
        public string organisationlocationname { get; set; }
        public string refreshtoken { get; set; }
        public string accesstoken { get; set; }
        public bool isStaff { get; set; }
    }
}
