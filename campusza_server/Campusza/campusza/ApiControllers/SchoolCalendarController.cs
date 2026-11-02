using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class SchoolCalendarController : ControllerBase
    {
        private readonly SchoolCalendarService schoolCalendarService;

        public SchoolCalendarController(SchoolCalendarService schoolCalendarService)
        {
            this.schoolCalendarService = schoolCalendarService;
        }

        [HttpPost("GetPage")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolCalendarPageRes>>> GetPage(
            ActionReq<CampusModels.SchoolCalendarPageReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolCalendarPageRes>
            {
                item = await schoolCalendarService.GetPage(req.item),
            });
        }

        [HttpPost("SaveWeeklyRule")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolCalendarPageRes>>> SaveWeeklyRule(
            ActionReq<CampusModels.SchoolCalendarWeeklyRuleSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolCalendarPageRes>
            {
                item = await schoolCalendarService.SaveWeeklyRule(req.item),
            });
        }

        [HttpPost("DeleteWeeklyRule")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolCalendarPageRes>>> DeleteWeeklyRule(
            ActionReq<CampusModels.SchoolCalendarDeleteReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolCalendarPageRes>
            {
                item = await schoolCalendarService.DeleteWeeklyRule(req.item),
            });
        }

        [HttpPost("SaveDayOverride")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolCalendarPageRes>>> SaveDayOverride(
            ActionReq<CampusModels.SchoolCalendarDayOverrideSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolCalendarPageRes>
            {
                item = await schoolCalendarService.SaveDayOverride(req.item),
            });
        }

        [HttpPost("DeleteDayOverride")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolCalendarPageRes>>> DeleteDayOverride(
            ActionReq<CampusModels.SchoolCalendarDeleteReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolCalendarPageRes>
            {
                item = await schoolCalendarService.DeleteDayOverride(req.item),
            });
        }
    }
}
