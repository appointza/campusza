-- Allow multiple archived snapshots per (org, student, academic_year) so promotions
-- append history instead of ON CONFLICT DO NOTHING skipping inserts.
-- Run once on existing databases created from the older schema.

ALTER TABLE student_academic_history
    DROP CONSTRAINT IF EXISTS student_academic_history_organization_id_student_id_academic_year_key;
