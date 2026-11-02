-- Migration: Add rating field to organisationservices table
-- Date: 2024
-- Description: Adds rating field to track service ratings (0.00 to 5.00)

-- Add the rating column to the organisationservices table
ALTER TABLE organisationservices
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

-- Add comment to document the new field
COMMENT ON COLUMN organisationservices.rating IS 'Service rating between 0.00 and 5.00';

-- Create index on rating for better query performance
CREATE INDEX IF NOT EXISTS idx_organisationservices_rating ON organisationservices(rating);

-- Verify the changes
SELECT 
    id, 
    Servicename,
    rating,
    isactive
FROM organisationservices 
ORDER BY id
LIMIT 10;

