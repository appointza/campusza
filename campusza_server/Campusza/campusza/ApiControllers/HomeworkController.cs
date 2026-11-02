using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class HomeworkController : ControllerBase
    {
        private readonly HomeworkService homeworkService;

        public HomeworkController(HomeworkService homeworkService)
        {
            this.homeworkService = homeworkService;
        }

        [HttpPost("GetAdminHomeworkPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminHomeworkPageRes>>> GetAdminHomeworkPage(
            ActionReq<CampusModels.AdminHomeworkPageReq> req)
        {
            var result = new ActionRes<CampusModels.AdminHomeworkPageRes>
            {
                item = await homeworkService.GetAdminHomeworkPage(req.item),
            };
            return Ok(result);
        }

        [HttpPost("GetStaffHomeworkPage")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffHomeworkPageRes>>> GetStaffHomeworkPage(
            ActionReq<CampusModels.StaffHomeworkPageReq> req)
        {
            var result = new ActionRes<CampusModels.StaffHomeworkPageRes>
            {
                item = await homeworkService.GetStaffHomeworkPage(req.item),
            };
            return Ok(result);
        }

        [HttpPost("GetStudentHomeworkPage")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentHomeworkPageRes>>> GetStudentHomeworkPage(
            ActionReq<CampusModels.StudentHomeworkPageReq> req)
        {
            var result = new ActionRes<CampusModels.StudentHomeworkPageRes>
            {
                item = await homeworkService.GetStudentHomeworkPage(req.item),
            };
            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffHomeworkPageRes>>> Save(
            ActionReq<CampusModels.HomeworkSaveReq> req)
        {
            var result = new ActionRes<CampusModels.StaffHomeworkPageRes>
            {
                item = await homeworkService.SaveHomework(req.item),
            };
            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffHomeworkPageRes>>> Delete(
            ActionReq<CampusModels.HomeworkDeletePageReq> req)
        {
            var result = new ActionRes<CampusModels.StaffHomeworkPageRes>
            {
                item = await homeworkService.DeleteHomework(req.item.delete, req.item.page),
            };
            return Ok(result);
        }
    }
}
