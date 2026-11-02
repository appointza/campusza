using Campusza.Models;
using CampusModels = Campusza.Models.Campusza;
using Campusza.Services.Campusza;
using Microsoft.AspNetCore.Mvc;

namespace Campusza.Controllers.Campusza
{
    [Route("api/campusza/[controller]")]
    [ApiController]
    public class PageController : ControllerBase
    {
        ILogger<PageController> logger;
        PageService pageService;
        SchoolNoticeService schoolNoticeService;

        public PageController(
            ILogger<PageController> logger,
            PageService pageService,
            SchoolNoticeService schoolNoticeService)
        {
            this.logger = logger;
            this.pageService = pageService;
            this.schoolNoticeService = schoolNoticeService;
        }

        [HttpPost("GetStaffDashboardPage")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffDashboardPageRes>>> GetStaffDashboardPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.StaffDashboardPageRes> result = new ActionRes<CampusModels.StaffDashboardPageRes>();
            result.item = await pageService.GetStaffDashboardPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetStaffClassesPage")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffClassesPageRes>>> GetStaffClassesPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.StaffClassesPageRes> result = new ActionRes<CampusModels.StaffClassesPageRes>();
            result.item = await pageService.GetStaffClassesPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetStaffStudentsPage")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffStudentsPageRes>>> GetStaffStudentsPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.StaffStudentsPageRes> result = new ActionRes<CampusModels.StaffStudentsPageRes>();
            result.item = await pageService.GetStaffStudentsPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetStaffSchedulePage")]
        public async Task<ActionResult<ActionRes<CampusModels.StaffSchedulePageRes>>> GetStaffSchedulePage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.StaffSchedulePageRes> result = new ActionRes<CampusModels.StaffSchedulePageRes>();
            result.item = await pageService.GetStaffSchedulePage(req.item);
            return Ok(result);
        }

