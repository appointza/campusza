-- School-wide free-text notices (staff/student notifications feed)
CREATE TABLE IF NOT EXISTS school_notices (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    audience VARCHAR(20) NOT NULL DEFAULT 'all'
        CHECK (audience IN ('all', 'staff', 'student')),
    publish_from DATE,
    publish_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) NOT NULL DEFAULT '',
    updated_by VARCHAR(128) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_school_notices_org_active
    ON school_notices (organization_id, is_active, publish_from);
