-- Migration: Add remainingslot field to events table
-- Date: 2024
-- Description: Adds remainingslot field to track remaining available slots for events

-- Add the remainingslot column to the events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS remainingslot BIGINT DEFAULT 0;

-- Add comment to document the new field
COMMENT ON COLUMN events.remainingslot IS 'Number of remaining available slots for this event';

-- Update existing records: Set remainingslot = slot_limit if slot_limit > 0
UPDATE events 
SET remainingslot = slot_limit 
WHERE slot_limit > 0 
  AND (remainingslot IS NULL OR remainingslot = 0);

-- Verify the changes
SELECT 
    id, 
    event_name,
    slot_limit,
    remainingslot,
    status
FROM events 
ORDER BY id
LIMIT 10;