        [HttpPost("GetStudentTimetablePage")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentTimetablePageRes>>> GetStudentTimetablePage(
            ActionReq<CampusModels.StudentTimetablePageReq> req)
        {
            ActionRes<CampusModels.StudentTimetablePageRes> result = new ActionRes<CampusModels.StudentTimetablePageRes>();
            result.item = await pageService.GetStudentTimetablePage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdminDashboardPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminDashboardPageRes>>> GetAdminDashboardPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminDashboardPageRes> result = new ActionRes<CampusModels.AdminDashboardPageRes>();
            result.item = await pageService.GetAdminDashboardPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetPlatformDashboardPage")]
        public async Task<ActionResult<ActionRes<CampusModels.PlatformDashboardPageRes>>> GetPlatformDashboardPage(
            ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.PlatformDashboardPageRes> result = new ActionRes<CampusModels.PlatformDashboardPageRes>();
            result.item = await pageService.GetPlatformDashboardPage(req.item ?? new CampusModels.PageReq());
            return Ok(result);
        }

        [HttpPost("SavePlatformStudentPricing")]
        public async Task<ActionResult<ActionRes<CampusModels.PlatformStudentPricingConfig>>> SavePlatformStudentPricing(
            ActionReq<CampusModels.PlatformStudentPricingSaveReq> req)
        {
            ActionRes<CampusModels.PlatformStudentPricingConfig> result = new ActionRes<CampusModels.PlatformStudentPricingConfig>();
            result.item = await pageService.SavePlatformStudentPricing(req.item ?? new CampusModels.PlatformStudentPricingSaveReq());
            return Ok(result);
        }

        [HttpPost("GetAdminStudentsPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminStudentsPageRes>>> GetAdminStudentsPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminStudentsPageRes> result = new ActionRes<CampusModels.AdminStudentsPageRes>();
            result.item = await pageService.GetAdminStudentsPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdminStaffPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminStaffPageRes>>> GetAdminStaffPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminStaffPageRes> result = new ActionRes<CampusModels.AdminStaffPageRes>();
            result.item = await pageService.GetAdminStaffPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdminTermsPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminTermsPageRes>>> GetAdminTermsPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminTermsPageRes> result = new ActionRes<CampusModels.AdminTermsPageRes>();
            result.item = await pageService.GetAdminTermsPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdminClassesPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminClassesPageRes>>> GetAdminClassesPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminClassesPageRes> result = new ActionRes<CampusModels.AdminClassesPageRes>();
            result.item = await pageService.GetAdminClassesPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdminSettingsPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminSettingsPageRes>>> GetAdminSettingsPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminSettingsPageRes> result = new ActionRes<CampusModels.AdminSettingsPageRes>();
            result.item = await pageService.GetAdminSettingsPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdmissionNumberSettings")]
        public async Task<ActionResult<ActionRes<CampusModels.AdmissionNumberSettings>>> GetAdmissionNumberSettings(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdmissionNumberSettings> result = new ActionRes<CampusModels.AdmissionNumberSettings>();
            result.item = await pageService.GetAdmissionNumberSettings(req.item);
            return Ok(result);
        }

        [HttpPost("SaveAdmissionNumberSettings")]
        public async Task<ActionResult<ActionRes<CampusModels.AdmissionNumberSettings>>> SaveAdmissionNumberSettings(ActionReq<CampusModels.AdmissionNumberSettingsSaveReq> req)
        {
            ActionRes<CampusModels.AdmissionNumberSettings> result = new ActionRes<CampusModels.AdmissionNumberSettings>();
            result.item = await pageService.SaveAdmissionNumberSettings(req.item);
            return Ok(result);
        }

        [HttpPost("GetOrganizationBranding")]
        public async Task<ActionResult<ActionRes<CampusModels.OrganizationBrandingItem>>> GetOrganizationBranding(
            ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.OrganizationBrandingItem> result = new ActionRes<CampusModels.OrganizationBrandingItem>();
            result.item = await pageService.GetOrganizationBrandingPage(req.item ?? new CampusModels.PageReq());
            return Ok(result);
        }

        [HttpPost("SaveOrganizationBranding")]
        public async Task<ActionResult<ActionRes<CampusModels.OrganizationBrandingItem>>> SaveOrganizationBranding(
            ActionReq<CampusModels.SaveOrganizationBrandingReq> req)
        {
            ActionRes<CampusModels.OrganizationBrandingItem> result = new ActionRes<CampusModels.OrganizationBrandingItem>();
            result.item = await pageService.SaveOrganizationBranding(req.item ?? new CampusModels.SaveOrganizationBrandingReq());
            return Ok(result);
        }

        [HttpPost("GetAdminExamsPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminExamsPageRes>>> GetAdminExamsPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminExamsPageRes> result = new ActionRes<CampusModels.AdminExamsPageRes>();
            result.item = await pageService.GetAdminExamsPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetStudentExamTimetablePage")]
        public async Task<ActionResult<ActionRes<CampusModels.StudentExamTimetablePageRes>>> GetStudentExamTimetablePage(
            ActionReq<CampusModels.StudentExamTimetablePageReq> req)
        {
            ActionRes<CampusModels.StudentExamTimetablePageRes> result = new ActionRes<CampusModels.StudentExamTimetablePageRes>();
            result.item = await pageService.GetStudentExamTimetablePage(req.item);
            return Ok(result);
        }

        [HttpPost("GetAdminOnboardingPage")]
        public async Task<ActionResult<ActionRes<CampusModels.AdminOnboardingPageRes>>> GetAdminOnboardingPage(ActionReq<CampusModels.PageReq> req)
        {
            ActionRes<CampusModels.AdminOnboardingPageRes> result = new ActionRes<CampusModels.AdminOnboardingPageRes>();
            result.item = await pageService.GetAdminOnboardingPage(req.item);
            return Ok(result);
        }

        [HttpPost("GetSchoolNotificationsPage")]
        public async Task<ActionResult<ActionRes<CampusModels.SchoolNotificationsPageRes>>> GetSchoolNotificationsPage(
            ActionReq<CampusModels.SchoolNotificationsPageReq> req)
        {
            return Ok(new ActionRes<CampusModels.SchoolNotificationsPageRes>
            {
                item = await schoolNoticeService.GetNotificationsPage(req.item),
            });
        }
    }
}
