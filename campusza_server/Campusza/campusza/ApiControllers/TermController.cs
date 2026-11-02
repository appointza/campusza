using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class TermController : ControllerBase
    {
        ILogger<TermController> logger;
        TermService termService;

        public TermController(ILogger<TermController> logger, TermService termService)
        {
            this.logger = logger;
            this.termService = termService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Term>>> Entity()
        {
            ActionRes<CampusModels.Term> result = new ActionRes<CampusModels.Term>()
            {
               item = new CampusModels.Term()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Term>>>> Select(ActionReq<CampusModels.TermSelectReq> req)
        {
            ActionRes<List<CampusModels.Term>> result = new ActionRes<List<CampusModels.Term>>();

            result.item = await termService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Term>>> Insert(ActionReq<CampusModels.Term> req)
        {
            ActionRes<CampusModels.Term> result = new ActionRes<CampusModels.Term>();

            result.item = await termService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Term>>> Update(ActionReq<CampusModels.Term> req)
        {
            ActionRes<CampusModels.Term> result = new ActionRes<CampusModels.Term>();

            result.item = await termService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Term>>> Save(ActionReq<CampusModels.Term> req)
        {
            ActionRes<CampusModels.Term> result = new ActionRes<CampusModels.Term>();

            if(!string.IsNullOrWhiteSpace(req.item.id)){
                result.item = await termService.Update(req.item);
            }else{
                result.item = await termService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.TermDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await termService.Delete(req.item);

            return Ok(result);
        }
    }
}
