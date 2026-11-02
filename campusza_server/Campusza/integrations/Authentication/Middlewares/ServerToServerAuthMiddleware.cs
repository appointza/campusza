using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Campusza.integrations.Authentication.Middlewares
{
    public class ServerToServerAuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ServerToServerAuthMiddleware> _logger;

        public ServerToServerAuthMiddleware(
            RequestDelegate next,
            IConfiguration configuration,
            ILogger<ServerToServerAuthMiddleware> logger)
        {
            _next = next;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();

            // Only apply to /api/b2b/* paths (skip token endpoint and other paths)
            if (!path!.StartsWith("/api/b2b"))
            {
                await _next(context);
                return;
            }

            // Skip token issuing endpoint - it doesn't need auth
            if (path.StartsWith("/api/b2b/auth/token"))
            {
                await _next(context);
                return;
            }

            // Skip swagger & health endpoints
            if (path.StartsWith("/swagger") || path.StartsWith("/health"))
            {
                await _next(context);
                return;
            }

            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Authorization token missing");
                return;
            }

            var token = authHeader.Replace("Bearer ", "").Trim();

            try
            {
                var principal = ValidateToken(token);

                context.Items["CallingCompany"] =
                    principal.FindFirst("client_id")?.Value;

                context.Items["Scopes"] =
                    principal.FindAll("scope").Select(s => s.Value).ToList();

                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "B2B token validation failed");
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Invalid or expired token");
            }
        }

        private ClaimsPrincipal ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            var secretKey = _configuration["ApplicationSettings:B2BAuth:SharedSecret"];
            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("B2B authentication not configured");
            }

            var key = Encoding.UTF8.GetBytes(secretKey);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),

                ValidateIssuer = true,
                ValidIssuers = new[]
                {
                    "https://appointza.com",
                    "https://latrexa.com",
                    "https://momantza.com",
                    "https://campusza.com",
                    "appointza.com",
                    "latrexa.com",
                    "momantza.com",
                    "campusza.com",
                    "https://localhost:5000",
                    "http://localhost:5117",
                    "http://localhost:5050",
                    "https://localhost:7117",
                    "localhost"
                },

                ValidateAudience = true,
                ValidAudience = "campusza-api",

                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            return tokenHandler.ValidateToken(token, validationParameters, out _);
        }
    }
}
