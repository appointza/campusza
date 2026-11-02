-- Migration script to add isverified and isPaymentRequired columns to OrganisationLocation table
-- Created: $(date)

-- Add isverified column
ALTER TABLE OrganisationLocation 
ADD COLUMN isverified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add isPaymentRequired column  
ALTER TABLE OrganisationLocation 
ADD COLUMN isPaymentRequired BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN OrganisationLocation.isverified IS 'Indicates if the organisation location has been verified';
COMMENT ON COLUMN OrganisationLocation.isPaymentRequired IS 'Indicates if payment is required for this organisation location';

-- Optional: Update existing records if needed
-- UPDATE OrganisationLocation SET isverified = FALSE WHERE isverified IS NULL;
-- UPDATE OrganisationLocation SET isPaymentRequired = FALSE WHERE isPaymentRequired IS NULL;
