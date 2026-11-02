using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ExamInvigilatorController : ControllerBase
    {
        private readonly ExamInvigilatorService examInvigilatorService;

        public ExamInvigilatorController(ExamInvigilatorService examInvigilatorService)
        {
            this.examInvigilatorService = examInvigilatorService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ExamInvigilator>>>> Select(
            ActionReq<CampusModels.ExamInvigilatorSelectReq> req)
        {
            return Ok(new ActionRes<List<CampusModels.ExamInvigilator>>
            {
                item = await examInvigilatorService.Select(req.item),
            });
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamInvigilator>>> Save(
            ActionReq<CampusModels.ExamInvigilatorSaveReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamInvigilator>
            {
                item = await examInvigilatorService.Save(req.item),
            });
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(
            ActionReq<CampusModels.ExamInvigilatorDeleteReq> req)
        {
            return Ok(new ActionRes<bool>
            {
                item = await examInvigilatorService.Delete(req.item),
            });
        }
    }
}
