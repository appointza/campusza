using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    internal static class OrganizationAssetReference
    {
        /// <summary>
        /// FK to organization_assets must be NULL, not empty string, and must exist for the org.
        /// </summary>
        public static async Task<string?> ResolvePhotoAssetIdAsync(IDb db, string organizationId, string? photoAssetId)
        {
            if (string.IsNullOrWhiteSpace(photoAssetId))
                return null;

            var id = photoAssetId.Trim();
            if (string.IsNullOrWhiteSpace(organizationId))
                return null;

            const string sql = @"
                SELECT 1
                FROM organization_assets
                WHERE id = @id
                  AND organization_id = @organization_id
                  AND is_active = true
                LIMIT 1";

            var cmd = db.GetCommand(sql);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = organizationId.Trim();

            using var reader = await db.Execute(cmd);
            return await reader.ReadAsync() ? id : null;
        }

        public static object ToDbParameter(string? assetId) =>
            string.IsNullOrWhiteSpace(assetId) ? DBNull.Value : assetId.Trim();
    }
}
