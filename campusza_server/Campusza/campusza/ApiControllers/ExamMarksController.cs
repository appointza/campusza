using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ExamMarksController : ControllerBase
    {
        private readonly ExamMarkService examMarkService;

        public ExamMarksController(ExamMarkService examMarkService)
        {
            this.examMarkService = examMarkService;
        }

        [HttpPost("GetRegister")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkGetRegisterRes>>> GetRegister(
            ActionReq<CampusModels.ExamMarkGetRegisterReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkGetRegisterRes>
            {
                item = await examMarkService.GetRegister(req.item),
            });
        }

        [HttpPost("SaveRegister")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkSaveRegisterRes>>> SaveRegister(
            ActionReq<CampusModels.ExamMarkSaveRegisterReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkSaveRegisterRes>
            {
                item = await examMarkService.SaveRegister(req.item),
            });
        }

        [HttpPost("SubmitRegister")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkGetRegisterRes>>> SubmitRegister(
            ActionReq<CampusModels.ExamMarkRegisterWorkflowReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkGetRegisterRes>
            {
                item = await examMarkService.SubmitRegister(req.item),
            });
        }

        [HttpPost("ApproveRegister")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkGetRegisterRes>>> ApproveRegister(
            ActionReq<CampusModels.ExamMarkRegisterWorkflowReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkGetRegisterRes>
            {
                item = await examMarkService.ApproveRegister(req.item),
            });
        }

        [HttpPost("ReopenRegister")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkGetRegisterRes>>> ReopenRegister(
            ActionReq<CampusModels.ExamMarkRegisterWorkflowReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkGetRegisterRes>
            {
                item = await examMarkService.ReopenRegister(req.item),
            });
        }

        [HttpPost("PublishResults")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkPublishResultsRes>>> PublishResults(
            ActionReq<CampusModels.ExamMarkPublishResultsReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkPublishResultsRes>
            {
                item = await examMarkService.PublishResults(req.item),
            });
        }

        [HttpPost("RevokeResults")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamMarkPublishResultsRes>>> RevokeResults(
            ActionReq<CampusModels.ExamMarkPublishResultsReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamMarkPublishResultsRes>
            {
                item = await examMarkService.RevokeResults(req.item),
            });
        }

        [HttpPost("ValidateResultsPublication")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamValidationResult>>> ValidateResultsPublication(
            ActionReq<CampusModels.ExamMarkPublishResultsReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamValidationResult>
            {
                item = await examMarkService.ValidateResultsPublication(req.item),
            });
        }

        [HttpPost("GetStudentResults")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamStudentResultsRes>>> GetStudentResults(
            ActionReq<CampusModels.ExamStudentResultsReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamStudentResultsRes>
            {
                item = await examMarkService.GetStudentResults(req.item),
            });
        }

        [HttpPost("GetClassResultsSummary")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamClassResultsSummaryRes>>> GetClassResultsSummary(
            ActionReq<CampusModels.ExamClassResultsSummaryReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamClassResultsSummaryRes>
            {
                item = await examMarkService.GetClassResultsSummary(req.item),
            });
        }

        [HttpPost("GetHallTicket")]
        public async Task<ActionResult<ActionRes<CampusModels.ExamHallTicketRes>>> GetHallTicket(
            ActionReq<CampusModels.ExamHallTicketReq> req)
        {
            return Ok(new ActionRes<CampusModels.ExamHallTicketRes>
            {
                item = await examMarkService.GetHallTicket(req.item),
            });
        }
    }
}
