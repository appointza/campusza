-- Migration: Add isactive column to events, event_bookings, and reviews tables
-- Date: 2024
-- Description: Adds soft delete functionality by adding isactive column to these tables

-- Add isactive to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

-- Update existing records to be active
UPDATE events
SET isactive = TRUE
WHERE isactive IS NULL;

-- Add isactive to event_bookings table
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

-- Update existing records to be active
UPDATE event_bookings
SET isactive = TRUE
WHERE isactive IS NULL;

-- Add isactive to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

-- Update existing records to be active
UPDATE reviews
SET isactive = TRUE
WHERE isactive IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_isactive ON events(isactive);
CREATE INDEX IF NOT EXISTS idx_event_bookings_isactive ON event_bookings(isactive);
CREATE INDEX IF NOT EXISTS idx_reviews_isactive ON reviews(isactive);

-- Add comments
COMMENT ON COLUMN events.isactive IS 'Soft delete flag: TRUE = active, FALSE = deleted';
COMMENT ON COLUMN event_bookings.isactive IS 'Soft delete flag: TRUE = active, FALSE = deleted';
COMMENT ON COLUMN reviews.isactive IS 'Soft delete flag: TRUE = active, FALSE = deleted';

