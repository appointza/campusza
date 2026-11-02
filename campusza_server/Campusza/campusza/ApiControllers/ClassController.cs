using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ClassController : ControllerBase
    {
        ILogger<ClassController> logger;
        ClassService classService;

        public ClassController(ILogger<ClassController> logger, ClassService classService)
        {
            this.logger = logger;
            this.classService = classService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Class>>> Entity()
        {
            ActionRes<CampusModels.Class> result = new ActionRes<CampusModels.Class>()
            {
               item = new CampusModels.Class()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Class>>>> Select(ActionReq<CampusModels.ClassSelectReq> req)
        {
            ActionRes<List<CampusModels.Class>> result = new ActionRes<List<CampusModels.Class>>();

            result.item = await classService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Class>>> Insert(ActionReq<CampusModels.Class> req)
        {
            ActionRes<CampusModels.Class> result = new ActionRes<CampusModels.Class>();

            result.item = await classService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Class>>> Update(ActionReq<CampusModels.Class> req)
        {
            ActionRes<CampusModels.Class> result = new ActionRes<CampusModels.Class>();

            result.item = await classService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Class>>> Save(ActionReq<CampusModels.Class> req)
        {
            ActionRes<CampusModels.Class> result = new ActionRes<CampusModels.Class>();

            if (!string.IsNullOrWhiteSpace(req.item.id))
            {
                result.item = await classService.Update(req.item);
            }
            else
            {
                var existingId = await classService.FindExistingClassIdAfterDefaults(req.item);
                if (!string.IsNullOrWhiteSpace(existingId))
                {
                    req.item.id = existingId;
                    req.item.isactive = true;
                    result.item = await classService.Update(req.item, reactivateDeleted: true);
                }
                else
                {
                    result.item = await classService.Insert(req.item);
                }
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.ClassDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await classService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("GetAssignedToStaff")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Class>>>> GetAssignedToStaff(ActionReq<CampusModels.ClassAssignedToStaffReq> req)
        {
            ActionRes<List<CampusModels.Class>> result = new ActionRes<List<CampusModels.Class>>();
            result.item = await classService.GetAssignedToStaff(req.item);
            return Ok(result);
        }
    }
}
