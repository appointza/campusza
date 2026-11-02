using System.Text.Json;

namespace Campusza.Utils
{
    public class AppException : Exception
    {
        public string key { get; set; } = ErrorCodes.BadRequest.ToString();
        public ErrorCodes code { get; set; } = ErrorCodes.BadRequest;
        public object item { get; set; }
        public override string ToString()
        {
            return JsonSerializer.Serialize(new { code = this.code, key = this.key, item = this.item, message = this.Message });

        }
        public AppException(ErrorCodes _code) : base(_code.ToString())
        {
            code = _code;
            key = _code.ToString();
        }
        public AppException(ErrorCodes _code, String _message): base(_message)
        {
            code = _code;
            key = _code.ToString();
        }
        public static AppException OrganisationConnectionRequestAlreadyAccepted(String username)
        {
            return new AppException(ErrorCodes.OrganisationConnectionRequestAlreadyAccepted, $"Connection Request Already Accepted by {username}");
        }
        public enum ErrorCodes
        {
            BadRequest,
            FileNotFound,
            UserNotFound,
            InvalidCredential,
            UnknownOrganisation,
            OtpExpired,
            OtpInvalid,
            SessionInvalid,
            SessionExpired,
            OrganisationDuplicate,
            UsersDuplicate,
            RetailerSupplierOrganisationMapDuplicate,
            OrganisationConnectionRequestAlreadyAccepted,
            SkuShouldNotBeDeleted,
            UserCartEmpty,
            ConnectionRequestAlreadySent,
            UsersNotFound,
            ErrorFromRazorpay,
            ErrorFromPhonePe
        }

    }
}
