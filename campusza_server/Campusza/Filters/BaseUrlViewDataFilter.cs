using Microsoft.AspNetCore.Mvc.Filters;
using Campusza.Utils;
using Microsoft.Extensions.Options;

namespace Campusza.Filters
{
    /// <summary>
    /// Filter to inject base URL into ViewData for all views
    /// </summary>
    public class BaseUrlViewDataFilter : IActionFilter
    {
        private readonly ApplicationEnvironment _appSettings;

        public BaseUrlViewDataFilter(IOptions<ApplicationEnvironment> appSettings)
        {
            _appSettings = appSettings.Value;
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Inject base URL into ViewData if not already set
            if (!context.HttpContext.Items.ContainsKey("BaseUrlInjected"))
            {
                var baseUrl = _appSettings?.baseUrl;
                
                // If baseUrl is not configured, fallback to request scheme and host
                if (string.IsNullOrEmpty(baseUrl))
                {
                    baseUrl = $"{context.HttpContext.Request.Scheme}://{context.HttpContext.Request.Host}";
                }
                
                // Set in ViewData for all views
                if (context.Controller is Microsoft.AspNetCore.Mvc.Controller controller)
                {
                    controller.ViewData["BaseUrl"] = baseUrl;
                }
                
                // Mark as injected to avoid duplicate processing
                context.HttpContext.Items["BaseUrlInjected"] = true;
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // No action needed after execution
        }
    }
}

