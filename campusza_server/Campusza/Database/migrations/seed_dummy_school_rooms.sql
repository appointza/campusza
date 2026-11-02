-- Dev/demo: 15 sample rooms per organization (safe to rerun — skips existing names).
-- Replace @organization_id with your org id from: SELECT id FROM organizations LIMIT 1;

DO $$
DECLARE
    org_id VARCHAR(255) := 'dbd8d63e-78e1-4647-ac45-27bf7ff619a2';
    n INTEGER;
    room_name VARCHAR(100);
BEGIN
    FOR n IN 1..15 LOOP
        room_name := 'Room ' || n::text;
        INSERT INTO school_rooms (
            id, organization_id, name, building, floor, capacity,
            rows_count, columns_count, linked_class_id, legacy_reference_id,
            is_active, created_at, updated_at, created_by, updated_by
        )
        VALUES (
            gen_random_uuid()::varchar,
            org_id,
            room_name,
            'Main Block',
            CASE WHEN n <= 5 THEN 'Ground' WHEN n <= 10 THEN 'First' ELSE 'Second' END,
            25 + (n % 6),
            NULL,
            NULL,
            NULL,
            NULL,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            'seed',
            'seed'
        )
        ON CONFLICT (organization_id, name) DO NOTHING;
    END LOOP;
END $$;
