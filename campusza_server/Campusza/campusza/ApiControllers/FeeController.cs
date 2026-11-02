using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class FeeController : ControllerBase
    {
        ILogger<FeeController> logger;
        FeeService feeService;

        public FeeController(ILogger<FeeController> logger, FeeService feeService)
        {
            this.logger = logger;
            this.feeService = feeService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Fee>>> Entity()
        {
            ActionRes<CampusModels.Fee> result = new ActionRes<CampusModels.Fee>()
            {
               item = new CampusModels.Fee()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Fee>>>> Select(ActionReq<CampusModels.FeeSelectReq> req)
        {
            ActionRes<List<CampusModels.Fee>> result = new ActionRes<List<CampusModels.Fee>>();

            result.item = await feeService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Fee>>> Insert(ActionReq<CampusModels.Fee> req)
        {
            ActionRes<CampusModels.Fee> result = new ActionRes<CampusModels.Fee>();

            result.item = await feeService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Fee>>> Update(ActionReq<CampusModels.Fee> req)
        {
            ActionRes<CampusModels.Fee> result = new ActionRes<CampusModels.Fee>();

            result.item = await feeService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Fee>>> Save(ActionReq<CampusModels.Fee> req)
        {
            ActionRes<CampusModels.Fee> result = new ActionRes<CampusModels.Fee>();

            if(req.item.id > 0){
                result.item = await feeService.Update(req.item);
            }else{
                result.item = await feeService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.FeeDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await feeService.Delete(req.item);

            return Ok(result);
        }
    }
}
