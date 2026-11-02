using System.Text.Json;

namespace Campusza.Utils;

/// <summary>
/// URL/port config: <c>campusza-urls.json</c> next to <c>Campusza.exe</c>.
/// </summary>
public class CampuszaUrls
{
    public const string FileName = "campusza-urls.json";
    public const string RequestPath = "/" + FileName;

    public string backendListen { get; set; } = "http://0.0.0.0:5052";
    public string frontendApiBaseUrl { get; set; } = "";

    public int Port => PortFromListenUrl(backendListen);

    public static CampuszaUrls Load()
    {
        var path = ResolvePath();
        if (path != null)
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<CampuszaUrls>(
                    File.ReadAllText(path),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (parsed != null)
                {
                    if (string.IsNullOrWhiteSpace(parsed.backendListen))
                        parsed.backendListen = "http://0.0.0.0:5052";
                    parsed.backendListen = parsed.backendListen.Trim();
                    parsed.frontendApiBaseUrl = NormalizeFrontendApiBaseUrl(parsed.frontendApiBaseUrl);

                    Console.WriteLine($"URLs: {path}");
                    Console.WriteLine($"  backendListen:      {parsed.backendListen}");
                    Console.WriteLine(
                        $"  frontendApiBaseUrl: {(string.IsNullOrEmpty(parsed.frontendApiBaseUrl) ? "(same host as the page)" : parsed.frontendApiBaseUrl)}");
                    return parsed;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"URLs: failed to read {path}: {ex.Message}");
            }
        }

        Console.WriteLine($"URLs: {FileName} not found — using defaults (port 5052, same-origin API)");
        return new CampuszaUrls();
    }

    private static string? ResolvePath()
    {
        var nextToExe = Path.Combine(AppContext.BaseDirectory, FileName);
        if (File.Exists(nextToExe))
            return Path.GetFullPath(nextToExe);

        var current = new DirectoryInfo(Directory.GetCurrentDirectory());
        for (var depth = 0; current != null && depth < 8; depth++, current = current.Parent)
        {
            var source = Path.Combine(current.FullName, "school-hub", "public", FileName);
            if (File.Exists(source))
                return source;
        }

        return null;
    }

    public static int PortFromListenUrl(string? listenUrl)
    {
        var text = (listenUrl ?? "").Trim().TrimEnd('/');
        var colon = text.LastIndexOf(':');
        if (colon >= 0 && int.TryParse(text[(colon + 1)..], out var port) && port > 0 && port < 65536)
            return port;
        return 5052;
    }

    /// <summary>Single listen URL from campusza-urls.json (avoids duplicate bind with appsettings Kestrel).</summary>
    public void BindKestrel(WebApplicationBuilder builder)
    {
        var listen = string.IsNullOrWhiteSpace(backendListen)
            ? $"http://0.0.0.0:{Port}"
            : backendListen.Trim();
        builder.WebHost.UseUrls(listen);
        Console.WriteLine($"Listening on {listen} — open http://localhost:{Port}/");
    }

    public string ResolveServerApiBaseUrl()
    {
        if (!string.IsNullOrWhiteSpace(frontendApiBaseUrl))
            return ToBrowserOrigin(frontendApiBaseUrl);
        return $"http://localhost:{Port}";
    }

    /// <summary>0.0.0.0 is valid for Kestrel bind only — not as a browser API origin.</summary>
    public static string NormalizeFrontendApiBaseUrl(string? value)
    {
        var v = (value ?? "").Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(v))
            return "";
        if (v.Contains("0.0.0.0", StringComparison.Ordinal))
            return "";
        if (v.Contains("your_public_host", StringComparison.OrdinalIgnoreCase))
            return "";
        if (v.Equals("http:", StringComparison.OrdinalIgnoreCase) || v.Equals("https:", StringComparison.OrdinalIgnoreCase))
            return "";
        return v;
    }

    public object ToBrowserPayload() => new
    {
        backendListen,
        frontendApiBaseUrl = string.IsNullOrWhiteSpace(frontendApiBaseUrl) ? "" : ToBrowserOrigin(frontendApiBaseUrl),
    };

    public static string ToBrowserOrigin(string url)
    {
        var value = (url ?? "").Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(value))
            return "";

        try
        {
            var uri = new Uri(value);
            if (uri.Host is not ("0.0.0.0" or "::" or "[::]"))
                return value;
            return new UriBuilder(uri) { Host = "localhost" }.Uri.ToString().TrimEnd('/');
        }
        catch
        {
            return value.Replace("://0.0.0.0", "://localhost", StringComparison.OrdinalIgnoreCase);
        }
    }
}
