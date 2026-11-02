using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        ILogger<SettingsController> logger;
        SettingsService settingsService;

        public SettingsController(ILogger<SettingsController> logger, SettingsService settingsService)
        {
            this.logger = logger;
            this.settingsService = settingsService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Settings>>> Entity()
        {
            ActionRes<CampusModels.Settings> result = new ActionRes<CampusModels.Settings>()
            {
               item = new CampusModels.Settings()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Settings>>>> Select(ActionReq<CampusModels.SettingsSelectReq> req)
        {
            ActionRes<List<CampusModels.Settings>> result = new ActionRes<List<CampusModels.Settings>>();

            result.item = await settingsService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Settings>>> Insert(ActionReq<CampusModels.Settings> req)
        {
            ActionRes<CampusModels.Settings> result = new ActionRes<CampusModels.Settings>();

            result.item = await settingsService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Settings>>> Update(ActionReq<CampusModels.Settings> req)
        {
            ActionRes<CampusModels.Settings> result = new ActionRes<CampusModels.Settings>();

            result.item = await settingsService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Settings>>> Save(ActionReq<CampusModels.Settings> req)
        {
            ActionRes<CampusModels.Settings> result = new ActionRes<CampusModels.Settings>();

            if(req.item.id > 0){
                result.item = await settingsService.Update(req.item);
            }else{
                result.item = await settingsService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.SettingsDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await settingsService.Delete(req.item);

            return Ok(result);
        }
    }
}
