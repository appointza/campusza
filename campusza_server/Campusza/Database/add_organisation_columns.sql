-- Migration script to add isverified and isPaymentRequired columns to Organisation table
-- Created: $(date)

-- Add isverified column
ALTER TABLE Organisation 
ADD COLUMN isverified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add isPaymentRequired column  
ALTER TABLE Organisation 
ADD COLUMN isPaymentRequired BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN Organisation.isverified IS 'Indicates if the organisation has been verified';
COMMENT ON COLUMN Organisation.isPaymentRequired IS 'Indicates if payment is required for this organisation';

-- Optional: Update existing records if needed
-- UPDATE Organisation SET isverified = FALSE WHERE isverified IS NULL;
-- UPDATE Organisation SET isPaymentRequired = FALSE WHERE isPaymentRequired IS NULL;
