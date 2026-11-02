-- QUICK FIX: Add isactive column for soft delete
-- Copy and paste this entire SQL into your PostgreSQL client and run it

-- Add isactive to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

UPDATE events
SET isactive = TRUE
WHERE isactive IS NULL;

-- Add isactive to event_bookings table
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

UPDATE event_bookings
SET isactive = TRUE
WHERE isactive IS NULL;

-- Add isactive to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

UPDATE reviews
SET isactive = TRUE
WHERE isactive IS NULL;

-- Add confirmation_status to event_bookings table (if missing)
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) CHECK (confirmation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

UPDATE event_bookings
SET confirmation_status = 'pending'
WHERE confirmation_status IS NULL;

-- Add other missing columns that EventBookingService expects
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS number_of_people INT;

-- If people_count exists but number_of_people doesn't, rename it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_bookings' AND column_name = 'people_count'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_bookings' AND column_name = 'number_of_people'
    ) THEN
        ALTER TABLE event_bookings RENAME COLUMN people_count TO number_of_people;
    END IF;
END $$;

UPDATE event_bookings
SET number_of_people = 1
WHERE number_of_people IS NULL;

ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) DEFAULT '';

ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS check_in_status VARCHAR(20) DEFAULT 'not_checked_in';

UPDATE event_bookings
SET payment_status = 'pending' WHERE payment_status IS NULL;
UPDATE event_bookings
SET payment_reference = '' WHERE payment_reference IS NULL;
UPDATE event_bookings
SET check_in_status = 'not_checked_in' WHERE check_in_status IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_bookings_confirmation_status ON event_bookings(confirmation_status);

-- Verify columns were added
SELECT 'All columns added successfully!' AS status;

