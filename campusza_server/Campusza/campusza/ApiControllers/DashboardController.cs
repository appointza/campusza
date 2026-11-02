using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        ILogger<DashboardController> logger;
        DashboardService dashboardService;

        public DashboardController(ILogger<DashboardController> logger, DashboardService dashboardService)
        {
            this.logger = logger;
            this.dashboardService = dashboardService;
        }
        
        // --- Config Operations ---

         [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.DashboardConfig>>> Entity()
        {
            ActionRes<CampusModels.DashboardConfig> result = new ActionRes<CampusModels.DashboardConfig>()
            {
               item = new CampusModels.DashboardConfig()
            };

            return Ok(result);
        }

        [HttpPost("SelectConfig")]
        public async Task<ActionResult<ActionRes<List<CampusModels.DashboardConfig>>>> SelectConfig(ActionReq<CampusModels.DashboardConfigSelectReq> req)
        {
            ActionRes<List<CampusModels.DashboardConfig>> result = new ActionRes<List<CampusModels.DashboardConfig>>();

            result.item = await dashboardService.SelectConfig(req.item);

            return Ok(result);
        }

        [HttpPost("InsertConfig")]
        public async Task<ActionResult<ActionRes<CampusModels.DashboardConfig>>> InsertConfig(ActionReq<CampusModels.DashboardConfig> req)
        {
            ActionRes<CampusModels.DashboardConfig> result = new ActionRes<CampusModels.DashboardConfig>();

            result.item = await dashboardService.InsertConfig(req.item);

            return Ok(result);
        }
        
         [HttpPost("UpdateConfig")]
        public async Task<ActionResult<ActionRes<CampusModels.DashboardConfig>>> UpdateConfig(ActionReq<CampusModels.DashboardConfig> req)
        {
            ActionRes<CampusModels.DashboardConfig> result = new ActionRes<CampusModels.DashboardConfig>();

            result.item = await dashboardService.UpdateConfig(req.item);

            return Ok(result);
        }

        [HttpPost("SaveConfig")]
        public async Task<ActionResult<ActionRes<CampusModels.DashboardConfig>>> SaveConfig(ActionReq<CampusModels.DashboardConfig> req)
        {
            ActionRes<CampusModels.DashboardConfig> result = new ActionRes<CampusModels.DashboardConfig>();

            if(req.item.id > 0){
                result.item = await dashboardService.UpdateConfig(req.item);
            }else{
                result.item = await dashboardService.InsertConfig(req.item);
            }

            return Ok(result);
        }
        
         [HttpPost("DeleteConfig")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteConfig(ActionReq<CampusModels.DashboardConfigDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await dashboardService.DeleteConfig(req.item);

            return Ok(result);
        }
        
        // --- Stats Operations ---

        [HttpPost("GetStats")]
        public async Task<ActionResult<ActionRes<CampusModels.DashboardStatsDTO>>> GetStats(ActionReq<CampusModels.DashboardSelectReq> req)
        {
            ActionRes<CampusModels.DashboardStatsDTO> result = new ActionRes<CampusModels.DashboardStatsDTO>();

            result.item = await dashboardService.GetStats(req.item);

            return Ok(result);
        }

        [HttpPost("GetAdminDashboardPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminDashboardPageRes>>> GetAdminDashboardPage(ActionReq<CampusModels.AdminDashboardPageReq> req)
        {
            ActionRes<CampusModels.AdminDashboardPageRes> result = new ActionRes<CampusModels.AdminDashboardPageRes>();
            result.item = await dashboardService.GetAdminDashboardPage(req.item);
            return Ok(result);
        }
    }
}
