using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StudentController : ControllerBase
    {
        ILogger<StudentController> logger;
        StudentService studentService;

        public StudentController(ILogger<StudentController> logger, StudentService studentService)
        {
            this.logger = logger;
            this.studentService = studentService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Student>>> Entity()
        {
            ActionRes<Student> result = new ActionRes<Student>()
            {
               item = new Student()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Student>>>> Select(ActionReq<StudentSelectReq> req)
        {
            ActionRes<List<Student>> result = new ActionRes<List<Student>>();

            result.item = await studentService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Student>>> Insert(ActionReq<Student> req)
        {
            ActionRes<Student> result = new ActionRes<Student>();

            result.item = await studentService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Student>>> Update(ActionReq<Student> req)
        {
            ActionRes<Student> result = new ActionRes<Student>();

            result.item = await studentService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Student>>> Save(ActionReq<Student> req)
        {
            ActionRes<Student> result = new ActionRes<Student>();

            if(!string.IsNullOrWhiteSpace(req.item.id)){
                result.item = await studentService.Update(req.item);
            }else{
                result.item = await studentService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<StudentDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await studentService.Delete(req.item);

            return Ok(result);
        }
    }
}
