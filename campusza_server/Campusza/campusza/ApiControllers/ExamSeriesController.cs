using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ExamSeriesController : ControllerBase
    {
        private readonly ExamSeriesService examSeriesService;

        public ExamSeriesController(ExamSeriesService examSeriesService)
        {
            this.examSeriesService = examSeriesService;
        }

        [HttpGet("Entity")]
        public ActionResult<ActionRes<CampusModels.ExamSeries>> Entity()
        {
            return Ok(new ActionRes<CampusModels.ExamSeries> { item = new CampusModels.ExamSeries() });
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamSeries>>>> Select(
            ActionReq<CampusModels.ExamSeriesSelectReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamSeries>>
            {
                item = await examSeriesService.Select(req.item),
            });
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamSeries>>> Save(
            ActionReq<CampusModels.ExamSeriesSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamSeries>
            {
                item = await examSeriesService.Save(req.item),
            });
        }

        [HttpPost("Schedule")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamSeries>>> Schedule(
            ActionReq<CampusModels.ExamSeriesLifecycleReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamSeries>
            {
                item = await examSeriesService.Schedule(req.item),
            });
        }

        [HttpPost("Publish")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamSeries>>> Publish(
            ActionReq<CampusModels.ExamSeriesLifecycleReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamSeries>
            {
                item = await examSeriesService.Publish(req.item),
            });
        }

        [HttpPost("Validate")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamValidationResult>>> Validate(
            ActionReq<CampusModels.ExamSeriesValidateReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamValidationResult>
            {
                item = await examSeriesService.Validate(req.item),
            });
        }

        [HttpPost("Cancel")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamSeries>>> Cancel(
            ActionReq<CampusModels.ExamSeriesLifecycleReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamSeries>
            {
                item = await examSeriesService.Cancel(req.item),
            });
        }
    }
}
