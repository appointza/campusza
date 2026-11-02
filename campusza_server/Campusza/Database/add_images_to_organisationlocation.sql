-- =====================================================
-- ADD IMAGES COLUMN TO ORGANISATIONLOCATION TABLE
-- Migration script to add images_json column
-- =====================================================

-- Add images_json column to organisationlocation table
ALTER TABLE organisationlocation 
ADD COLUMN IF NOT EXISTS images_json JSONB DEFAULT '[]'::jsonb;

-- Add attributes_json column if it doesn't exist (for consistency)
ALTER TABLE organisationlocation 
ADD COLUMN IF NOT EXISTS attributes_json JSONB DEFAULT '{}'::jsonb;

-- Update existing records to have empty arrays for images
UPDATE organisationlocation 
SET images_json = '[]'::jsonb 
WHERE images_json IS NULL;

-- Update existing records to have empty objects for attributes
UPDATE organisationlocation 
SET attributes_json = '{}'::jsonb 
WHERE attributes_json IS NULL;

-- Add comments to the columns
COMMENT ON COLUMN organisationlocation.images_json IS 'JSON array of image file IDs';
COMMENT ON COLUMN organisationlocation.attributes_json IS 'JSON object for additional attributes';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'organisationlocation' 
AND column_name IN ('images_json', 'attributes_json');
