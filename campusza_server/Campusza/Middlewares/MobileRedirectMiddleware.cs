using Microsoft.Net.Http.Headers;
using Campusza.Utils;

namespace Campusza.Middlewares
{
    public class MobileRedirectMiddleware
    {
        private RequestState requeststate;
        private readonly RequestDelegate _next;

        public MobileRedirectMiddleware(RequestDelegate next)
        {
            _next = next;
            
        }

        public async Task Invoke(HttpContext context, RequestState requeststate)
        {
            //this.requeststate = requeststate;
            //string userAgent = context.Request.Headers[HeaderNames.UserAgent].ToString();
            //if (!string.IsNullOrEmpty(requeststate.useragent))
            //{
            //    userAgent = requeststate.useragent.ToLower();
            //}
            //bool isMobileDevice = IsMobileUserAgent(userAgent);

            //string originalPath = context.Request.Path;
            //if(originalPath == "/")
            //{
            //    originalPath = "";
            //}
            //if (isMobileDevice && !originalPath.StartsWith("/api") && !originalPath.StartsWith(_mobileprefix))
            //{

            //    // Construct the new URL with the mobile prefix and the original path
            //    string newUrl = _mobileprefix + originalPath;

            //    // Perform the redirection
            //    context.Response.Redirect(newUrl);
            //    return;
            //}

            await _next(context);
        }

        private static bool IsMobileUserAgent(string userAgent)
        {
            string[] mobileKeywords = { "Mobile", "Android", "iPhone", "iPad" };

            foreach (var keyword in mobileKeywords)
            {
                if (userAgent.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }
    }
}
