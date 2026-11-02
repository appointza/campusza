-- One-shot repair when migration stopped partway (safe to rerun)

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
