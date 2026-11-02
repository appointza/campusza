using Campusza.Utils;
using System.Net;
using System.Text.Json;

namespace Campusza.Middlewares
{
    public class ErrorHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        ILogger _logger;

        public ErrorHandlerMiddleware(RequestDelegate next,ILogger<ErrorHandlerMiddleware> logger)
        {
            _next = next;
            this._logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception error)
            {
                var response = context.Response;
                response.ContentType = "application/json";

                switch (error)
                {
                    case AppException e:
                        // custom application error
                        _logger.LogError("[ HANDLED EXCEPTION ] {1}", e.ToString());
                        response.StatusCode = (int)HttpStatusCode.BadRequest;
                        await response.WriteAsync(error.ToString());
                        break;
                    default:
                        _logger.LogError("[ UNHANDLED EXCEPTION ] {1}", error.ToString());
                        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
                        {
                            response.StatusCode = (int)HttpStatusCode.InternalServerError;
                            await response.WriteAsync(JsonSerializer.Serialize(new { message = error.Message }));
                        }
                        else
                        {
                            throw error;
                        }
                        break;
                }
            }
        }
    }
}
