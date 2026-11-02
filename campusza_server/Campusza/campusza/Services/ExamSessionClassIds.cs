using Campusza.Models.Campusza;
using Campusza.Utils;
using Npgsql;
using System.Data.Common;

namespace Campusza.Services.Campusza
{
    internal static class ExamSessionClassIds
    {
        internal static async Task AttachBatchAsync(IDb db, string orgId, List<ExamSession> sessions)
        {
            if (string.IsNullOrWhiteSpace(orgId) || sessions.Count == 0)
                return;

            foreach (var s in sessions)
                s.classids ??= new List<string>();

            var sessionIds = sessions
                .Select(s => s.id)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (sessionIds.Count == 0)
                return;

            try
            {
                var placeholders = string.Join(", ", sessionIds.Select((_, i) => $"@sid{i}"));
                var query = $@"
                    SELECT exam_session_id, class_id FROM exam_session_classes
                    WHERE organization_id = @organization_id AND exam_session_id IN ({placeholders})
                    ORDER BY exam_session_id, class_id";
                var cmd = db.GetCommand(query);
                db.AddParameter(cmd, "organization_id", DbTypes.Types.String).Value = orgId;
                for (var i = 0; i < sessionIds.Count; i++)
                {
                    var p = db.AddParameter(cmd, $"sid{i}", DbTypes.Types.String);
                    p.Value = sessionIds[i];
                }

                var byId = sessions.ToDictionary(s => s.id, s => s, StringComparer.OrdinalIgnoreCase);
                using (var reader = await db.Execute(cmd))
                {
                    while (await reader.ReadAsync())
                    {
                        var sid = reader["exam_session_id"]?.ToString() ?? "";
                        var cid = reader["class_id"]?.ToString() ?? "";
                        if (byId.TryGetValue(sid, out var session) && !string.IsNullOrWhiteSpace(cid))
                            session.classids!.Add(cid);
                    }
                }
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UndefinedTable
                && ex.MessageText.Contains("exam_session_classes", StringComparison.OrdinalIgnoreCase))
            {
            }
        }

        internal static async Task<List<string>> LoadForSessionAsync(IDb db, string orgId, string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                return new List<string>();
            var session = new ExamSession { id = sessionId, organizationid = orgId, classids = new List<string>() };
            await AttachBatchAsync(db, orgId, new List<ExamSession> { session });
            return session.classids ?? new List<string>();
        }
    }
}
