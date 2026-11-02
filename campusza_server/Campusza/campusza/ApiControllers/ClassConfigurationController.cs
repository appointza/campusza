using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    public class UpdateDocumentStatusRequest
    {
        public string id { get; set; }
        public string status { get; set; }
    }

    [Route("api/campusza/[controller]")]
    [ApiController]
    public class ClassConfigurationController : ControllerBase
    {
        ILogger<ClassConfigurationController> logger;
        ClassConfigurationService configService;

        public ClassConfigurationController(ILogger<ClassConfigurationController> logger, ClassConfigurationService configService)
        {
            this.logger = logger;
            this.configService = configService;
        }

        // --- ClassFeeConfiguration ---
        [HttpPost("SelectFeeConfig")]
        public async Task<ActionResult<ActionRes<List<CampusModels.ClassFeeConfiguration>>>> SelectFeeConfig(ActionReq<CampusModels.ClassConfigurationSelectReq> req)
        {
            ActionRes<List<CampusModels.ClassFeeConfiguration>> result = new ActionRes<List<CampusModels.ClassFeeConfiguration>>();
            result.item = await configService.SelectFeeConfig(req.item);
            return Ok(result);
        }

        [HttpPost("SaveFeeConfig")]
        public async Task<ActionResult<ActionRes<CampusModels.ClassFeeConfiguration>>> SaveFeeConfig(ActionReq<CampusModels.ClassFeeConfiguration> req)
        {
            ActionRes<CampusModels.ClassFeeConfiguration> result = new ActionRes<CampusModels.ClassFeeConfiguration>();
            result.item = await configService.SaveFeeConfig(req.item);
            return Ok(result);
        }

        [HttpPost("DeleteFeeConfig")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteFeeConfig(ActionReq<CampusModels.ClassConfigurationDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await configService.DeleteFeeConfig(req.item);
            return Ok(result);
        }

        // --- DocumentRequirement ---
        [HttpPost("SelectDocumentRequirement")]
        public async Task<ActionResult<ActionRes<List<CampusModels.DocumentRequirement>>>> SelectDocumentRequirement(ActionReq<CampusModels.ClassConfigurationSelectReq> req)
        {
            ActionRes<List<CampusModels.DocumentRequirement>> result = new ActionRes<List<CampusModels.DocumentRequirement>>();
            result.item = await configService.SelectDocumentRequirement(req.item);
            return Ok(result);
        }

        [HttpPost("SaveDocumentRequirement")]
        public async Task<ActionResult<ActionRes<CampusModels.DocumentRequirement>>> SaveDocumentRequirement(ActionReq<CampusModels.DocumentRequirement> req)
        {
            ActionRes<CampusModels.DocumentRequirement> result = new ActionRes<CampusModels.DocumentRequirement>();
            result.item = await configService.SaveDocumentRequirement(req.item);
            return Ok(result);
        }

        [HttpPost("DeleteDocumentRequirement")]
        public async Task<ActionResult<ActionRes<bool>>> DeleteDocumentRequirement(ActionReq<CampusModels.ClassConfigurationDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await configService.DeleteDocumentRequirement(req.item);
            return Ok(result);
        }

        [HttpPost("UpdateDocumentRequirementStatus")]
        public async Task<ActionResult<ActionRes<bool>>> UpdateDocumentRequirementStatus(ActionReq<UpdateDocumentStatusRequest> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();
            result.item = await configService.UpdateDocumentRequirementStatus(req.item.id, req.item.status);
            return Ok(result);
        }
    }
}
