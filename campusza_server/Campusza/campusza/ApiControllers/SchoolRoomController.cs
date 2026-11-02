using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    /// <summary>Unified school rooms (classes, timetable, exams). Same service as ExamRoom.</summary>
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class SchoolRoomController : ControllerBase
    {
        private readonly ExamRoomService examRoomService;

        public SchoolRoomController(ExamRoomService examRoomService)
        {
            this.examRoomService = examRoomService;
        }

        [HttpGet("Entity")]
        public ActionResult<ActionRes<CampusModels.ExamRoom>> Entity()
        {
            return Ok(new ActionRes<CampusModels.ExamRoom> { item = new CampusModels.ExamRoom() });
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamRoom>>>> Select(
            ActionReq<CampusModels.ExamRoomSelectReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamRoom>>
            {
                item = await examRoomService.Select(req.item),
            });
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamRoom>>> Save(
            ActionReq<CampusModels.ExamRoomSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamRoom>
            {
                item = await examRoomService.Save(req.item.room, req.item.organizationid, req.item.email),
            });
        }
    }
}
