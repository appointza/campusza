-- Per-organization admission number series (prefix + padded number + suffix)
CREATE TABLE IF NOT EXISTS organization_admission_number_series (
    organization_id VARCHAR(255) PRIMARY KEY,
    prefix VARCHAR(50) NOT NULL DEFAULT '',
    suffix VARCHAR(50) NOT NULL DEFAULT '',
    next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number >= 1),
    padding INTEGER NOT NULL DEFAULT 4 CHECK (padding >= 1 AND padding <= 12),
    auto_generate BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_org_admission_series_org
    ON organization_admission_number_series (organization_id);
