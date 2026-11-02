namespace Campusza.Services.Campusza
{
    /// <summary>
    /// Maps staff job role (staff.role) to users.role for login and app shell.
    /// </summary>
    internal static class StaffUserRoleMapper
    {
        public static bool IsStaffAdministratorJobRole(string? staffJobRole)
        {
            return string.Equals(staffJobRole?.Trim(), "administrator", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// users.role for a staff-linked login account (never returns primary org "admin").
        /// </summary>
        public static string MapStaffJobRoleToUserRole(string? staffJobRole)
        {
            return IsStaffAdministratorJobRole(staffJobRole) ? "admin_staff" : "staff";
        }

        /// <summary>
        /// When syncing from staff profile, preserve primary organization admin accounts.
        /// </summary>
        public static string ResolveUserRoleForStaffSync(string? currentUserRole, string? staffJobRole)
        {
            if (string.Equals(currentUserRole?.Trim(), "admin", StringComparison.OrdinalIgnoreCase))
                return "admin";

            return MapStaffJobRoleToUserRole(staffJobRole);
        }
    }
}
