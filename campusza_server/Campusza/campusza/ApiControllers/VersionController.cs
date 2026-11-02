using System.Reflection;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza;

[Route("api/campusza/[controller]")]
[ApiController]
public class VersionController : ControllerBase
{
    static readonly Lazy<VersionInfo> Cached = new(Load);

    [HttpGet]
    public ActionResult<VersionInfo> Get() => Ok(Cached.Value);

    static VersionInfo Load()
    {
        var asm = typeof(VersionController).Assembly;
        var path = asm.Location;
        DateTime? builtUtc = null;
        if (!string.IsNullOrEmpty(path) && System.IO.File.Exists(path))
            builtUtc = System.IO.File.GetLastWriteTimeUtc(path);

        return new VersionInfo
        {
            product = "Campusza",
            assembly = asm.GetName().Name ?? "Campusza",
            version = asm.GetName().Version?.ToString() ?? "",
            fileUtc = builtUtc,
            api = new ApiSurface
            {
                GetAdminDashboardPage = true,
                GetAdminDashboardPageOnPage = true,
                DashboardGetStatsFallback = true,
                GetAdminExamsPage = true,
                ExamSeriesApi = true,
            },
        };
    }

    public sealed class VersionInfo
    {
        public string product { get; set; } = "";
        public string assembly { get; set; } = "";
        public string version { get; set; } = "";
        public DateTime? fileUtc { get; set; }
        public ApiSurface api { get; set; } = new();
    }

    public sealed class ApiSurface
    {
        public bool GetAdminDashboardPage { get; set; }
        public bool GetAdminDashboardPageOnPage { get; set; }
        public bool DashboardGetStatsFallback { get; set; }
        public bool GetAdminExamsPage { get; set; }
        public bool ExamSeriesApi { get; set; }
    }
}
