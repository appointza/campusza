using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StaffReplacementController : ControllerBase
    {
        ILogger<StaffReplacementController> logger;
        StaffReplacementService staffReplacementService;

        public StaffReplacementController(ILogger<StaffReplacementController> logger, StaffReplacementService staffReplacementService)
        {
            this.logger = logger;
            this.staffReplacementService = staffReplacementService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.StaffReplacement>>>> Select(ActionReq<CampusModels.StaffReplacementSelectReq> req)
        {
            ActionRes<List<CampusModels.StaffReplacement>> result = new ActionRes<List<CampusModels.StaffReplacement>>();
            result.item = await staffReplacementService.Select(req.item);
            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffReplacement>>> Save(ActionReq<CampusModels.StaffReplacement> req)
        {
            ActionRes<CampusModels.StaffReplacement> result = new ActionRes<CampusModels.StaffReplacement>();
            if (!string.IsNullOrWhiteSpace(req.item.id))
            {
                result.item = await staffReplacementService.Update(req.item);
            }
            else
            {
                result.item = await staffReplacementService.Insert(req.item);
            }
            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.StaffReplacementDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await staffReplacementService.Delete(req.item);
            return Ok(result);
        }
    }
}
