-- Central file metadata for org-scoped uploads (bytes in S3 or local AssetStorage).
CREATE TABLE IF NOT EXISTS organization_assets (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    storage_provider VARCHAR(32) NOT NULL DEFAULT 'local',
    storage_key TEXT NOT NULL,
    original_file_name VARCHAR(512),
    content_type VARCHAR(128) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    kind VARCHAR(64) NOT NULL DEFAULT 'generic',
    checksum_sha256 VARCHAR(64),
    uploaded_by VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_organization_assets_org_kind
    ON organization_assets (organization_id, kind)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_organization_assets_org_created
    ON organization_assets (organization_id, created_at DESC);

ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_asset_id VARCHAR(255)
    REFERENCES organization_assets(id) ON DELETE SET NULL;

ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_asset_id VARCHAR(255)
    REFERENCES organization_assets(id) ON DELETE SET NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_asset_id VARCHAR(255)
    REFERENCES organization_assets(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'document_uploads'
    ) THEN
        ALTER TABLE document_uploads ADD COLUMN IF NOT EXISTS asset_id VARCHAR(255)
            REFERENCES organization_assets(id) ON DELETE SET NULL;
    END IF;
END $$;
