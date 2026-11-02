-- =====================================================
-- ADD RATING COLUMN TO BOTH TABLES
-- =====================================================
-- This script adds rating field to both events and organisationservices tables
-- Rating range: 0.00 to 5.00 (DECIMAL(3,2))
-- =====================================================

-- 1. Add rating to events table (if not already exists)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

COMMENT ON COLUMN events.rating IS 'Event rating between 0.00 and 5.00';

CREATE INDEX IF NOT EXISTS idx_events_rating ON events(rating);

-- 2. Add rating to organisationservices table
ALTER TABLE organisationservices
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5);

COMMENT ON COLUMN organisationservices.rating IS 'Service rating between 0.00 and 5.00';

CREATE INDEX IF NOT EXISTS idx_organisationservices_rating ON organisationservices(rating);

-- Verify the changes
SELECT 'rating column added successfully to both tables!' AS status;

-- Sample queries to verify
SELECT id, event_name, rating FROM events LIMIT 5;
SELECT id, Servicename, rating FROM organisationservices LIMIT 5;

