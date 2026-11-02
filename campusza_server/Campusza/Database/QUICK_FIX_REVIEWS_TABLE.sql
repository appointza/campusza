-- QUICK FIX: Create reviews table
-- Copy and paste this into your PostgreSQL client

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    organisation_service_id BIGINT,
    event_id BIGINT,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (organisation_service_id IS NOT NULL AND event_id IS NULL) OR
        (organisation_service_id IS NULL AND event_id IS NOT NULL)
    )
);

-- Verify
SELECT 'reviews table created successfully!' AS status;

