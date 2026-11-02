-- Migration: Add weekday_price, weekend_price, and is_price_different fields to OrganisationServices table
-- Date: 2024
-- Description: Adds weekday/weekend pricing functionality to organisation services

-- Add the three new columns to the OrganisationServices table
ALTER TABLE organisationservices
ADD COLUMN weekday_price BIGINT DEFAULT 0,
ADD COLUMN weekend_price BIGINT DEFAULT 0,
ADD COLUMN is_price_different BOOLEAN DEFAULT FALSE;

-- Add comments to document the new fields
COMMENT ON COLUMN organisationservices.weekday_price IS 'Price for Monday-Friday';
COMMENT ON COLUMN organisationservices.weekend_price IS 'Price for Saturday-Sunday';
COMMENT ON COLUMN organisationservices.is_price_different IS 'Flag to indicate if weekend price is different from weekday price (TRUE = different, FALSE = same price every day)';

-- Create indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_organisationservices_weekday_price ON organisationservices(weekday_price);
CREATE INDEX IF NOT EXISTS idx_organisationservices_weekend_price ON organisationservices(weekend_price);
CREATE INDEX IF NOT EXISTS idx_organisationservices_is_price_different ON organisationservices(is_price_different);

-- Update existing records: set weekday_price and weekend_price to current prize value
UPDATE organisationservices 
SET weekday_price = prize, 
    weekend_price = prize,
    is_price_different = FALSE 
WHERE weekday_price IS NULL OR weekday_price = 0;

-- Verify the changes
SELECT 
    id, 
    Servicename,
    prize,
    weekday_price,
    weekend_price,
    is_price_different,
    isactive
FROM organisationservices 
ORDER BY id;

