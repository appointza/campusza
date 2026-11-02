using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class GradePeriodController : ControllerBase
    {
        private readonly GradePeriodService gradePeriodService;

        public GradePeriodController(GradePeriodService gradePeriodService)
        {
            this.gradePeriodService = gradePeriodService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.GradePeriod>>>> Select(ActionReq<CampusModels.GradePeriodSelectReq> req)
        {
            var result = new ActionRes<List<CampusModels.GradePeriod>>();
            result.item = await gradePeriodService.Select(req.item);
            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.GradePeriod>>> Save(ActionReq<CampusModels.GradePeriod> req)
        {
            var result = new ActionRes<CampusModels.GradePeriod>();
            result.item = await gradePeriodService.Save(req.item);
            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.GradePeriodDeleteReq> req)
        {
            var result = new ActionRes<bool>();
            result.item = await gradePeriodService.Delete(req.item);
            return Ok(result);
        }

        [HttpPost("CopyToGrade")]
        public async Task<ActionResult<ActionRes<List<CampusModels.GradePeriod>>>> CopyToGrade(ActionReq<CampusModels.GradePeriodCopyReq> req)
        {
            var result = new ActionRes<List<CampusModels.GradePeriod>>();
            result.item = await gradePeriodService.CopyToGrade(req.item);
            return Ok(result);
        }

        [HttpPost("ReplaceSchedule")]
        public async Task<ActionResult<ActionRes<List<CampusModels.GradePeriod>>>> ReplaceSchedule(ActionReq<CampusModels.GradePeriodReplaceReq> req)
        {
            var result = new ActionRes<List<CampusModels.GradePeriod>>();
            result.item = await gradePeriodService.ReplaceSchedule(req.item);
            return Ok(result);
        }
    }
}
