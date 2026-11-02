using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ReferenceValueController : ControllerBase
    {
        ILogger<ReferenceValueController> logger;
        ReferenceValueService referenceValueService;

        public ReferenceValueController(ILogger<ReferenceValueController> logger, ReferenceValueService referenceValueService)
        {
            this.logger = logger;
            this.referenceValueService = referenceValueService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.ReferenceValue>>> Entity()
        {
            ActionRes<CampusModels.ReferenceValue> result = new ActionRes<CampusModels.ReferenceValue>()
            {
                item = new CampusModels.ReferenceValue()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ReferenceValue>>>> Select(ActionReq<CampusModels.ReferenceValueSelectReq> req)
        {
            ActionRes<List<CampusModels.ReferenceValue>> result = new ActionRes<List<CampusModels.ReferenceValue>>();
            result.item = await referenceValueService.Select(req.item);
            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.ReferenceValue>>> Insert(ActionReq<CampusModels.ReferenceValue> req)
        {
            ActionRes<CampusModels.ReferenceValue> result = new ActionRes<CampusModels.ReferenceValue>();
            result.item = await referenceValueService.Insert(req.item);
            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.ReferenceValue>>> Update(ActionReq<CampusModels.ReferenceValue> req)
        {
            ActionRes<CampusModels.ReferenceValue> result = new ActionRes<CampusModels.ReferenceValue>();
            result.item = await referenceValueService.Update(req.item);
            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.ReferenceValue>>> Save(ActionReq<CampusModels.ReferenceValue> req)
        {
            ActionRes<CampusModels.ReferenceValue> result = new ActionRes<CampusModels.ReferenceValue>();

            if (!string.IsNullOrWhiteSpace(req.item.id))
            {
                result.item = await referenceValueService.Update(req.item);
            }
            else
            {
                result.item = await referenceValueService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.ReferenceValueDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await referenceValueService.Delete(req.item);
            return Ok(result);
        }
    }
}
