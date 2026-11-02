-- Migration: Add geolocation_url field to OrganisationLocation table
-- Date: 2024
-- Description: Adds geolocation_url field to store Google Maps URL for locations

-- Add the geolocation_url column to the OrganisationLocation table
ALTER TABLE OrganisationLocation
ADD COLUMN IF NOT EXISTS geolocation_url VARCHAR(500);

-- Add comment to document the new field
COMMENT ON COLUMN OrganisationLocation.geolocation_url IS 'Google Maps URL for the location generated from address coordinates';

-- Create index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_organisationlocation_geolocation_url ON OrganisationLocation(geolocation_url);

-- Update existing records: If googlelocation exists, copy it to geolocation_url
UPDATE OrganisationLocation 
SET geolocation_url = googlelocation 
WHERE googlelocation IS NOT NULL 
  AND googlelocation != '' 
  AND (geolocation_url IS NULL OR geolocation_url = '');

-- Verify the changes
SELECT 
    id, 
    name,
    addressline1,
    latitude,
    longitude,
    googlelocation,
    geolocation_url,
    isactive
FROM OrganisationLocation 
WHERE geolocation_url IS NOT NULL
ORDER BY id
LIMIT 10;

