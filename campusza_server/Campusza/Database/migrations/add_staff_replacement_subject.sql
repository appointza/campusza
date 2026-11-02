-- Optional subject override when a substitute covers a period with a different lesson.
ALTER TABLE staff_replacements
  ADD COLUMN IF NOT EXISTS subject_id VARCHAR(255);

ALTER TABLE staff_replacements
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
