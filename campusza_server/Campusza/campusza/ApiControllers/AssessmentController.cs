using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class AssessmentController : ControllerBase
    {
        ILogger<AssessmentController> logger;
        AssessmentService assessmentService;

        public AssessmentController(ILogger<AssessmentController> logger, AssessmentService assessmentService)
        {
            this.logger = logger;
            this.assessmentService = assessmentService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Assessment>>> Entity()
        {
            ActionRes<CampusModels.Assessment> result = new ActionRes<CampusModels.Assessment>()
            {
               item = new CampusModels.Assessment()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Assessment>>>> Select(ActionReq<CampusModels.AssessmentSelectReq> req)
        {
            ActionRes<List<CampusModels.Assessment>> result = new ActionRes<List<CampusModels.Assessment>>();

            result.item = await assessmentService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Assessment>>> Insert(ActionReq<CampusModels.Assessment> req)
        {
            ActionRes<CampusModels.Assessment> result = new ActionRes<CampusModels.Assessment>();

            result.item = await assessmentService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Assessment>>> Update(ActionReq<CampusModels.Assessment> req)
        {
            ActionRes<CampusModels.Assessment> result = new ActionRes<CampusModels.Assessment>();

            result.item = await assessmentService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Assessment>>> Save(ActionReq<CampusModels.Assessment> req)
        {
            ActionRes<CampusModels.Assessment> result = new ActionRes<CampusModels.Assessment>();

            if(req.item.id > 0){
                result.item = await assessmentService.Update(req.item);
            }else{
                result.item = await assessmentService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.AssessmentDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await assessmentService.Delete(req.item);

            return Ok(result);
        }
    }
}
