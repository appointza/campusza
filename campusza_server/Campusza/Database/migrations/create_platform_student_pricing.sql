-- Platform-wide Campusza licensing: price per active student (per year or per term).

CREATE TABLE IF NOT EXISTS platform_student_pricing (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
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

INSERT INTO platform_student_pricing (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE platform_student_pricing IS 'Singleton: Campusza platform fee per student (yearly or by academic term).';
