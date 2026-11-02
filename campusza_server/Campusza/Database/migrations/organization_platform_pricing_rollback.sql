DROP TABLE IF EXISTS organization_platform_pricing;

CREATE TABLE IF NOT EXISTS platform_student_pricing (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    billing_period VARCHAR(20) NOT NULL DEFAULT 'per_year'
        CHECK (billing_period IN ('per_year', 'per_term')),
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    amount_per_student_yearly NUMERIC(12, 2) NOT NULL DEFAULT 0,
    term_amounts JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);
