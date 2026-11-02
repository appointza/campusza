-- Fix event ID 1 to be active so it shows on the website
UPDATE events 
SET isactive = true
WHERE id = 1;

-- Verify the update
SELECT id, event_name, isactive, is_public, status 
FROM events 
WHERE id IN (1, 3, 4, 5)
ORDER BY id;

