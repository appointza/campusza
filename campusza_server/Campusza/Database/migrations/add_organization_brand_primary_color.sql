-- School brand color (hex, e.g. #E85D04) picked from logo in Admin Settings
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_primary_color VARCHAR(7);

COMMENT ON COLUMN organizations.brand_primary_color IS 'Primary brand hex color (#RRGGBB) for student portal theming';
