using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        ILogger<AttendanceController> logger;
        AttendanceService attendanceService;

        public AttendanceController(ILogger<AttendanceController> logger, AttendanceService attendanceService)
        {
            this.logger = logger;
            this.attendanceService = attendanceService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Attendance>>> Entity()
        {
            ActionRes<CampusModels.Attendance> result = new ActionRes<CampusModels.Attendance>()
            {
               item = new CampusModels.Attendance()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Attendance>>>> Select(ActionReq<CampusModels.AttendanceSelectReq> req)
        {
            ActionRes<List<CampusModels.Attendance>> result = new ActionRes<List<CampusModels.Attendance>>();

            result.item = await attendanceService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Attendance>>> Insert(ActionReq<CampusModels.Attendance> req)
        {
            ActionRes<CampusModels.Attendance> result = new ActionRes<CampusModels.Attendance>();

            result.item = await attendanceService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Attendance>>> Update(ActionReq<CampusModels.Attendance> req)
        {
            ActionRes<CampusModels.Attendance> result = new ActionRes<CampusModels.Attendance>();

            result.item = await attendanceService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Attendance>>> Save(ActionReq<CampusModels.Attendance> req)
        {
            ActionRes<CampusModels.Attendance> result = new ActionRes<CampusModels.Attendance>();

            result.item = await attendanceService.Save(req.item);

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.AttendanceDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await attendanceService.Delete(req.item);

            return Ok(result);
        }

        /// <summary>One API: students for the class with each student's attendance status for the given date.</summary>
        [HttpPost("GetStudentsWithAttendance")]
        public async Task<ActionResult<ActionRes<List<CampusModels.StudentWithAttendanceItem>>>> GetStudentsWithAttendance(ActionReq<CampusModels.StudentsWithAttendanceReq> req)
        {
            ActionRes<List<CampusModels.StudentWithAttendanceItem>> result = new ActionRes<List<CampusModels.StudentWithAttendanceItem>>();
            result.item = await attendanceService.GetStudentsWithAttendance(req.item);
            return Ok(result);
        }

        [HttpPost("GetStaffAttendancePage")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffAttendancePageRes>>> GetStaffAttendancePage(ActionReq<CampusModels.StaffAttendancePageReq> req)
        {
            ActionRes<CampusModels.StaffAttendancePageRes> result = new ActionRes<CampusModels.StaffAttendancePageRes>();
            result.item = await attendanceService.GetStaffAttendancePage(req.item);
            return Ok(result);
        }

        [HttpPost("SaveBulk")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffAttendancePageRes>>> SaveBulk(ActionReq<CampusModels.BulkAttendanceSaveReq> req)
        {
            ActionRes<CampusModels.StaffAttendancePageRes> result = new ActionRes<CampusModels.StaffAttendancePageRes>();
            result.item = await attendanceService.SaveBulkAttendance(req.item);
            return Ok(result);
        }
    }
}
