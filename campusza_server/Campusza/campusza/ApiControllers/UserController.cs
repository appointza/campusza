using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        ILogger<UserController> logger;
        UserService userService;
        UserLoginService userLoginService;

        public UserController(ILogger<UserController> logger, UserService userService, UserLoginService userLoginService)
        {
            this.logger = logger;
            this.userService = userService;
            this.userLoginService = userLoginService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<User>>> Entity()
        {
            ActionRes<User> result = new ActionRes<User>()
            {
               item = new User()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<User>>>> Select(ActionReq<UserSelectReq> req)
        {
            ActionRes<List<User>> result = new ActionRes<List<User>>();

            result.item = await userService.Select(req.item);

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<User>>> Insert(ActionReq<User> req)
        {
            ActionRes<User> result = new ActionRes<User>();

            result.item = await userService.Insert(req.item);

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<User>>> Update(ActionReq<User> req)
        {
            ActionRes<User> result = new ActionRes<User>();

            result.item = await userService.Update(req.item);

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<User>>> Save(ActionReq<User> req)
        {
            ActionRes<User> result = new ActionRes<User>();

            if(req.item.id > 0){
                result.item = await userService.Update(req.item);
            }else{
                result.item = await userService.Insert(req.item);
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<UserDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await userService.Delete(req.item);

            return Ok(result);
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ActionRes<UserLoginRes>>> Login(ActionReq<UserLoginReq> req)
        {
            ActionRes<UserLoginRes> result = new ActionRes<UserLoginRes>();

            result.item = await userLoginService.Login(req.item);

            return Ok(result);
        }

        [HttpPost("LoginWithMobile")]
        public async Task<ActionResult<ActionRes<UserLoginRes>>> LoginWithMobile(ActionReq<UserMobileLoginReq> req)
        {
            ActionRes<UserLoginRes> result = new ActionRes<UserLoginRes>();
            result.item = await userLoginService.LoginWithMobile(req.item);
            return Ok(result);
        }

        [HttpPost("GetSuperAdminFlag")]
        public async Task<ActionResult<ActionRes<UserSuperAdminFlagRes>>> GetSuperAdminFlag(
            ActionReq<UserSuperAdminFlagReq> req)
        {
            ActionRes<UserSuperAdminFlagRes> result = new ActionRes<UserSuperAdminFlagRes>();
            result.item = await userLoginService.GetSuperAdminFlag(req.item?.email ?? "");
            return Ok(result);
        }

        [HttpPost("UpdateProfile")]
        public async Task<ActionResult<ActionRes<UserLoginRes>>> UpdateProfile(ActionReq<UserProfileUpdateReq> req)
        {
            ActionRes<UserLoginRes> result = new ActionRes<UserLoginRes>();
            result.item = await userLoginService.UpdateProfile(req.item);
            return Ok(result);
        }
    }
}
