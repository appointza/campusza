using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StudentGradeController : ControllerBase
    {
        ILogger<StudentGradeController> logger;
        StudentGradeService studentGradeService;

        public StudentGradeController(ILogger<StudentGradeController> logger, StudentGradeService studentGradeService)
        {
            this.logger = logger;
            this.studentGradeService = studentGradeService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.StudentGrade>>>> Select(ActionReq<CampusModels.StudentGradeSelectReq> req)
        {
            ActionRes<List<CampusModels.StudentGrade>> result = new ActionRes<List<CampusModels.StudentGrade>>();

            result.item = await studentGradeService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("SaveMany")]
        public async Task<ActionResult<ActionRes<bool>>> SaveMany(ActionReq<List<CampusModels.StudentGrade>> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            if (req.item == null || req.item.Count == 0)
            {
                result.item = true;
                return Ok(result);
            }

            await studentGradeService.UpsertMany(req.item);
            result.item = true;

            return Ok(result);
        }
    }
}
