using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ExamSeatingController : ControllerBase
    {
        private readonly ExamSeatingService examSeatingService;

        public ExamSeatingController(ExamSeatingService examSeatingService)
        {
            this.examSeatingService = examSeatingService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamSeatAllocation>>>> Select(
            ActionReq<CampusModels.ExamSeatSelectReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamSeatAllocation>>
            {
                item = await examSeatingService.Select(req.item),
            });
        }

        [HttpPost("GenerateSeats")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamGenerateSeatsRes>>> GenerateSeats(
            ActionReq<CampusModels.ExamGenerateSeatsReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamGenerateSeatsRes>
            {
                item = await examSeatingService.GenerateSeats(req.item),
            });
        }

        [HttpPost("AssignSeat")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamSeatAllocation>>> AssignSeat(
            ActionReq<CampusModels.ExamAssignSeatReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamSeatAllocation>
            {
                item = await examSeatingService.AssignSeat(req.item),
            });
        }
    }
}
