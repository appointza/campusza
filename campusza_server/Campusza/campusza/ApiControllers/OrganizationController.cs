using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationController : ControllerBase
    {
        ILogger<OrganizationController> logger;
        OrganizationService organizationService;
        OrganizationRegistrationService organizationRegistrationService;

        public OrganizationController(
            ILogger<OrganizationController> logger,
            OrganizationService organizationService,
            OrganizationRegistrationService organizationRegistrationService)
        {
            this.logger = logger;
            this.organizationService = organizationService;
            this.organizationRegistrationService = organizationRegistrationService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Organization>>> Entity()
        {
            ActionRes<Organization> result = new ActionRes<Organization>()
            {
               item = new Organization()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Organization>>>> Select(ActionReq<OrganizationSelectReq> req)
        {
            ActionRes<List<Organization>> result = new ActionRes<List<Organization>>();

            result.item = await organizationService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Organization>>> Insert(ActionReq<Organization> req)
        {
            ActionRes<Organization> result = new ActionRes<Organization>();

            result.item = await organizationService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Register")]
        public async Task<ActionResult<ActionRes<OrganizationRegistrationRes>>> Register(ActionReq<OrganizationRegistrationReq> req)
        {
            ActionRes<OrganizationRegistrationRes> result = new ActionRes<OrganizationRegistrationRes>();

            result.item = await organizationRegistrationService.Register(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Organization>>> Update(ActionReq<Organization> req)
        {
            ActionRes<Organization> result = new ActionRes<Organization>();

            result.item = await organizationService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Organization>>> Save(ActionReq<Organization> req)
        {
            ActionRes<Organization> result = new ActionRes<Organization>();

            if(req.item.id > 0){
                result.item = await organizationService.Update(req.item);
            }else{
                result.item = await organizationService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<OrganizationDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await organizationService.Delete(req.item);

            return Ok(result);
        }
    }
}
