using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StaffScheduleController : ControllerBase
    {
        ILogger<StaffScheduleController> logger;
        StaffScheduleService staffScheduleService;

        public StaffScheduleController(ILogger<StaffScheduleController> logger, StaffScheduleService staffScheduleService)
        {
            this.logger = logger;
            this.staffScheduleService = staffScheduleService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.StaffSchedule>>>> Select(ActionReq<CampusModels.StaffScheduleSelectReq> req)
        {
            ActionRes<List<CampusModels.StaffSchedule>> result = new ActionRes<List<CampusModels.StaffSchedule>>();
            result.item = await staffScheduleService.Select(req.item);
            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffSchedule>>> Save(ActionReq<CampusModels.StaffSchedule> req)
        {
            ActionRes<CampusModels.StaffSchedule> result = new ActionRes<CampusModels.StaffSchedule>();
            if (!string.IsNullOrWhiteSpace(req.item.id))
            {
                result.item = await staffScheduleService.Update(req.item);
            }
            else
            {
                result.item = await staffScheduleService.Insert(req.item);
            }
            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.StaffScheduleDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await staffScheduleService.Delete(req.item);
            return Ok(result);
        }
    }
}
