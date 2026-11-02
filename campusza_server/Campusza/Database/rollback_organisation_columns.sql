-- Rollback script to remove isverified and isPaymentRequired columns from Organisation table
-- Created: $(date)
-- WARNING: This will permanently delete data in these columns!

-- Remove isverified column
ALTER TABLE Organisation 
DROP COLUMN IF EXISTS isverified;

-- Remove isPaymentRequired column  
ALTER TABLE Organisation 
DROP COLUMN IF EXISTS isPaymentRequired;

-- Note: These columns have been moved to OrganisationLocation table instead
