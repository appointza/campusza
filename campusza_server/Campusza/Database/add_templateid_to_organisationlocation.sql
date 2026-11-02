-- =====================================================
-- DATABASE MIGRATION: Add templateid column to organisationlocation table
-- =====================================================

-- Add templateid column to organisationlocation table
ALTER TABLE organisationlocation ADD COLUMN IF NOT EXISTS templateid VARCHAR(100);

-- Add comment to the column
COMMENT ON COLUMN organisationlocation.templateid IS 'Reference to template ID for this location';
