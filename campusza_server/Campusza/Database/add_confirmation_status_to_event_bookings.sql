-- Migration: Add confirmation_status column to event_bookings table
-- Date: 2024
-- Description: Adds confirmation status to allow organizations to approve or reject event bookings

-- Add confirmation_status column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) CHECK (confirmation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Update existing records to be pending
UPDATE event_bookings
SET confirmation_status = 'pending'
WHERE confirmation_status IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_confirmation_status ON event_bookings(confirmation_status);

-- Add comment
COMMENT ON COLUMN event_bookings.confirmation_status IS 'Confirmation status: pending = awaiting approval, approved = confirmed, rejected = rejected';

