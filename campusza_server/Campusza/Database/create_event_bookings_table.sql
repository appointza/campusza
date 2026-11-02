-- Migration: Create event_bookings table
-- Date: 2024
-- Description: Creates the event_bookings table for managing user bookings for events

CREATE TABLE IF NOT EXISTS event_bookings (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    organisation_id INT NOT NULL,
    organisation_location_id INT NOT NULL,
    people_count INT NOT NULL DEFAULT 1,
    notes TEXT, -- Stores names when people_count > 1 (e.g., "John Doe, Jane Doe")
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Add comments to document the table
COMMENT ON TABLE event_bookings IS 'Table for storing user bookings for events';
COMMENT ON COLUMN event_bookings.people_count IS 'Number of people in this booking';
COMMENT ON COLUMN event_bookings.notes IS 'Stores names of all attendees when people_count > 1 (comma-separated)';
COMMENT ON COLUMN event_bookings.status IS 'Booking status: pending, confirmed, or cancelled';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_bookings_event_id ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_organisation_id ON event_bookings(organisation_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status);

