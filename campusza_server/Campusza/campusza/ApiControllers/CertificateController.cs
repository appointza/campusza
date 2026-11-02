using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class CertificateController : ControllerBase
    {
        ILogger<CertificateController> logger;
        CertificateService certificateService;

        public CertificateController(ILogger<CertificateController> logger, CertificateService certificateService)
        {
            this.logger = logger;
            this.certificateService = certificateService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<CampusModels.Certificate>>> Entity()
        {
            ActionRes<CampusModels.Certificate> result = new ActionRes<CampusModels.Certificate>()
            {
               item = new CampusModels.Certificate()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<CampusModels.Certificate>>>> Select(ActionReq<CampusModels.CertificateSelectReq> req)
        {
            ActionRes<List<CampusModels.Certificate>> result = new ActionRes<List<CampusModels.Certificate>>();

            result.item = await certificateService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<CampusModels.Certificate>>> Insert(ActionReq<CampusModels.Certificate> req)
        {
            ActionRes<CampusModels.Certificate> result = new ActionRes<CampusModels.Certificate>();

            result.item = await certificateService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<CampusModels.Certificate>>> Update(ActionReq<CampusModels.Certificate> req)
        {
            ActionRes<CampusModels.Certificate> result = new ActionRes<CampusModels.Certificate>();

            result.item = await certificateService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<CampusModels.Certificate>>> Save(ActionReq<CampusModels.Certificate> req)
        {
            ActionRes<CampusModels.Certificate> result = new ActionRes<CampusModels.Certificate>();

            if(req.item.id > 0){
                result.item = await certificateService.Update(req.item);
            }else{
                result.item = await certificateService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<CampusModels.CertificateDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await certificateService.Delete(req.item);

            return Ok(result);
        }
    }
}
