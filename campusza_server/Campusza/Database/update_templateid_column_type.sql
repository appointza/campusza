-- =====================================================
-- DATABASE MIGRATION: Update templateid column type from BIGINT to VARCHAR
-- =====================================================

-- First, add a new column with the correct type
ALTER TABLE organisationlocation ADD COLUMN IF NOT EXISTS templateid_new VARCHAR(100);

-- Copy data from old column to new column (convert BIGINT to VARCHAR)
UPDATE organisationlocation SET templateid_new = CAST(templateid AS VARCHAR) WHERE templateid IS NOT NULL;

-- Drop the old column
ALTER TABLE organisationlocation DROP COLUMN IF EXISTS templateid;

-- Rename the new column to the original name
ALTER TABLE organisationlocation RENAME COLUMN templateid_new TO templateid;

-- Add comment to the column
COMMENT ON COLUMN organisationlocation.templateid IS 'Reference to template ID for this location (VARCHAR)';
