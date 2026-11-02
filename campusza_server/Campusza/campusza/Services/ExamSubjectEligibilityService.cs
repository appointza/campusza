using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Globalization;

namespace Campusza.Services.Campusza
{
    public class ExamSubjectEligibilityService
    {
        private readonly ReferenceValueService referenceValueService;
        private readonly ClassService classService;

        public ExamSubjectEligibilityService(ReferenceValueService referenceValueService, ClassService classService)
        {
            this.referenceValueService = referenceValueService;
            this.classService = classService;
        }

        public async Task EnsureSubjectAllowedForClassAsync(IDb db, string orgId, string classId, string subjectId)
        {
            if (string.IsNullOrWhiteSpace(subjectId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Subject is required.");

            var classes = await classService.SelectTransaction(db, new ClassSelectReq { id = classId, organizationid = orgId });
            var cls = classes.FirstOrDefault()
                ?? throw new AppException(AppException.ErrorCodes.BadRequest, "Class not found.");
            ExamTenantGuard.EnsureSameOrganization(orgId, cls.organizationid, "Class");

            var gradeRefs = await referenceValueService.SelectTransaction(db, new ReferenceValueSelectReq
            {
                organizationid = orgId,
                category = "grade",
            });
            var gradeRef = gradeRefs.FirstOrDefault(g =>
                string.Equals(g.code, cls.grade, StringComparison.OrdinalIgnoreCase)
                || string.Equals(g.name, cls.grade, StringComparison.OrdinalIgnoreCase)
                || string.Equals(g.id, cls.grade, StringComparison.OrdinalIgnoreCase));

            var metadata = gradeRef?.metadata_json;
            if (ExamSubjectEligibilityRules.IsSubjectAllowed(cls.subjects_json, metadata, subjectId))
                return;

            throw new AppException(AppException.ErrorCodes.BadRequest,
                "Subject is not configured for this class or grade.");
        }
    }
}
