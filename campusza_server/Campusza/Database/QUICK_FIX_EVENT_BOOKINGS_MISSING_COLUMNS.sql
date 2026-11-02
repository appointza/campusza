-- QUICK FIX: Add all missing columns to event_bookings table
-- Copy and paste this entire SQL into your PostgreSQL client and run it
-- This adds all columns that the EventBookingService expects

-- Add confirmation_status column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) CHECK (confirmation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Add number_of_people column (if table has people_count, we'll rename it)
DO $$
BEGIN
    -- Check if people_count exists but number_of_people doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_bookings' AND column_name = 'people_count'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_bookings' AND column_name = 'number_of_people'
    ) THEN
        ALTER TABLE event_bookings RENAME COLUMN people_count TO number_of_people;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_bookings' AND column_name = 'number_of_people'
    ) THEN
        ALTER TABLE event_bookings ADD COLUMN number_of_people INT NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Add total_amount column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Add payment_status column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Add payment_reference column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) DEFAULT '';

-- Add check_in_status column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS check_in_status VARCHAR(20) DEFAULT 'not_checked_in';

-- Add isactive column (if not already added)
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE;

-- Update existing records with default values
UPDATE event_bookings
SET confirmation_status = 'pending'
WHERE confirmation_status IS NULL;

UPDATE event_bookings
SET payment_status = 'pending'
WHERE payment_status IS NULL;

UPDATE event_bookings
SET payment_reference = ''
WHERE payment_reference IS NULL;

UPDATE event_bookings
SET check_in_status = 'not_checked_in'
WHERE check_in_status IS NULL;

UPDATE event_bookings
SET isactive = TRUE
WHERE isactive IS NULL;

UPDATE event_bookings
SET number_of_people = 1
WHERE number_of_people IS NULL OR number_of_people = 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_confirmation_status ON event_bookings(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_payment_status ON event_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_check_in_status ON event_bookings(check_in_status);
CREATE INDEX IF NOT EXISTS idx_event_bookings_isactive ON event_bookings(isactive);

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'event_bookings' 
ORDER BY ordinal_position;

SELECT 'All missing columns added successfully to event_bookings table!' AS status;

