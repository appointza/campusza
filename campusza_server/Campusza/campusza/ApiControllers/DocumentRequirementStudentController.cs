using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class DocumentRequirementStudentController : ControllerBase
    {
        ILogger<DocumentRequirementStudentController> logger;
        DocumentRequirementStudentService service;

        public DocumentRequirementStudentController(ILogger<DocumentRequirementStudentController> logger, DocumentRequirementStudentService service)
        {
            this.logger = logger;
            this.service = service;
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.DocumentRequirementStudent>>>> Select(ActionReq<CampusModels.DocumentRequirementStudentSelectReq> req)
        {
            ActionRes<List<CampusModels.DocumentRequirementStudent>> result = new ActionRes<List<CampusModels.DocumentRequirementStudent>>();

            result.item = await service.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.DocumentRequirementStudent>>> Save(ActionReq<CampusModels.DocumentRequirementStudent> req)
        {
            ActionRes<CampusModels.DocumentRequirementStudent> result = new ActionRes<CampusModels.DocumentRequirementStudent>();

            result.item = await service.Save(req.item);

            return Ok(result);
        }
    }
}
