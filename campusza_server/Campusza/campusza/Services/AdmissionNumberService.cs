using System.Data.Common;
using System.Globalization;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;

namespace Campusza.Services.Campusza
{
    public class AdmissionNumberService
    {
        private readonly IDbProvider dbprovider;
        private readonly OrganizationIdResolver organizationIdResolver;

        public AdmissionNumberService(IDbProvider dbprovider, OrganizationIdResolver organizationIdResolver)
        {
            this.dbprovider = dbprovider;
            this.organizationIdResolver = organizationIdResolver;
        }

        public async Task<AdmissionNumberSettings> GetSettings(string organizationId, string email = "")
        {
            var orgId = await organizationIdResolver.RequireAsync(organizationId, email);
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return await GetSettingsTransaction(db, orgId);
        }

        public async Task<AdmissionNumberSettings> GetSettingsTransaction(IDb db, string organizationId)
        {
            var settings = await TryReadSettings(db, organizationId);
            if (settings == null)
            {
                settings = DefaultSettings();
                await UpsertSettingsTransaction(db, organizationId, settings);
            }

            settings.preview = FormatAdmissionNumber(settings, settings.nextnumber);
            return settings;
        }

        public async Task<AdmissionNumberSettings> SaveSettings(AdmissionNumberSettingsSaveReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);
            var settings = new AdmissionNumberSettings
            {
                prefix = (req.prefix ?? "").Trim(),
                suffix = (req.suffix ?? "").Trim(),
                nextnumber = Math.Max(1, req.nextnumber),
                padding = Math.Clamp(req.padding, 1, 12),
                autogenerate = req.autogenerate,
            };

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await UpsertSettingsTransaction(db, orgId, settings);
            settings.preview = FormatAdmissionNumber(settings, settings.nextnumber);
            return settings;
        }

        public async Task<string> ReserveNextTransaction(IDb db, string organizationId, string email = "")
        {
            var orgId = await organizationIdResolver.RequireAsync(organizationId, email);
            var settings = await GetSettingsTransaction(db, orgId);
            if (!settings.autogenerate)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Automatic admission number generation is disabled.");

            var issued = settings.nextnumber;
            var admissionNo = FormatAdmissionNumber(settings, issued);

            string updateQuery = @"
                UPDATE organization_admission_number_series
                SET next_number = next_number + 1,
                    updated_at = @updated_at
                WHERE organization_id = @organization_id
                  AND next_number = @expected_number
            ";

            var command = db.GetCommand(updateQuery);
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(command, "expected_number", DbTypes.Types.Integer).Value = issued;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            var rows = await db.ExecuteNonQuery(command);
            if (rows == 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "Could not allocate admission number. Please retry.");

            return admissionNo;
        }

        public static string FormatAdmissionNumber(AdmissionNumberSettings settings, int number)
        {
            var padding = Math.Clamp(settings.padding, 1, 12);
            var padded = number.ToString(CultureInfo.InvariantCulture).PadLeft(padding, '0');
            return $"{settings.prefix}{padded}{settings.suffix}";
        }

        private static AdmissionNumberSettings DefaultSettings() => new()
        {
            prefix = "",
            suffix = "",
            nextnumber = 1,
            padding = 4,
            autogenerate = true,
        };

        private async Task<AdmissionNumberSettings?> TryReadSettings(IDb db, string organizationId)
        {
            string query = @"
                SELECT prefix, suffix, next_number, padding, auto_generate
                FROM organization_admission_number_series
                WHERE organization_id = @organization_id
                LIMIT 1
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = organizationId;

            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
                return null;

            return new AdmissionNumberSettings
            {
                prefix = reader["prefix"]?.ToString() ?? "",
                suffix = reader["suffix"]?.ToString() ?? "",
                nextnumber = reader["next_number"] == DBNull.Value ? 1 : Convert.ToInt32(reader["next_number"]),
                padding = reader["padding"] == DBNull.Value ? 4 : Convert.ToInt32(reader["padding"]),
                autogenerate = reader["auto_generate"] != DBNull.Value && Convert.ToBoolean(reader["auto_generate"]),
            };
        }

        private async Task UpsertSettingsTransaction(IDb db, string organizationId, AdmissionNumberSettings settings)
        {
            string query = @"
                INSERT INTO organization_admission_number_series (
                    organization_id, prefix, suffix, next_number, padding, auto_generate, created_at, updated_at
                ) VALUES (
                    @organization_id, @prefix, @suffix, @next_number, @padding, @auto_generate, @created_at, @updated_at
                )
                ON CONFLICT (organization_id) DO UPDATE SET
                    prefix = EXCLUDED.prefix,
                    suffix = EXCLUDED.suffix,
                    next_number = EXCLUDED.next_number,
                    padding = EXCLUDED.padding,
                    auto_generate = EXCLUDED.auto_generate,
                    updated_at = EXCLUDED.updated_at
            ";

            var now = DateTime.UtcNow;
            var command = db.GetCommand(query);
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = organizationId;
            db.AddParameter(command, "prefix", DbTypes.Types.String).Value = settings.prefix ?? "";
            db.AddParameter(command, "suffix", DbTypes.Types.String).Value = settings.suffix ?? "";
            db.AddParameter(command, "next_number", DbTypes.Types.Integer).Value = Math.Max(1, settings.nextnumber);
            db.AddParameter(command, "padding", DbTypes.Types.Integer).Value = Math.Clamp(settings.padding, 1, 12);
            db.AddParameter(command, "auto_generate", DbTypes.Types.Boolean).Value = settings.autogenerate;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;

            await db.ExecuteNonQuery(command);
        }
    }
}
