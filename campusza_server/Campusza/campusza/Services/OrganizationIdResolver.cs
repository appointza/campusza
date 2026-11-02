using System.Data.Common;
using System.Globalization;
using Campusza.Models;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public class OrganizationIdResolver
    {
        private readonly IDbProvider dbprovider;
        private readonly RequestState requeststate;

        public OrganizationIdResolver(IDbProvider dbprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.requeststate = requeststate;
        }

        public async Task<string> RequireAsync(string organizationId, string email = "")
        {
            var resolved = await ResolveAsync(organizationId, email);
            if (string.IsNullOrWhiteSpace(resolved))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            return resolved;
        }

        public async Task<string> ResolveAsync(string organizationId, string email = "")
        {
            var trimmedClientOrg = organizationId?.Trim() ?? "";
            var trimmedEmail = email?.Trim() ?? "";

            if (!string.IsNullOrWhiteSpace(trimmedEmail) && !string.IsNullOrWhiteSpace(trimmedClientOrg))
            {
                var orgFromEmail = await LookupOrganizationIdByEmail(trimmedEmail);
                ExamTenantGuard.EnsureClientOrganizationBinding(trimmedClientOrg, orgFromEmail);
            }

            var ctxOrg = requeststate.usercontext?.organisationid > 0
                ? requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture)
                : "";

            if (!string.IsNullOrWhiteSpace(ctxOrg))
            {
                if (!string.IsNullOrWhiteSpace(trimmedClientOrg)
                    && !OrganizationIdsEquivalent(trimmedClientOrg, ctxOrg))
                {
                    throw new AppException(AppException.ErrorCodes.BadRequest,
                        "Organization does not match authenticated session.");
                }
                return ctxOrg;
            }

            if (!string.IsNullOrWhiteSpace(trimmedClientOrg))
                return trimmedClientOrg;

            if (!string.IsNullOrWhiteSpace(trimmedEmail))
            {
                var fromEmail = await LookupOrganizationIdByEmail(trimmedEmail);
                if (!string.IsNullOrWhiteSpace(fromEmail))
                    return fromEmail;
            }

            return "";
        }

        private static bool OrganizationIdsEquivalent(string a, string b) =>
            string.Equals(a.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);

        private async Task<string> LookupOrganizationIdByEmail(string email)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string query = @"
                SELECT organization_id
                FROM users
                WHERE LOWER(TRIM(email)) = LOWER(TRIM(@email))
                  AND is_active = true
                LIMIT 1";

            var command = db.GetCommand(query);
            db.AddParameter(command, "email", DbTypes.Types.String).Value = email;

            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
                return "";

            return reader["organization_id"]?.ToString()?.Trim() ?? "";
        }
    }
}
