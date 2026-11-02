-- Migration: Add booking_amount and isserviceamount fields to Organisation table
-- Date: 2024
-- Description: Adds two new fields to support booking amount and service amount functionality

-- Add the two new columns to the Organisation table
ALTER TABLE Organisation 
ADD COLUMN booking_amount DECIMAL(10,2) DEFAULT 5.10;

ALTER TABLE Organisation 
ADD COLUMN isserviceamount BOOLEAN DEFAULT false;

-- Add comments to document the new fields
COMMENT ON COLUMN Organisation.booking_amount IS 'Default booking amount for the organisation';
COMMENT ON COLUMN Organisation.isserviceamount IS 'Flag to indicate if service amount is enabled for this organisation';

-- Create indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_organisation_booking_amount ON Organisation(booking_amount);
CREATE INDEX IF NOT EXISTS idx_organisation_isserviceamount ON Organisation(isserviceamount);

-- Update existing records with default values (if needed)
UPDATE Organisation SET booking_amount = 5.10 WHERE booking_amount IS NULL OR booking_amount = 0.00;
UPDATE Organisation SET isserviceamount = false WHERE isserviceamount IS NULL;

-- Verify the changes
SELECT 
    id, 
    name, 
    booking_amount, 
    isserviceamount,
    createdon
FROM Organisation 
ORDER BY id;
