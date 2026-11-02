using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StaffLeaveController : ControllerBase
    {
        ILogger<StaffLeaveController> logger;
        StaffLeaveService staffLeaveService;

        public StaffLeaveController(ILogger<StaffLeaveController> logger, StaffLeaveService staffLeaveService)
        {
            this.logger = logger;
            this.staffLeaveService = staffLeaveService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.StaffLeave>>>> Select(ActionReq<CampusModels.StaffLeaveSelectReq> req)
        {
            ActionRes<List<CampusModels.StaffLeave>> result = new ActionRes<List<CampusModels.StaffLeave>>();
            result.item = await staffLeaveService.Select(req.item);
            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffLeave>>> Save(ActionReq<CampusModels.StaffLeave> req)
        {
            ActionRes<CampusModels.StaffLeave> result = new ActionRes<CampusModels.StaffLeave>();
            if (!string.IsNullOrWhiteSpace(req.item.id))
            {
                result.item = await staffLeaveService.Update(req.item);
            }
            else
            {
                result.item = await staffLeaveService.Insert(req.item);
            }
            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.StaffLeaveDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await staffLeaveService.Delete(req.item);
            return Ok(result);
        }
    }
}
