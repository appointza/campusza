using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class SubjectController : ControllerBase
    {
        ILogger<SubjectController> logger;
        SubjectService subjectService;

        public SubjectController(ILogger<SubjectController> logger, SubjectService subjectService)
        {
            this.logger = logger;
            this.subjectService = subjectService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Subject>>> Entity()
        {
            ActionRes<CampusModels.Subject> result = new ActionRes<CampusModels.Subject>()
            {
               item = new CampusModels.Subject()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Subject>>>> Select(ActionReq<CampusModels.SubjectSelectReq> req)
        {
            ActionRes<List<CampusModels.Subject>> result = new ActionRes<List<CampusModels.Subject>>();

            result.item = await subjectService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Subject>>> Insert(ActionReq<CampusModels.Subject> req)
        {
            ActionRes<CampusModels.Subject> result = new ActionRes<CampusModels.Subject>();

            result.item = await subjectService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Subject>>> Update(ActionReq<CampusModels.Subject> req)
        {
            ActionRes<CampusModels.Subject> result = new ActionRes<CampusModels.Subject>();

            result.item = await subjectService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Subject>>> Save(ActionReq<CampusModels.Subject> req)
        {
            ActionRes<CampusModels.Subject> result = new ActionRes<CampusModels.Subject>();

            if(req.item.id > 0){
                result.item = await subjectService.Update(req.item);
            }else{
                result.item = await subjectService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.SubjectDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await subjectService.Delete(req.item);

            return Ok(result);
        }
    }
}
