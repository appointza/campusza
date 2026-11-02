-- =====================================================
-- DATABASE MIGRATION: Add description column to referencevalue table
-- =====================================================

-- Add description column to referencevalue table
ALTER TABLE referencevalue ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records to have empty description if null
UPDATE referencevalue SET description = '' WHERE description IS NULL;

-- Add comment to the column
COMMENT ON COLUMN referencevalue.description IS 'Description field for reference values';
