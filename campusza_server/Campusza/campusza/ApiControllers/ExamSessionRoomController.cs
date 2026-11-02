using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ExamSessionRoomController : ControllerBase
    {
        private readonly ExamSessionRoomService examSessionRoomService;

        public ExamSessionRoomController(ExamSessionRoomService examSessionRoomService)
        {
            this.examSessionRoomService = examSessionRoomService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamSessionRoom>>>> Select(
            ActionReq<CampusModels.ExamSessionRoomSelectReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamSessionRoom>>
            {
                item = await examSessionRoomService.Select(req.item),
            });
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamSessionRoom>>>> Save(
            ActionReq<CampusModels.ExamSessionRoomSaveReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamSessionRoom>>
            {
                item = await examSessionRoomService.Save(req.item),
            });
        }
    }
}
