-- Bell schedule / period times per grade (timetable rows differ by grade).
CREATE TABLE IF NOT EXISTS grade_periods (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grade_id VARCHAR(255) NOT NULL,
    grade_name VARCHAR(255) NOT NULL DEFAULT '',
    period_code VARCHAR(50) NOT NULL,
    period_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255),
    UNIQUE (organization_id, grade_id, period_code)
);

CREATE INDEX IF NOT EXISTS idx_grade_periods_org_grade
    ON grade_periods (organization_id, grade_id)
    WHERE is_active = true;
