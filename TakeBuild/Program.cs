using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace CampuszaBuilder;

internal static class Program
{
    const string DefaultPublish = "build-out\\campusza";

    static int Main(string[] args)
    {
        try
        {
            var repo = NormalizeDir(Arg(args, "--repo") ?? FirstPositional(args) ?? Environment.GetEnvironmentVariable("KRIOS_REPO") ?? FindRepo());
            var publish = NormalizeDir(
                Arg(args, "--out")
                ?? Environment.GetEnvironmentVariable("CAMPUSZA_PUBLISH")
                ?? Environment.GetEnvironmentVariable("KRIOS_PUBLISH")
                ?? DefaultPublish);
            if (string.IsNullOrWhiteSpace(repo) || !IsRepo(repo))
            {
                Console.Error.WriteLine("Could not find the Campusza repo (campusza_server/Campusza/Campusza.csproj).");
                Console.Error.WriteLine("Pass --repo \"D:\\aravindan\\project\\campusza\"");
                return 1;
            }

            repo = Path.GetFullPath(repo);
            publish = Path.IsPathRooted(publish)
                ? Path.GetFullPath(publish)
                : Path.GetFullPath(Path.Combine(repo, publish));
            var wwwroot = Path.Combine(publish, "wwwroot");
            var csproj = Path.Combine(repo, "campusza_server", "Campusza", "Campusza.csproj");
            var hub = Path.Combine(repo, "school-hub");
            var urlsSrc = Path.Combine(repo, "campusza-urls.production.json");

            Console.WriteLine("Campusza TakeBuild");
            Console.WriteLine($"  repo     {repo}");
            Console.WriteLine($"  publish  {publish}");
            Console.WriteLine($"  wwwroot  {wwwroot}");
            Console.WriteLine();

            StopPublishedCampusza(publish);
            Directory.CreateDirectory(publish);

            Run("dotnet", $"publish \"{csproj}\" -c Release -r win-x64 -o \"{publish}\" --nologo", repo);

            if (!Directory.Exists(Path.Combine(hub, "node_modules")))
                Run("npm", "install", hub);

            Environment.SetEnvironmentVariable("CAMPUSZA_BUILD_OUT", publish);
            WriteUrls(urlsSrc, publish, wwwroot);

            Run("cmd.exe", $"/c set CAMPUSZA_BUILD_OUT={publish}&& npm run build:production", hub);

            WriteUrls(urlsSrc, publish, wwwroot);

            Console.WriteLine();
            Console.WriteLine("Build ready — one folder, Kestrel from campusza-urls.json.");
            Console.WriteLine($"  {Path.Combine(publish, "Campusza.exe")}");
            Console.WriteLine("  wwwroot/campusza-urls.json");
            Console.WriteLine("Run Campusza.exe (reverse proxy public HTTPS → backendListen port).");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }
    }

    static void StopPublishedCampusza(string publish)
    {
        var exe = Path.Combine(publish, "Campusza.exe");
        if (!File.Exists(exe)) return;
        var full = Path.GetFullPath(exe);
        foreach (var p in Process.GetProcessesByName("Campusza"))
        {
            try
            {
                var path = p.MainModule?.FileName;
                if (path != null && string.Equals(Path.GetFullPath(path), full, StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine($"Stopping running Campusza.exe (pid {p.Id}) so files can be replaced...");
                    p.Kill(entireProcessTree: true);
                    p.WaitForExit(15000);
                }
            }
            catch
            {
                /* access denied / already exited */
            }
        }
    }

    static void WriteUrls(string src, string publish, string wwwroot)
    {
        Directory.CreateDirectory(wwwroot);
        var json = File.Exists(src)
            ? File.ReadAllText(src)
            : """
              {
                "backendListen": "http://0.0.0.0:5052",
                "frontendApiBaseUrl": ""
              }
              """;
        var normalized = NormalizeUrlsJson(json);
        File.WriteAllText(Path.Combine(publish, "campusza-urls.json"), normalized);
        File.WriteAllText(Path.Combine(wwwroot, "campusza-urls.json"), normalized);
        Console.WriteLine("Wrote campusza-urls.json (exe folder + wwwroot).");
    }

    static string NormalizeUrlsJson(string json)
    {
        try
        {
            var node = JsonNode.Parse(json.Trim()) as JsonObject ?? new JsonObject();
            var listen = node["backendListen"]?.GetValue<string>()?.Trim() ?? "http://0.0.0.0:5052";
            var api = NormalizeFrontendApiBaseUrl(node["frontendApiBaseUrl"]?.GetValue<string>());
            var outObj = new JsonObject
            {
                ["backendListen"] = listen,
                ["frontendApiBaseUrl"] = api,
            };
            return outObj.ToJsonString(new JsonSerializerOptions { WriteIndented = true }) + Environment.NewLine;
        }
        catch
        {
            return json.Trim() + Environment.NewLine;
        }
    }

    static string NormalizeFrontendApiBaseUrl(string? value)
    {
        var v = (value ?? "").Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(v)) return "";
        if (v.Contains("0.0.0.0", StringComparison.Ordinal)) return "";
        if (v.Contains("your_public_host", StringComparison.OrdinalIgnoreCase)) return "";
        if (v.Equals("http:", StringComparison.OrdinalIgnoreCase) || v.Equals("https:", StringComparison.OrdinalIgnoreCase)) return "";
        return v;
    }

    static bool IsRepo(string dir) =>
        File.Exists(Path.Combine(dir, "campusza_server", "Campusza", "Campusza.csproj"));

    static string? NormalizeDir(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return path;
        var trimmed = path.Trim().Trim('"').Trim('\'');
        trimmed = trimmed.TrimEnd('\\', '/');
        try { return Path.GetFullPath(trimmed); }
        catch { return trimmed; }
    }

    static string? FirstPositional(string[] args)
    {
        for (var i = 0; i < args.Length; i++)
        {
            if (args[i].StartsWith('-'))
            {
                if (i + 1 < args.Length && !args[i + 1].StartsWith('-')) i++;
                continue;
            }
            return args[i];
        }
        return null;
    }

    static string? FindRepo()
    {
        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            var dir = NormalizeDir(start);
            for (var i = 0; i < 8 && !string.IsNullOrEmpty(dir); i++)
            {
                if (IsRepo(dir)) return dir;
                dir = Directory.GetParent(dir)?.FullName;
            }
        }
        return null;
    }

    static string? Arg(string[] args, string name)
    {
        for (var i = 0; i < args.Length - 1; i++)
            if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase))
                return args[i + 1];
        return null;
    }

    static void Run(string file, string arguments, string workDir)
    {
        Console.WriteLine($"> {file} {arguments}");
        var psi = new ProcessStartInfo
        {
            FileName = file,
            Arguments = arguments,
            WorkingDirectory = workDir,
            UseShellExecute = false,
        };
        using var p = Process.Start(psi) ?? throw new InvalidOperationException($"Failed to start {file}");
        p.WaitForExit();
        if (p.ExitCode != 0)
            throw new InvalidOperationException($"{file} failed with exit {p.ExitCode}");
    }
}
