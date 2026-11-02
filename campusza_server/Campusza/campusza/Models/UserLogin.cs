namespace Campusza.Models.Campusza
{
    public class UserLoginReq
    {
        public string email { get; set; }
        public string password { get; set; }
    }

    public class UserMobileLoginReq
    {
        public string mobile { get; set; } = "";
        /// <summary>Student date of birth (password), e.g. yyyy-MM-dd or dd-MM-yyyy.</summary>
        public string password { get; set; } = "";
        public string organizationid { get; set; } = "";
    }

    public class UserLoginRes
    {
        public string userId { get; set; }
        public string email { get; set; }
        public string role { get; set; }
        public string organizationId { get; set; }
        public string organizationName { get; set; }
        public string organizationSlug { get; set; }
        /// <summary>Staff table id (staff.id) when logged in as staff; used for classteacherid, staff_schedules, etc.</summary>
        public string staffId { get; set; } = "";
        /// <summary>students.id when logged in as student.</summary>
        public string studentId { get; set; } = "";
        public string mobile { get; set; } = "";
        /// <summary>Platform super admin (users.isfactory = true).</summary>
        public bool isfactory { get; set; }
    }

    public class UserSuperAdminFlagReq
    {
        public string email { get; set; } = "";
    }

    public class UserSuperAdminFlagRes
    {
        public bool isfactory { get; set; }
    }

    /// <summary>Self-service profile update for rows in public.users (same table as Login).</summary>
    public class UserProfileUpdateReq
    {
        public string userId { get; set; } = "";
        public string currentPassword { get; set; } = "";
        /// <summary>If empty, email is unchanged.</summary>
        public string newEmail { get; set; } = "";
        /// <summary>If empty, password is unchanged.</summary>
        public string newPassword { get; set; } = "";
    }
}
