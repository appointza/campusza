using Campusza.Models;
using Microsoft.Extensions.DependencyInjection;

namespace Campusza.Utils
{
    /// <summary>
    /// Helper class to access organization information from HttpContext
    /// </summary>
    public static class OrganizationContextHelper
    {
        /// <summary>
        /// Gets the current organization ID from the request context
        /// </summary>
        public static long GetCurrentOrganizationId(HttpContext context)
        {
            if (context?.Items?.ContainsKey("OrganizationId") == true)
            {
                return Convert.ToInt64(context.Items["OrganizationId"]);
            }
            return 0;
        }

        /// <summary>
        /// Gets the current organization name from the request context
        /// </summary>
        public static string GetCurrentOrganizationName(HttpContext context)
        {
            if (context?.Items?.ContainsKey("OrganizationName") == true)
            {
                return context.Items["OrganizationName"]?.ToString() ?? "";
            }
            return "";
        }

        /*
        /// <summary>
        /// Gets the current organization details from the request context
        /// </summary>
        public static OrganisationDetail GetCurrentOrganization(HttpContext context)
        {
            if (context?.Items?.ContainsKey("CurrentOrganization") == true)
            {
                return context.Items["CurrentOrganization"] as OrganisationDetail;
            }
            return null;
        }
        */

        /*
        /// <summary>
        /// Gets the location information from the request context
        /// </summary>
        public static LocationInfo GetLocationInfo(HttpContext context)
        {
            if (context?.Items?.ContainsKey("LocationInfo") == true)
            {
                return context.Items["LocationInfo"] as LocationInfo;
            }
            return new LocationInfo();
        }
        */

        /// <summary>
        /// Checks if the current request is for a specific organization
        /// </summary>
        public static bool HasOrganizationContext(HttpContext context)
        {
            return GetCurrentOrganizationId(context) > 0;
        }

        /// <summary>
        /// Gets organization-specific base URL from configuration
        /// </summary>
        public static string GetOrganizationBaseUrl(HttpContext context)
        {
            // Try to get base URL from configuration
            var appSettings = context.RequestServices.GetService<Microsoft.Extensions.Options.IOptions<ApplicationEnvironment>>();
            if (appSettings?.Value != null && !string.IsNullOrEmpty(appSettings.Value.baseUrl))
            {
                return appSettings.Value.baseUrl;
            }
            
            // Fallback to request scheme and host
            return $"{context.Request.Scheme}://{context.Request.Host}";
        }
    }
}
