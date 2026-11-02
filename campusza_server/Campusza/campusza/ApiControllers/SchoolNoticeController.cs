using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class SchoolNoticeController : ControllerBase
    {
        private readonly SchoolNoticeService schoolNoticeService;

        public SchoolNoticeController(SchoolNoticeService schoolNoticeService)
        {
            this.schoolNoticeService = schoolNoticeService;
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolNotice>>> Save(
            ActionReq<CampusModels.SchoolNoticeSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolNotice>
            {
                item = await schoolNoticeService.Save(req.item),
            });
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<object>>> Delete(
            ActionReq<CampusModels.SchoolNoticeDeleteReq> req)
        {
            await schoolNoticeService.Delete(req.item);
            return Ok(new ActionRes<object> { item = new { ok = true } });
        }
    }
}
