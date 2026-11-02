-- Rollback add_school_rooms_unified.sql (manual only — run only after verifying mappings)
--
-- LIMITATIONS:
-- - Rooms created only from reference_values import are not restored to reference_values.
-- - staff_schedules.room values normalized to school_rooms.id are not reverted to legacy names.
-- - classes.school_room_id is dropped; classes.room may still hold room ids until manually corrected.
-- - Renaming school_rooms back to exam_rooms does not undo merged reference imports.

ALTER TABLE classes DROP COLUMN IF EXISTS school_room_id;

ALTER TABLE school_rooms DROP COLUMN IF EXISTS legacy_reference_id;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'school_rooms'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'exam_rooms'
    ) THEN
        ALTER TABLE school_rooms RENAME TO exam_rooms;
    END IF;
END $$;
