-- Term school calendar: weekly patterns (e.g. every Sunday closed) and specific date overrides

CREATE TABLE IF NOT EXISTS school_calendar_weekly_rules (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    term_id VARCHAR(255) NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    weekday SMALLINT NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    day_type VARCHAR(20) NOT NULL CHECK (day_type IN ('closed', 'half_day')),
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_calendar_weekly_unique
    ON school_calendar_weekly_rules(organization_id, term_id, weekday)
    WHERE is_active = true;

CREATE TABLE IF NOT EXISTS school_calendar_day_overrides (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    term_id VARCHAR(255) NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    calendar_date DATE NOT NULL,
    day_type VARCHAR(20) NOT NULL CHECK (day_type IN ('closed', 'half_day', 'open')),
    reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_calendar_day_unique
    ON school_calendar_day_overrides(organization_id, term_id, calendar_date)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_school_calendar_overrides_term_date
    ON school_calendar_day_overrides(term_id, calendar_date);
