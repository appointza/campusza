-- Extended student profile (parents, transport, fees, medical extras) as JSON
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS extended_profile JSONB NOT NULL DEFAULT '{}'::jsonb;
