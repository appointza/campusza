-- QUICK FIX: Add remainingslot column to events table
-- Copy and paste this into your PostgreSQL client

ALTER TABLE events
ADD COLUMN IF NOT EXISTS remainingslot BIGINT DEFAULT 0;

-- Update existing records: Set remainingslot = slot_limit if slot_limit > 0
UPDATE events 
SET remainingslot = slot_limit 
WHERE slot_limit > 0 
  AND (remainingslot IS NULL OR remainingslot = 0);

-- Verify
SELECT 'remainingslot column added successfully!' AS status;
SELECT id, event_name, slot_limit, remainingslot FROM events LIMIT 5;

