-- QUICK FIX: Add confirmation_status column for event bookings
-- Copy and paste this entire SQL into your PostgreSQL client and run it

-- Add confirmation_status column
ALTER TABLE event_bookings
ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(20) CHECK (confirmation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- Update existing records to be pending
UPDATE event_bookings
SET confirmation_status = 'pending'
WHERE confirmation_status IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_event_bookings_confirmation_status ON event_bookings(confirmation_status);

-- Verify column was added
SELECT 'confirmation_status column added successfully!' AS status;

