using System.Collections.Generic;
using System.Threading.Tasks;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StudentEnrollmentController : ControllerBase
    {
        private readonly StudentEnrollmentService enrollmentService;

        public StudentEnrollmentController(StudentEnrollmentService enrollmentService)
        {
            this.enrollmentService = enrollmentService;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<StudentEnrollment>>>> Select(ActionReq<StudentEnrollmentSelectReq> req)
        {
            ActionRes<List<StudentEnrollment>> result = new ActionRes<List<StudentEnrollment>>();
            result.item = await enrollmentService.Select(req.item);
            return Ok(result);
        }

        [HttpPost("SelectWithProfile")]
        public async Task<ActionResult<ActionRes<List<StudentEnrollmentWithProfile>>>> SelectWithProfile(ActionReq<StudentEnrollmentSelectReq> req)
        {
            ActionRes<List<StudentEnrollmentWithProfile>> result = new ActionRes<List<StudentEnrollmentWithProfile>>();
            result.item = await enrollmentService.SelectWithProfile(req.item);
            return Ok(result);
        }

        [HttpPost("GetCurrent")]
        public async Task<ActionResult<ActionRes<StudentEnrollment>>> GetCurrent(ActionReq<StudentEnrollmentSelectReq> req)
        {
            ActionRes<StudentEnrollment> result = new ActionRes<StudentEnrollment>();
            result.item = await enrollmentService.GetCurrent(req.item.studentid, req.item.organizationid);
            return Ok(result);
        }

        [HttpPost("GetTransferHistory")]
        public async Task<ActionResult<ActionRes<List<StudentTransfer>>>> GetTransferHistory(ActionReq<StudentEnrollmentSelectReq> req)
        {
            ActionRes<List<StudentTransfer>> result = new ActionRes<List<StudentTransfer>>();
            result.item = await enrollmentService.GetTransferHistory(req.item.studentid, req.item.organizationid);
            return Ok(result);
        }

        [HttpPost("CreateStudentWithEnrollment")]
        public async Task<ActionResult<ActionRes<Student>>> CreateStudentWithEnrollment(ActionReq<CreateStudentWithEnrollmentReq> req)
        {
            ActionRes<Student> result = new ActionRes<Student>();
            result.item = await enrollmentService.CreateStudentWithEnrollment(req.item);
            return Ok(result);
        }

        [HttpPost("UpdateEnrollment")]
        public async Task<ActionResult<ActionRes<StudentEnrollment>>> UpdateEnrollment(ActionReq<UpdateEnrollmentReq> req)
        {
            ActionRes<StudentEnrollment> result = new ActionRes<StudentEnrollment>();
            result.item = await enrollmentService.UpdateEnrollment(req.item);
            return Ok(result);
        }

        [HttpPost("PromoteStudents")]
        public async Task<ActionResult<ActionRes<List<StudentEnrollment>>>> PromoteStudents(ActionReq<PromoteStudentsRequest> req)
        {
            ActionRes<List<StudentEnrollment>> result = new ActionRes<List<StudentEnrollment>>();
            result.item = await enrollmentService.PromoteStudents(req.item);
            return Ok(result);
        }

        [HttpPost("TransferStudent")]
        public async Task<ActionResult<ActionRes<StudentEnrollment>>> TransferStudent(ActionReq<TransferStudentRequest> req)
        {
            ActionRes<StudentEnrollment> result = new ActionRes<StudentEnrollment>();
            result.item = await enrollmentService.TransferStudent(req.item);
            return Ok(result);
        }
    }
}
