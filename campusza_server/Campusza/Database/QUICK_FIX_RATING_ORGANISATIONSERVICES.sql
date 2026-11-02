-- QUICK FIX: Add rating column to organisationservices table
-- Copy and paste this into your PostgreSQL client

ALTER TABLE organisationservices
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

-- Verify
SELECT 'rating column added successfully to organisationservices!' AS status;
SELECT id, Servicename, rating FROM organisationservices LIMIT 5;

