-- Migration: Create reviews table
-- Date: 2024
-- Description: Creates reviews table for storing user reviews for services and events

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,               -- who is giving the review
    organisation_service_id BIGINT,        -- optional, if review is for a service
    event_id BIGINT,                       -- optional, if review is for an event
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5), -- rating from 0 to 5
    comment TEXT,                          -- user's comment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (organisation_service_id IS NOT NULL AND event_id IS NULL) OR
        (organisation_service_id IS NULL AND event_id IS NOT NULL)
    )
);

-- Add comments to document the table and columns
COMMENT ON TABLE reviews IS 'Stores user reviews for services and events';
COMMENT ON COLUMN reviews.user_id IS 'ID of the user who wrote the review';
COMMENT ON COLUMN reviews.organisation_service_id IS 'ID of the service being reviewed (mutually exclusive with event_id)';
COMMENT ON COLUMN reviews.event_id IS 'ID of the event being reviewed (mutually exclusive with organisation_service_id)';
COMMENT ON COLUMN reviews.rating IS 'Rating value from 0.00 to 5.00';
COMMENT ON COLUMN reviews.comment IS 'User review text/comment';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_organisation_service_id ON reviews(organisation_service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event_id ON reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Verify the table was created
SELECT 'reviews table created successfully!' AS status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

