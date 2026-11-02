-- Add isPaymentRequired column to organisationlocation table
ALTER TABLE organisationlocation ADD COLUMN IF NOT EXISTS isPaymentRequired BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_organisationlocation_isPaymentRequired ON organisationlocation(isPaymentRequired);

