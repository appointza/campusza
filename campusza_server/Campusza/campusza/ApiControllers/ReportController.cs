using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ReportController : ControllerBase
    {
        ILogger<ReportController> logger;
        ReportService reportService;

        public ReportController(ILogger<ReportController> logger, ReportService reportService)
        {
            this.logger = logger;
            this.reportService = reportService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Report>>> Entity()
        {
            ActionRes<CampusModels.Report> result = new ActionRes<CampusModels.Report>()
            {
               item = new CampusModels.Report()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Report>>>> Select(ActionReq<CampusModels.ReportSelectReq> req)
        {
            ActionRes<List<CampusModels.Report>> result = new ActionRes<List<CampusModels.Report>>();

            result.item = await reportService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Report>>> Insert(ActionReq<CampusModels.Report> req)
        {
            ActionRes<CampusModels.Report> result = new ActionRes<CampusModels.Report>();

            result.item = await reportService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Report>>> Update(ActionReq<CampusModels.Report> req)
        {
            ActionRes<CampusModels.Report> result = new ActionRes<CampusModels.Report>();

            result.item = await reportService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Report>>> Save(ActionReq<CampusModels.Report> req)
        {
            ActionRes<CampusModels.Report> result = new ActionRes<CampusModels.Report>();

            if(req.item.id > 0){
                result.item = await reportService.Update(req.item);
            }else{
                result.item = await reportService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.ReportDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await reportService.Delete(req.item);

            return Ok(result);
        }
    }
}
