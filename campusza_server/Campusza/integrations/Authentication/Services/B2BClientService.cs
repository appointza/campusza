using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace Campusza.integrations.Authentication.Services
{
    public interface IB2BClientService
    {
        Task<string?> GetTokenAsync(string targetServer, string clientId, string clientSecret, string company);
        Task<T?> CallApiAsync<T>(string targetServer, string endpoint, string? token = null, HttpMethod? method = null, object? body = null);
    }

    public class B2BClientService : IB2BClientService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<B2BClientService> _logger;
        private readonly Dictionary<string, (string token, DateTime expiresAt)> _tokenCache = new();

        public B2BClientService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<B2BClientService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Gets a B2B token from the target server
        /// </summary>
        public async Task<string?> GetTokenAsync(string targetServer, string clientId, string clientSecret, string company)
        {
            try
            {
                // Check cache first
                var cacheKey = $"{targetServer}:{clientId}";
                if (_tokenCache.TryGetValue(cacheKey, out var cached) && cached.expiresAt > DateTime.UtcNow.AddMinutes(1))
                {
                    _logger.LogDebug("Using cached B2B token for {TargetServer}", targetServer);
                    return cached.token;
                }

                // Get base URL from config or use targetServer directly
                var baseUrl = _configuration[$"ApplicationSettings:B2BAuth:ServerUrls:{targetServer}"] ?? targetServer;
                if (!baseUrl.StartsWith("http"))
                {
                    baseUrl = $"https://{baseUrl}";
                }

                var tokenUrl = $"{baseUrl.TrimEnd('/')}/api/b2b/auth/token";

                var request = new
                {
                    ClientId = clientId,
                    ClientSecret = clientSecret,
                    Company = company
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Requesting B2B token from {TokenUrl}", tokenUrl);

                var response = await _httpClient.PostAsync(tokenUrl, content);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<B2BTokenResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (tokenResponse?.AccessToken == null)
                {
                    _logger.LogError("Failed to get token from {TargetServer}: Invalid response", targetServer);
                    return null;
                }

                // Cache the token (expires in 10 minutes, cache for 9 minutes)
                _tokenCache[cacheKey] = (tokenResponse.AccessToken, DateTime.UtcNow.AddMinutes(9));

                _logger.LogInformation("Successfully obtained B2B token from {TargetServer}", targetServer);
                return tokenResponse.AccessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting B2B token from {TargetServer}", targetServer);
                return null;
            }
        }

        /// <summary>
        /// Calls an API endpoint on the target server with B2B authentication
        /// </summary>
        public async Task<T?> CallApiAsync<T>(string targetServer, string endpoint, string? token = null, HttpMethod? method = null, object? body = null)
        {
            try
            {
                // Get token if not provided
                if (string.IsNullOrEmpty(token))
                {
                    var clientId = _configuration[$"ApplicationSettings:B2BAuth:Clients:{targetServer}:ClientId"];
                    var clientSecret = _configuration[$"ApplicationSettings:B2BAuth:Clients:{targetServer}:ClientSecret"];
                    var company = _configuration[$"ApplicationSettings:B2BAuth:Clients:{targetServer}:Company"] ?? targetServer;

                    if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
                    {
                        throw new InvalidOperationException($"B2B credentials not configured for {targetServer}");
                    }

                    token = await GetTokenAsync(targetServer, clientId, clientSecret, company);
                    if (string.IsNullOrEmpty(token))
                    {
                        throw new InvalidOperationException($"Failed to get B2B token for {targetServer}");
                    }
                }

                // Get base URL
                var baseUrl = _configuration[$"ApplicationSettings:B2BAuth:ServerUrls:{targetServer}"] ?? targetServer;
                if (!baseUrl.StartsWith("http"))
                {
                    baseUrl = $"https://{baseUrl}";
                }

                var url = $"{baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";

                var request = new HttpRequestMessage(method ?? HttpMethod.Get, url);
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                if (body != null)
                {
                    var json = JsonSerializer.Serialize(body);
                    request.Content = new StringContent(json, Encoding.UTF8, "application/json");
                }

                _logger.LogInformation("Calling B2B API: {Method} {Url}", request.Method, url);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<T>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling B2B API on {TargetServer}: {Endpoint}", targetServer, endpoint);
                throw;
            }
        }
    }

    public class B2BTokenResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
    }
}
