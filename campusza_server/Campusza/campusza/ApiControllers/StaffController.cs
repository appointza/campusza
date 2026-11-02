using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StaffController : ControllerBase
    {
        ILogger<StaffController> logger;
        StaffService staffService;

        public StaffController(ILogger<StaffController> logger, StaffService staffService)
        {
            this.logger = logger;
            this.staffService = staffService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Staff>>> Entity()
        {
            ActionRes<CampusModels.Staff> result = new ActionRes<CampusModels.Staff>()
            {
               item = new CampusModels.Staff()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Staff>>>> Select(ActionReq<CampusModels.StaffSelectReq> req)
        {
            ActionRes<List<CampusModels.Staff>> result = new ActionRes<List<CampusModels.Staff>>();

            result.item = await staffService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Staff>>> Insert(ActionReq<CampusModels.Staff> req)
        {
            ActionRes<CampusModels.Staff> result = new ActionRes<CampusModels.Staff>();

            result.item = await staffService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Staff>>> Update(ActionReq<CampusModels.Staff> req)
        {
            ActionRes<CampusModels.Staff> result = new ActionRes<CampusModels.Staff>();

            result.item = await staffService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Staff>>> Save(ActionReq<CampusModels.Staff> req)
        {
            ActionRes<CampusModels.Staff> result = new ActionRes<CampusModels.Staff>();

            if(!string.IsNullOrEmpty(req.item.id)){
                result.item = await staffService.Update(req.item);
            }else{
                result.item = await staffService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.StaffDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await staffService.Delete(req.item);

            return Ok(result);
        }
    }
}
