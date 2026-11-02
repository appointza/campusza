using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class AuthenticationController : ControllerBase
    {
        private readonly AuthenticationService authenticationService;

        public AuthenticationController(AuthenticationService authenticationService)
        {
            this.authenticationService = authenticationService;
        }

        [HttpPost("ForgotPassword")]
        public async Task<ActionResult<ActionRes<ForgotPasswordRes>>> ForgotPassword(
            ActionReq<ForgotPasswordReq> req,
            CancellationToken cancellationToken)
        {
            return Ok(new ActionRes<ForgotPasswordRes>
            {
                item = await authenticationService.ForgotPasswordAsync(req.item ?? new ForgotPasswordReq(), cancellationToken)
            });
        }

        [HttpPost("CheckSignInEmail")]
        public async Task<ActionResult<ActionRes<CheckSignInEmailRes>>> CheckSignInEmail(ActionReq<CheckSignInEmailReq> req)
        {
            return Ok(new ActionRes<CheckSignInEmailRes>
            {
                item = await authenticationService.CheckSignInEmailAsync(req.item ?? new CheckSignInEmailReq())
            });
        }

        [HttpPost("ResetPassword")]
        public async Task<ActionResult<ActionRes<ResetPasswordRes>>> ResetPassword(
            ActionReq<ResetPasswordReq> req,
            CancellationToken cancellationToken)
        {
            return Ok(new ActionRes<ResetPasswordRes>
            {
                item = await authenticationService.ResetPasswordAsync(req.item ?? new ResetPasswordReq(), cancellationToken)
            });
        }

        [HttpPost("CompleteInitialSetup")]
        public async Task<ActionResult<ActionRes<CompleteInitialSetupRes>>> CompleteInitialSetup(
            ActionReq<CompleteInitialSetupReq> req,
            CancellationToken cancellationToken)
        {
            return Ok(new ActionRes<CompleteInitialSetupRes>
            {
                item = await authenticationService.CompleteInitialSetupAsync(req.item ?? new CompleteInitialSetupReq(), cancellationToken)
            });
        }

        [HttpPost("ValidateToken")]
        public async Task<ActionResult<ActionRes<ValidateAuthTokenRes>>> ValidateToken(ActionReq<ValidateAuthTokenReq> req)
        {
            return Ok(new ActionRes<ValidateAuthTokenRes>
            {
                item = await authenticationService.ValidateAuthTokenAsync(req.item ?? new ValidateAuthTokenReq())
            });
        }

        [HttpPost("SendEmailOtp")]
        public async Task<ActionResult<ActionRes<SendEmailOtpRes>>> SendEmailOtp(
            ActionReq<SendEmailOtpReq> req,
            CancellationToken cancellationToken)
        {
            return Ok(new ActionRes<SendEmailOtpRes>
            {
                item = await authenticationService.SendEmailOtpAsync(req.item ?? new SendEmailOtpReq(), cancellationToken)
            });
        }

        [HttpPost("VerifyEmailOtp")]
        public async Task<ActionResult<ActionRes<VerifyEmailOtpRes>>> VerifyEmailOtp(ActionReq<VerifyEmailOtpReq> req)
        {
            return Ok(new ActionRes<VerifyEmailOtpRes>
            {
                item = await authenticationService.VerifyEmailOtpAsync(req.item ?? new VerifyEmailOtpReq())
            });
        }
    }
}
