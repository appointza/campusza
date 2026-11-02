-- Migration script to alter latitude and longitude columns from BIGINT to DOUBLE PRECISION
-- Created: 2025-01-13
-- Purpose: Allow storing decimal coordinate values (e.g., 13.1104768, 80.1538048)

-- Alter latitude column from BIGINT to DOUBLE PRECISION
ALTER TABLE OrganisationLocation 
ALTER COLUMN latitude TYPE DOUBLE PRECISION USING latitude::DOUBLE PRECISION;

-- Alter longitude column from BIGINT to DOUBLE PRECISION
ALTER TABLE OrganisationLocation 
ALTER COLUMN longitude TYPE DOUBLE PRECISION USING longitude::DOUBLE PRECISION;

-- Add comments for documentation
COMMENT ON COLUMN OrganisationLocation.latitude IS 'Latitude coordinate in decimal degrees (e.g., 13.1104768)';
COMMENT ON COLUMN OrganisationLocation.longitude IS 'Longitude coordinate in decimal degrees (e.g., 80.1538048)';

-- Verify the changes
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'organisationlocation' 
-- AND column_name IN ('latitude', 'longitude');

