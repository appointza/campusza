using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class OrganizationAssetController : ControllerBase
    {
        private readonly OrganizationAssetService organizationAssetService;

        public OrganizationAssetController(OrganizationAssetService organizationAssetService)
        {
            this.organizationAssetService = organizationAssetService;
        }

        [HttpPost("Upload")]
        [RequestSizeLimit(30_000_000)]
        [RequestFormLimits(MultipartBodyLengthLimit = 30_000_000)]
        public async Task<ActionResult<ActionRes<CampusModels.OrganizationAsset>>> Upload(
            IFormFile file,
            [FromForm] string organizationid,
            [FromForm] string email,
            [FromForm] string kind)
        {
            var asset = await organizationAssetService.UploadAsync(file, organizationid, email, kind);
            return Ok(new ActionRes<CampusModels.OrganizationAsset> { item = asset });
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.OrganizationAsset>>>> Select(
            ActionReq<CampusModels.OrganizationAssetSelectReq> req)
        {
            var list = await organizationAssetService.Select(req.item ?? new CampusModels.OrganizationAssetSelectReq());
            return Ok(new ActionRes<List<CampusModels.OrganizationAsset>> { item = list });
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<object>>> Delete(
            ActionReq<CampusModels.OrganizationAssetDeleteReq> req)
        {
            await organizationAssetService.Delete(req.item ?? new CampusModels.OrganizationAssetDeleteReq());
            return Ok(new ActionRes<object> { item = new { ok = true } });
        }

        [HttpGet("Download/{id}")]
        public async Task<IActionResult> Download(
            string id,
            [FromQuery] string organizationid,
            [FromQuery] string email)
        {
            var payload = await organizationAssetService.GetContentAsync(id, organizationid, email);
            if (payload == null)
                return NotFound();

            var (content, contentType, fileName) = payload.Value;
            return File(content, contentType, fileName);
        }
    }
}
