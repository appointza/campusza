using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class StudentPromotionController : ControllerBase
    {
        private StudentPromotionService studentPromotionService;

        public StudentPromotionController(StudentPromotionService service)
        {
            studentPromotionService = service;
        }

        [HttpPost("GetAcademicHistory")]
        public async Task<ActionResult<ActionRes<List<StudentAcademicHistory>>>> GetAcademicHistory(ActionReq<StudentPromotionSelectReq> req)
        {
            ActionRes<List<StudentAcademicHistory>> result = new ActionRes<List<StudentAcademicHistory>>();
            result.item = await studentPromotionService.GetStudentAcademicHistory(req.item.studentid, req.item.organizationid);
            return Ok(result);
        }

        [HttpPost("SelectPromotions")]
        public async Task<ActionResult<ActionRes<List<StudentPromotion>>>> SelectPromotions(ActionReq<StudentPromotionSelectReq> req)
        {
            ActionRes<List<StudentPromotion>> result = new ActionRes<List<StudentPromotion>>();
            result.item = await studentPromotionService.SelectPromotions(req.item);
            return Ok(result);
        }

    }
}
