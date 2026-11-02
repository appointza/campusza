using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using System.Data.Common;
using System.Globalization;
using System.Text.Json;

namespace Campusza.Services.Campusza
{
    public class ExamAuditService
    {
        private readonly IDbProvider dbprovider;
        private readonly RequestState requeststate;

        public ExamAuditService(IDbProvider dbprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.requeststate = requeststate;
        }

        public async Task AppendAsync(
            IDb db,
            string organizationId,
            string entityType,
            string entityId,
            string action,
            string? reason = null,
            object? before = null,
            object? after = null,
            string? actor = null)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required for audit.");

            var entry = new ExamAuditLogEntry
            {
                id = Guid.NewGuid().ToString(),
                organizationid = organizationId.Trim(),
                entitytype = entityType ?? "",
                entityid = entityId ?? "",
                action = action ?? "",
                reason = reason ?? "",
                beforejson = before == null ? "" : JsonSerializer.Serialize(before),
                afterjson = after == null ? "" : JsonSerializer.Serialize(after),
                createdby = string.IsNullOrWhiteSpace(actor) ? ResolveActor() : actor,
                createdat = DateTime.UtcNow,
            };

            await InsertTransaction(db, entry);
        }

        public async Task InsertTransaction(IDb db, ExamAuditLogEntry entry)
        {
            const string query = @"
                INSERT INTO exam_audit_log (
                    id, organization_id, entity_type, entity_id, action, reason,
                    before_json, after_json, created_by, created_at
                ) VALUES (
                    @id, @organization_id, @entity_type, @entity_id, @action, @reason,
                    @before_json::jsonb, @after_json::jsonb, @created_by, @created_at
                )";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String).Value = entry.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = entry.organizationid;
            db.AddParameter(cmd, "entity_type", DbTypes.Types.String).Value = entry.entitytype;
            db.AddParameter(cmd, "entity_id", DbTypes.Types.String).Value = entry.entityid;
            db.AddParameter(cmd, "action", DbTypes.Types.String).Value = entry.action;
            db.AddParameter(cmd, "reason", DbTypes.Types.String).Value = entry.reason ?? "";
            db.AddParameter(cmd, "before_json", DbTypes.Types.Json).Value =
                string.IsNullOrWhiteSpace(entry.beforejson) ? "{}" : entry.beforejson;
            db.AddParameter(cmd, "after_json", DbTypes.Types.Json).Value =
                string.IsNullOrWhiteSpace(entry.afterjson) ? "{}" : entry.afterjson;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String).Value = entry.createdby ?? "";
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime).Value = entry.createdat;
            await db.ExecuteNonQuery(cmd);
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString(CultureInfo.InvariantCulture) : "system";
        }
    }
}
