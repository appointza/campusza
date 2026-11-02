using Campusza.AwsS3;
using Campusza.Services;
// using Campusza.Authentication.Services;
// using Campusza.FirebaseNotification.Services;
// using Campusza.Sms.Services;
// using Campusza.WhatsAppMsg.Services;
using Campusza.Utils;

namespace Campusza
{
    public static class ServicesConfiguration
    {
        public static void AddCustomServices(this IServiceCollection services)
        {
            // services.AddSingleton<UserSocketService>();
            services.AddSingleton<IQueryBuilderProvider, QueryBuilderProvider>();
            services.AddTransient<CustomCryptography>();

            // AWS S3
            services.AddSingleton<AwsS3Service>();

            // HTTP Client for Razorpay
            // services.AddHttpClient<Razorpay.RazorpayService>(client =>
            // {
            //     client.Timeout = TimeSpan.FromSeconds(30);
            //     client.DefaultRequestHeaders.Add("User-Agent", "Campusza/1.0");
            // });
            // services.AddScoped<Razorpay.RazorpayService>();
            
            // HTTP Client for Firebase Notifications
            // services.AddHttpClient<FirebaseNotificationService>(client =>
            // {
            //     client.Timeout = TimeSpan.FromSeconds(30);
            //     client.DefaultRequestHeaders.Add("User-Agent", "Campusza/1.0");
            // });
            // services.AddScoped<FirebaseNotificationService>();
            
            // Firebase Admin SDK for Notifications
            // services.AddScoped<FirebaseAdminNotificationService>();

            // HTTP Client for WhatsApp API
            // services.AddHttpClient<WhatsAppMsg.Services.WhatsAppService>(client =>
            // {
            //     client.Timeout = TimeSpan.FromSeconds(30);
            //     client.DefaultRequestHeaders.Add("User-Agent", "Campusza/1.0");
            // });
            // services.AddScoped<WhatsAppMsg.Services.WhatsAppService>();

            // HTTP Client for Google Geocoding API
            // services.AddHttpClient<GoogleGeocodingService>(client =>
            // {
            //     client.Timeout = TimeSpan.FromSeconds(30);
            //     client.DefaultRequestHeaders.Add("User-Agent", "Campusza/1.0");
            // });
            // services.AddScoped<GoogleGeocodingService>();

            // SMS Service
            // services.AddScoped<Sms.Services.SmsService>();

            //DB - Optimized service lifetimes
            //services.AddScoped<FilesService>(); // Changed from Transient to Scoped
          
            // services.AddScoped<OrganisationLocationService>(); // Changed from Transient to Scoped
            // services.AddScoped<OrganisationService>(); // Changed from Transient to Scoped
            // Changed from Transient to Scoped - moved to Authentication
            // services.AddScoped<Authentication.Services.AuthService>(); // Authentication service
            //services.AddScoped<ReferenceTypeService>(); // Changed from Transient to Scoped
            // services.AddScoped<ReferenceValueService>();
            // services.AddScoped<OrganisationServicesService>();
            // services.AddScoped<OrganisationServiceTimingService>();
            // services.AddScoped<AppoinmentService>();
            // services.AddScoped<StaffService>();
            // services.AddScoped<TimelineService>();
            // services.AddScoped<PaymentService>();
            // services.AddScoped<LeaveDatesService>();
            // services.AddScoped<OrganisationSiteService>();
            //services.AddScoped<QRCoderService>();
            // services.AddScoped<AdminService>();
            // services.AddScoped<AppointmentRecordService>();
            // services.AddScoped<EventService>();
            // services.AddScoped<EventBookingService>();
            // services.AddScoped<ReviewService>();
            // services.AddScoped<PaymentGatewayCredentialsService>();
            // services.AddScoped<ApplicationSettingsService>();
            // services.AddScoped<WebsiteService>();
            // services.AddScoped<EnquiryService>();
            //        services.AddScoped<OrganisationServiceTimingService>();

            // Campusza Services
            services.AddScoped<Campusza.Services.Campusza.EmailService>();
            services.AddScoped<Campusza.Services.Campusza.IEmailSender>(sp =>
                sp.GetRequiredService<Campusza.Services.Campusza.EmailService>());
            services.AddScoped<Campusza.Services.Campusza.AuthenticationService>();
            services.AddScoped<Campusza.Services.Campusza.StudentService>();
            services.AddScoped<Campusza.Services.Campusza.StaffService>();
            services.AddScoped<Campusza.Services.Campusza.ClassService>();
            services.AddScoped<Campusza.Services.Campusza.SubjectService>();
            services.AddScoped<Campusza.Services.Campusza.TermService>();
            services.AddScoped<Campusza.Services.Campusza.AssessmentService>();
            services.AddScoped<Campusza.Services.Campusza.GradeService>();
            services.AddScoped<Campusza.Services.Campusza.ClassConfigurationService>();
            services.AddScoped<Campusza.Services.Campusza.AttendanceService>();
            services.AddScoped<Campusza.Services.Campusza.FeeService>();
            services.AddScoped<Campusza.Services.Campusza.CertificateService>();
            services.AddScoped<Campusza.Services.Campusza.ReportService>();
            services.AddScoped<Campusza.Services.Campusza.SettingsService>();
            services.AddScoped<Campusza.Services.Campusza.DashboardService>();
            services.AddScoped<Campusza.Services.Campusza.OrganizationService>();
            services.AddScoped<Campusza.Services.Campusza.OrganizationRegistrationService>();
            services.AddScoped<Campusza.Services.Campusza.UserService>();
            services.AddScoped<Campusza.Services.Campusza.UserLoginService>();
            services.AddScoped<Campusza.Services.Campusza.StudentUserService>();
            services.AddScoped<Campusza.Services.Campusza.ReferenceValueService>();
            services.AddScoped<Campusza.Services.Campusza.StaffScheduleService>();
            services.AddScoped<Campusza.Services.Campusza.GradePeriodService>();
            services.AddScoped<Campusza.Services.Campusza.StaffLeaveService>();
            services.AddScoped<Campusza.Services.Campusza.StaffReplacementService>();
            services.AddScoped<Campusza.Services.Campusza.StudentGradeService>();
            services.AddScoped<Campusza.Services.Campusza.DocumentRequirementStudentService>();
            services.AddScoped<Campusza.Services.Campusza.StudentPromotionService>();
            services.AddScoped<Campusza.Services.Campusza.StudentEnrollmentService>();
            services.AddScoped<Campusza.Services.Campusza.OrganizationIdResolver>();
            services.AddScoped<Campusza.Services.Campusza.AdmissionNumberService>();
            services.AddScoped<Campusza.Services.Campusza.PageService>();
            services.AddScoped<Campusza.Services.Campusza.HomeworkService>();
            services.AddScoped<Campusza.Services.Campusza.SchoolCalendarService>();
            services.AddScoped<Campusza.Services.Campusza.SchoolNoticeService>();
            services.AddScoped<Campusza.Services.Campusza.OrganizationAssetService>();

            services.AddScoped<Campusza.Services.Campusza.ExamAuditService>();
            services.AddScoped<Campusza.Services.Campusza.ExamOrganizationTimeService>();
            services.AddScoped<Campusza.Services.Campusza.ExamSubjectEligibilityService>();
            services.AddScoped<Campusza.Services.Campusza.ExamValidationService>();
            services.AddScoped<Campusza.Services.Campusza.ExamSeriesService>();
            services.AddScoped<Campusza.Services.Campusza.ExamSessionService>();
            services.AddScoped<Campusza.Services.Campusza.ExamRoomService>();
            services.AddScoped<Campusza.Services.Campusza.ExamMarkService>();
            services.AddScoped<Campusza.Services.Campusza.ExamSessionRoomService>();
            services.AddScoped<Campusza.Services.Campusza.ExamSeatingService>();
            services.AddScoped<Campusza.Services.Campusza.ExamInvigilatorService>();

        }
    }
}
