-- Migration: Add show_price field to OrganisationServices table
-- Date: 2024
-- Description: Adds show_price field to control whether price should be displayed for organisation services

-- Add the show_price column to the OrganisationServices table
ALTER TABLE organisationservices
ADD COLUMN show_price BOOLEAN DEFAULT TRUE;

-- Add comment to document the new field
COMMENT ON COLUMN organisationservices.show_price IS 'Flag to control whether price should be displayed for this service';

-- Create index for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_organisationservices_show_price ON organisationservices(show_price);

-- Update existing records with default value (if needed)
UPDATE organisationservices SET show_price = TRUE WHERE show_price IS NULL;

-- Verify the changes
SELECT 
    id, 
    Servicename,
    prize,
    show_price,
    isactive
FROM organisationservices 
ORDER BY id;

