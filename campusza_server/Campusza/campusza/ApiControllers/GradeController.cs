using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class GradeController : ControllerBase
    {
        ILogger<GradeController> logger;
        GradeService gradeService;

        public GradeController(ILogger<GradeController> logger, GradeService gradeService)
        {
            this.logger = logger;
            this.gradeService = gradeService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Grade>>> Entity()
        {
            ActionRes<CampusModels.Grade> result = new ActionRes<CampusModels.Grade>()
            {
               item = new CampusModels.Grade()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Grade>>>> Select(ActionReq<CampusModels.GradeSelectReq> req)
        {
            ActionRes<List<CampusModels.Grade>> result = new ActionRes<List<CampusModels.Grade>>();

            result.item = await gradeService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Grade>>> Insert(ActionReq<CampusModels.Grade> req)
        {
            ActionRes<CampusModels.Grade> result = new ActionRes<CampusModels.Grade>();

            result.item = await gradeService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Grade>>> Update(ActionReq<CampusModels.Grade> req)
        {
            ActionRes<CampusModels.Grade> result = new ActionRes<CampusModels.Grade>();

            result.item = await gradeService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Grade>>> Save(ActionReq<CampusModels.Grade> req)
        {
            ActionRes<CampusModels.Grade> result = new ActionRes<CampusModels.Grade>();

            if(req.item.id > 0){
                result.item = await gradeService.Update(req.item);
            }else{
                result.item = await gradeService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.GradeDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await gradeService.Delete(req.item);

            return Ok(result);
        }
    }
}
