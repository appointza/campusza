-- QUICK FIX: Create event_bookings table
-- Copy and paste this entire SQL into your PostgreSQL client and run it

CREATE TABLE IF NOT EXISTS event_bookings (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    organisation_id INT NOT NULL,
    organisation_location_id INT NOT NULL,
    people_count INT NOT NULL DEFAULT 1,
    notes TEXT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_organisation_id ON event_bookings(organisation_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);

-- Verify table was created
SELECT 'Event bookings table created successfully!' AS status;

