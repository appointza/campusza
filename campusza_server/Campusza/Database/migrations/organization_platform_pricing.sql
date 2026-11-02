-- Per-organization Campusza platform fee (per student / year or per term).

DROP TABLE IF EXISTS platform_student_pricing;

CREATE TABLE IF NOT EXISTS organization_platform_pricing (
    organization_id VARCHAR(255) PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    billing_period VARCHAR(20) NOT NULL DEFAULT 'per_year'
        CHECK (billing_period IN ('per_year', 'per_term')),
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    amount_per_student_yearly NUMERIC(12, 2) NOT NULL DEFAULT 0,
    term_amounts JSONB NOT NULL DEFAULT '[
        {"label": "1st Term", "amount": 0},
        {"label": "2nd Term", "amount": 0},
        {"label": "3rd Term", "amount": 0}
    ]'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_organization_platform_pricing_org
    ON organization_platform_pricing (organization_id);

COMMENT ON TABLE organization_platform_pricing IS 'Campusza license fee per active student, configured per school/organization.';
