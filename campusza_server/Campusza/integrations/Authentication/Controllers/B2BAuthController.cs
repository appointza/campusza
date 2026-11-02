using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Campusza.Utils;
using Campusza.Models;

namespace Campusza.integrations.Authentication.Controllers
{
    [ApiController]
    [Route("api/b2b/auth")]
    public class B2BAuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly UserLoginService _userLoginService;
        private readonly IDbProvider _dbProvider;
        private readonly ILogger<B2BAuthController> _logger;

        public B2BAuthController(IConfiguration configuration, UserLoginService userLoginService, IDbProvider dbProvider, ILogger<B2BAuthController> logger)
        {
            _configuration = configuration;
            _userLoginService = userLoginService;
            _dbProvider = dbProvider;
            _logger = logger;
        }

        [HttpPost("token")]
        public async Task<IActionResult> GetToken([FromBody] B2BTokenRequest request)
        {
            // 1️⃣ Validate client credentials
            if (!ValidateClient(request.ClientId, request.ClientSecret))
            {
                return Unauthorized(new { message = "Invalid client credentials" });
            }

            // 2️⃣ Create claims for the server token
            var claims = new[]
            {
                new Claim("client_id", request.ClientId),
                new Claim("company", request.Company),
                new Claim("scope", "read"),
                new Claim(JwtRegisteredClaimNames.Iss, request.Company),
                new Claim(JwtRegisteredClaimNames.Aud, "campusza-api")
            };

            // 3️⃣ Generate token
            var secretKey = _configuration["ApplicationSettings:B2BAuth:SharedSecret"];
            if (string.IsNullOrEmpty(secretKey))
            {
                return StatusCode(500, new { message = "B2B authentication not configured" });
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: request.Company,
                audience: "campusza-api",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // 4️⃣ Get user details if mobile or email is provided
            UserLoginRes? userLoginRes = null;
            if (!string.IsNullOrEmpty(request.Mobile) || !string.IsNullOrEmpty(request.Email))
            {
                try
                {
                    userLoginRes = await GetUserLoginResByMobileOrEmail(request.Mobile, request.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get user login response for mobile/email in B2B token request");
                    // Continue without user context if lookup fails
                }
            }

            // 5️⃣ Return token and user context if available
            var response = new
            {
                access_token = tokenString,
                expires_in = 600,
                user = userLoginRes
            };

            return Ok(response);
        }

        private async Task<UserLoginRes?> GetUserLoginResByMobileOrEmail(string? mobile, string? email)
        {
            if (string.IsNullOrEmpty(mobile) && string.IsNullOrEmpty(email))
            {
                return null;
            }

            using (var db = await _dbProvider.GetDb())
            {
                await db.Connect();

                UserRow? user = null;
                if (!string.IsNullOrEmpty(email))
                {
                    user = await GetUserByEmail(db, email);
                }
                // Note: Campusza primarily uses email, mobile lookup may need to be implemented

                if (user == null)
                {
                    return null;
                }

                if (!string.Equals(user.status, "active", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                var org = await GetOrganization(db, user.organizationId);

                return new UserLoginRes
                {
                    userId = user.id,
                    email = user.email,
                    role = user.role,
                    organizationId = user.organizationId,
                    organizationName = org?.Name ?? "",
                    organizationSlug = org?.Slug ?? ""
                };
            }
        }

        private async Task<UserRow?> GetUserByEmail(IDb db, string email)
        {
            string query = @"
                SELECT id, email, role, status, organization_id, password_hash
                FROM users
                WHERE lower(email) = lower(@email)
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    return new UserRow
                    {
                        id = reader["id"]?.ToString() ?? "",
                        email = reader["email"]?.ToString() ?? "",
                        role = reader["role"]?.ToString() ?? "",
                        status = reader["status"]?.ToString() ?? "",
                        organizationId = reader["organization_id"]?.ToString() ?? "",
                        passwordHash = reader["password_hash"]?.ToString() ?? ""
                    };
                }
            }

            return null;
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ActionRes<UserLoginRes>>> RefreshToken(ActionReq<B2BRefreshTokenRequest> req)
        {
            ActionRes<UserLoginRes> result = new ActionRes<UserLoginRes>();
            try
            {
                if (req == null || req.item == null || string.IsNullOrEmpty(req.item.refreshToken))
                {
                    return BadRequest(new { message = "Invalid request - refresh token is required" });
                }

                if (string.IsNullOrEmpty(req.item.userId))
                {
                    return BadRequest(new { message = "Invalid request - user ID is required" });
                }

                // Get user by ID and return the same structure as login
                using (var db = await _dbProvider.GetDb())
                {
                    await db.Connect();

                    var user = await GetUserById(db, req.item.userId);
                    if (user == null)
                    {
                        return Unauthorized(new { message = "User not found" });
                    }

                    if (!string.Equals(user.status, "active", StringComparison.OrdinalIgnoreCase))
                    {
                        return Unauthorized(new { message = "User is not active" });
                    }

                    var org = await GetOrganization(db, user.organizationId);

                    result.item = new UserLoginRes
                    {
                        userId = user.id,
                        email = user.email,
                        role = user.role,
                        organizationId = user.organizationId,
                        organizationName = org?.Name ?? "",
                        organizationSlug = org?.Slug ?? ""
                    };

                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing B2B token");
                return BadRequest(new { error = ex.Message, message = "Token refresh failed" });
            }
        }

        private async Task<UserRow?> GetUserById(IDb db, string userId)
        {
            string query = @"
                SELECT id, email, role, status, organization_id, password_hash
                FROM users
                WHERE id = @userId
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "userId", DbTypes.Types.String).Value = userId;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    return new UserRow
                    {
                        id = reader["id"]?.ToString() ?? "",
                        email = reader["email"]?.ToString() ?? "",
                        role = reader["role"]?.ToString() ?? "",
                        status = reader["status"]?.ToString() ?? "",
                        organizationId = reader["organization_id"]?.ToString() ?? "",
                        passwordHash = reader["password_hash"]?.ToString() ?? ""
                    };
                }
            }

            return null;
        }

        private async Task<(string Name, string Slug)?> GetOrganization(IDb db, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                return null;

            string query = @"
                SELECT name, slug
                FROM organizations
                WHERE id = @id
                  AND is_active = true
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = organizationId;

            using (var reader = await db.Execute(cmd))
            {
                if (await reader.ReadAsync())
                {
                    return (
                        reader["name"]?.ToString() ?? "",
                        reader["slug"]?.ToString() ?? ""
                    );
                }
            }

            return null;
        }

        private sealed class UserRow
        {
            public string id { get; set; } = "";
            public string email { get; set; } = "";
            public string role { get; set; } = "";
            public string status { get; set; } = "";
            public string organizationId { get; set; } = "";
            public string passwordHash { get; set; } = "";
        }

        private bool ValidateClient(string clientId, string clientSecret)
        {
            // For demo, hardcoded clients. Replace with DB/config in production.
            return (clientId, clientSecret) switch
            {
                ("appointza-client", "appointza-secret") => true,
                ("latrexa-client", "latrexa-secret") => true,
                ("momantza-client", "momantza-secret") => true,
                ("campusza-client", "campusza-secret") => true,
                _ => false
            };
        }
    }

    public class B2BTokenRequest
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string? Mobile { get; set; }
        public string? Email { get; set; }
    }

    public class B2BRefreshTokenRequest
    {
        public string refreshToken { get; set; } = string.Empty;
        public string? userId { get; set; }
    }
}
