using System.Data.Common;
using System.Security.Cryptography;
using Campusza.AwsS3;
using Campusza.Models;
using Campusza.Models.Campusza;
using Campusza.Utils;
using Microsoft.Extensions.Options;

namespace Campusza.Services.Campusza
{
    public class OrganizationAssetService
    {
        private const long MaxFileBytes = 25 * 1024 * 1024;

        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
        };

        private readonly IDbProvider dbprovider;
        private readonly IQueryBuilderProvider querybuilderprovider;
        private readonly OrganizationIdResolver organizationIdResolver;
        private readonly AwsS3Service awsS3Service;
        private readonly ApplicationEnvironment appSettings;
        private readonly IWebHostEnvironment webHostEnvironment;
        private readonly ILogger<OrganizationAssetService> logger;
        private readonly string localStorageRoot;

        public OrganizationAssetService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            OrganizationIdResolver organizationIdResolver,
            AwsS3Service awsS3Service,
            IOptions<ApplicationEnvironment> appSettings,
            IWebHostEnvironment webHostEnvironment,
            ILogger<OrganizationAssetService> logger)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.organizationIdResolver = organizationIdResolver;
            this.awsS3Service = awsS3Service;
            this.appSettings = appSettings.Value;
            this.webHostEnvironment = webHostEnvironment;
            this.logger = logger;

            localStorageRoot = Path.Combine(webHostEnvironment.ContentRootPath, "AssetStorage");
            Directory.CreateDirectory(localStorageRoot);
        }

        public async Task<OrganizationAsset> UploadAsync(
            IFormFile file,
            string organizationId,
            string email,
            string kind)
        {
            if (file == null || file.Length <= 0)
                throw new AppException(AppException.ErrorCodes.BadRequest, "File is required.");
            if (file.Length > MaxFileBytes)
                throw new AppException(AppException.ErrorCodes.BadRequest, "File exceeds the 25 MB limit.");

            var contentType = (file.ContentType ?? "").Trim();
            if (string.IsNullOrWhiteSpace(contentType))
                contentType = "application/octet-stream";
            if (!AllowedContentTypes.Contains(contentType))
                throw new AppException(AppException.ErrorCodes.BadRequest, "File type is not allowed.");

            var orgId = await organizationIdResolver.RequireAsync(organizationId, email);
            var normalizedKind = NormalizeKind(kind);
            var assetId = Guid.NewGuid().ToString();
            var storageKey = $"{orgId}/{assetId}";

            byte[] bytes;
            await using (var stream = file.OpenReadStream())
            {
                using var ms = new MemoryStream();
                await stream.CopyToAsync(ms);
                bytes = ms.ToArray();
            }

            var checksum = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
            var provider = awsS3Service.IsEnabled ? "s3" : "local";
            var originalName = Path.GetFileName(file.FileName ?? "upload");

            if (provider == "s3")
            {
                var written = await awsS3Service.WriteObj(storageKey, bytes);
                if (!written)
                    throw new AppException(AppException.ErrorCodes.BadRequest, "Failed to store file in object storage.");
            }
            else
            {
                var fullPath = GetLocalPath(storageKey);
                Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
                await File.WriteAllBytesAsync(fullPath, bytes);
            }

            var now = DateTime.UtcNow;
            var actor = string.IsNullOrWhiteSpace(email) ? "system" : email.Trim();
            var asset = new OrganizationAsset
            {
                id = assetId,
                organizationid = orgId,
                storageprovider = provider,
                storagekey = storageKey,
                originalfilename = originalName,
                contenttype = contentType,
                filesizebytes = bytes.LongLength,
                kind = normalizedKind,
                checksumsha256 = checksum,
                uploadedby = actor,
                isactive = true,
                createdat = now,
                updatedat = now,
                createdby = actor,
                updatedby = actor,
            };

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await InsertTransaction(db, asset);
            }

            return asset;
        }

        public async Task<List<OrganizationAsset>> Select(OrganizationAssetSelectReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string query = @"
                SELECT
                    id, organization_id, storage_provider, storage_key,
                    original_file_name, content_type, file_size_bytes, kind,
                    checksum_sha256, uploaded_by, is_active,
                    created_at, updated_at, created_by, updated_by
                FROM organization_assets
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("organization_id", "=", "organization_id", orgId, DbTypes.Types.String);
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);

            if (!string.IsNullOrWhiteSpace(req.id))
                queryBuilder.AddParameter("id", "=", "id", req.id.Trim(), DbTypes.Types.String);
            if (!string.IsNullOrWhiteSpace(req.kind))
                queryBuilder.AddParameter("kind", "=", "kind", NormalizeKind(req.kind), DbTypes.Types.String);

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "created_at");

            var result = new List<OrganizationAsset>();
            var command = queryBuilder.GetCommand(db);
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
                result.Add(MapRow(reader));

            return result;
        }

        public async Task<(byte[] Content, string ContentType, string FileName)?> GetContentAsync(
            string id,
            string organizationId,
            string email)
        {
            if (string.IsNullOrWhiteSpace(id))
                return null;

            var orgId = await organizationIdResolver.RequireAsync(organizationId, email);
            var rows = await Select(new OrganizationAssetSelectReq
            {
                id = id,
                organizationid = orgId,
                email = email,
            });
            var asset = rows.FirstOrDefault();
            if (asset == null)
                return null;

            byte[] content;
            if (asset.storageprovider == "s3")
                content = await awsS3Service.GetObj(asset.storagekey);
            else
                content = await File.ReadAllBytesAsync(GetLocalPath(asset.storagekey));

            return (content, asset.contenttype, asset.originalfilename);
        }

        public async Task Delete(OrganizationAssetDeleteReq req)
        {
            var orgId = await organizationIdResolver.RequireAsync(req.organizationid, req.email);
            if (string.IsNullOrWhiteSpace(req.id))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Asset id is required.");

            using IDb db = await dbprovider.GetDb();
            await db.Connect();

            const string query = @"
                UPDATE organization_assets
                SET is_active = false, updated_at = @updated_at, updated_by = @updated_by
                WHERE id = @id AND organization_id = @organization_id AND is_active = true
            ";

            var command = db.GetCommand(query);
            var now = DateTime.UtcNow;
            var actor = string.IsNullOrWhiteSpace(req.email) ? "system" : req.email.Trim();
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id.Trim();
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = orgId;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = actor;
            await db.ExecuteNonQuery(command);
        }

        public string BuildDownloadUrl(string assetId, string organizationId, string email)
        {
            var baseUrl = (appSettings.baseUrl ?? "").TrimEnd('/');
            if (string.IsNullOrWhiteSpace(baseUrl))
                baseUrl = "http://localhost:5052";

            var query = new List<string>
            {
                $"organizationid={Uri.EscapeDataString(organizationId ?? "")}",
            };
            if (!string.IsNullOrWhiteSpace(email))
                query.Add($"email={Uri.EscapeDataString(email.Trim())}");

            return $"{baseUrl}/api/campusza/OrganizationAsset/Download/{Uri.EscapeDataString(assetId)}?{string.Join("&", query)}";
        }

        private async Task InsertTransaction(IDb db, OrganizationAsset asset)
        {
            const string query = @"
                INSERT INTO organization_assets (
                    id, organization_id, storage_provider, storage_key,
                    original_file_name, content_type, file_size_bytes, kind,
                    checksum_sha256, uploaded_by, is_active,
                    created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @id, @organization_id, @storage_provider, @storage_key,
                    @original_file_name, @content_type, @file_size_bytes, @kind,
                    @checksum_sha256, @uploaded_by, @is_active,
                    @created_at, @updated_at, @created_by, @updated_by
                )
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = asset.id;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = asset.organizationid;
            db.AddParameter(command, "storage_provider", DbTypes.Types.String).Value = asset.storageprovider;
            db.AddParameter(command, "storage_key", DbTypes.Types.String).Value = asset.storagekey;
            db.AddParameter(command, "original_file_name", DbTypes.Types.String).Value = asset.originalfilename ?? "";
            db.AddParameter(command, "content_type", DbTypes.Types.String).Value = asset.contenttype;
            db.AddParameter(command, "file_size_bytes", DbTypes.Types.Long).Value = asset.filesizebytes;
            db.AddParameter(command, "kind", DbTypes.Types.String).Value = asset.kind;
            db.AddParameter(command, "checksum_sha256", DbTypes.Types.String).Value = asset.checksumsha256 ?? "";
            db.AddParameter(command, "uploaded_by", DbTypes.Types.String).Value = asset.uploadedby ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = asset.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = asset.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = asset.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = asset.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = asset.updatedby ?? "";
            await db.ExecuteNonQuery(command);
        }

        private static OrganizationAsset MapRow(DbDataReader reader)
        {
            return new OrganizationAsset
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                storageprovider = reader["storage_provider"]?.ToString() ?? "local",
                storagekey = reader["storage_key"]?.ToString() ?? "",
                originalfilename = reader["original_file_name"]?.ToString() ?? "",
                contenttype = reader["content_type"]?.ToString() ?? "",
                filesizebytes = reader["file_size_bytes"] == DBNull.Value ? 0 : Convert.ToInt64(reader["file_size_bytes"]),
                kind = reader["kind"]?.ToString() ?? "generic",
                checksumsha256 = reader["checksum_sha256"]?.ToString() ?? "",
                uploadedby = reader["uploaded_by"]?.ToString() ?? "",
                isactive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? "",
            };
        }

        private string GetLocalPath(string storageKey)
        {
            var relative = storageKey.Replace('/', Path.DirectorySeparatorChar);
            return Path.GetFullPath(Path.Combine(localStorageRoot, relative));
        }

        private static string NormalizeKind(string kind)
        {
            var k = (kind ?? "").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(k))
                return "generic";
            return k.Length > 64 ? k[..64] : k;
        }
    }
}
