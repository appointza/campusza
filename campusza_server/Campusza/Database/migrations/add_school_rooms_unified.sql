-- Unified school rooms: exam seating + classes + timetable (renamed from exam_rooms when present)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'exam_rooms'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'school_rooms'
    ) THEN
        ALTER TABLE exam_rooms RENAME TO school_rooms;
    END IF;
END $$;

-- Add class link column early so API works even if later import steps fail
ALTER TABLE classes
    ADD COLUMN IF NOT EXISTS school_room_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS school_rooms (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    floor VARCHAR(50),
    capacity INTEGER NOT NULL,
    rows_count INTEGER,
    columns_count INTEGER,
    linked_class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    legacy_reference_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT uq_school_rooms_org_name UNIQUE (organization_id, name),
    CONSTRAINT ck_school_rooms_capacity CHECK (capacity > 0),
    CONSTRAINT ck_school_rooms_rows CHECK (rows_count IS NULL OR rows_count > 0),
    CONSTRAINT ck_school_rooms_cols CHECK (columns_count IS NULL OR columns_count > 0)
);

ALTER TABLE school_rooms
    ADD COLUMN IF NOT EXISTS legacy_reference_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_school_rooms_org_active
    ON school_rooms (organization_id, name)
    WHERE is_active = true;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'school_room_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_classes_school_room
            ON classes (organization_id, school_room_id)
            WHERE school_room_id IS NOT NULL AND school_room_id <> '';
    END IF;
END $$;

-- Import room_number reference values
INSERT INTO school_rooms (
    id, organization_id, name, building, floor, capacity,
    rows_count, columns_count, linked_class_id, legacy_reference_id,
    is_active, created_at, updated_at, created_by, updated_by
)
SELECT
    rv.id::varchar,
    rv.organization_id,
    COALESCE(NULLIF(trim(rv.name), ''), rv.code, 'Room'),
    '',
    '',
    30,
    NULL,
    NULL,
    NULL,
    rv.id::varchar,
    COALESCE(rv.is_active, true),
    COALESCE(rv.created_at, CURRENT_TIMESTAMP),
    COALESCE(rv.updated_at, CURRENT_TIMESTAMP),
    COALESCE(rv.created_by::text, ''),
    COALESCE(rv.updated_by::text, '')
FROM reference_values rv
WHERE lower(rv.category) = 'room_number'
  AND rv.is_active = true
  AND rv.organization_id IS NOT NULL
  AND trim(rv.organization_id) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM school_rooms sr
      WHERE sr.organization_id = rv.organization_id
        AND lower(sr.name) = lower(COALESCE(NULLIF(trim(rv.name), ''), rv.code, 'Room'))
  )
ON CONFLICT (id) DO NOTHING;

-- Backfill classes.school_room_id and classes.room from school_rooms
UPDATE classes c
SET school_room_id = sr.id,
    room = sr.id
FROM school_rooms sr
WHERE c.school_room_id IS NULL
  AND c.room IS NOT NULL
  AND trim(c.room) <> ''
  AND sr.organization_id = c.organization_id
  AND (sr.id = c.room OR sr.legacy_reference_id = c.room);

UPDATE classes c
SET room = c.school_room_id
WHERE c.school_room_id IS NOT NULL
  AND trim(c.school_room_id) <> ''
  AND (c.room IS NULL OR trim(c.room) = '' OR c.room <> c.school_room_id);

-- Backfill staff_schedules.room to canonical school_rooms.id (legacy name or reference id)
UPDATE staff_schedules ss
SET room = sr.id
FROM school_rooms sr
WHERE ss.room IS NOT NULL
  AND trim(ss.room) <> ''
  AND ss.organization_id = sr.organization_id
  AND ss.room <> sr.id
  AND (
      sr.legacy_reference_id = ss.room
      OR lower(sr.name) = lower(ss.room)
      OR sr.id = ss.room
  );
