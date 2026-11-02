using System.Text.Json.Serialization;
using System.Text.Json;
using Campusza.Models;

namespace Campusza.Models.Campusza
{
    public class Term
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public DateTime startdate { get; set; }
        public DateTime enddate { get; set; }
        public string status { get; set; } = "";
        public string academicyear { get; set; } = "";
        public string description { get; set; } = "";

        public string organizationid { get; set; } = "";
        public bool isactive { get; set; }
        public DateTime createdat { get; set; }
        public DateTime updatedat { get; set; }
        public string createdby { get; set; } = "";
        public string updatedby { get; set; } = "";
    }

    public class TermSelectReq
    {
        public string? id { get; set; }
        public string? organizationid { get; set; }
        public string? academicyear { get; set; }
        public string? status { get; set; }
    }

    public class TermDeleteReq
    {
        public string id { get; set; } = "";
        public string organizationid { get; set; } = "";
    }
}
