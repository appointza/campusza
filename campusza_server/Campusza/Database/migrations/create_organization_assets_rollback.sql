ALTER TABLE document_uploads DROP COLUMN IF EXISTS asset_id;
ALTER TABLE organizations DROP COLUMN IF EXISTS logo_asset_id;
ALTER TABLE students DROP COLUMN IF EXISTS photo_asset_id;
ALTER TABLE staff DROP COLUMN IF EXISTS photo_asset_id;
DROP TABLE IF EXISTS organization_assets;
