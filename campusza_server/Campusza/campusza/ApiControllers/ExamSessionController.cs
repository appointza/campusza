using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ExamSessionController : ControllerBase
    {
        private readonly ExamSessionService examSessionService;

        public ExamSessionController(ExamSessionService examSessionService)
        {
            this.examSessionService = examSessionService;
        }

        [HttpGet("Entity")]
        public ActionResult<ActionRes<CampusModels.ExamSession>> Entity()
        {
            return Ok(new ActionRes<CampusModels.ExamSession> { item = new CampusModels.ExamSession() });
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamSession>>>> Select(
            ActionReq<CampusModels.ExamSessionSelectReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamSession>>
            {
                item = await examSessionService.Select(req.item),
            });
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamSession>>> Save(
            ActionReq<CampusModels.ExamSessionSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamSession>
            {
                item = await examSessionService.Save(req.item),
            });
        }
        [HttpPost("Validate")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamValidationResult>>> Validate(
            ActionReq<CampusModels.ExamSessionValidateReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamValidationResult>
            {
                item = await examSessionService.Validate(req.item),
            });
        }
    }
}
