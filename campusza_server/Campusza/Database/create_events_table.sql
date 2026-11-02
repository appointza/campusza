-- Migration: Create events table
-- Date: 2024
-- Description: Creates the events table for managing organization events

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    organisation_id INT NOT NULL,
    organisation_location_id INT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) CHECK (event_type IN ('single', 'range', 'daily')) NOT NULL,
    event_date DATE,
    from_date DATE,
    to_date DATE,
    timing_config JSONB,  -- e.g. { "Mon": ["06:00-07:00", "08:00-09:00"], "Tue": ["04:00-06:00"] }
    payment_type VARCHAR(20) CHECK (payment_type IN ('clientpay', 'userpay')) NOT NULL,
    entry_amount DECIMAL(10,2),
    slot_limit INT,
    dress_code VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    images JSONB,  -- e.g. [1, 5, 12]
    is_public BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),  -- Event rating between 0.00 and 5.00
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Add comments to document the table
COMMENT ON TABLE events IS 'Table for storing organization events';

COMMENT ON COLUMN events.event_type IS 'Type of event: single (one-time), range (date range), daily (recurring daily)';
COMMENT ON COLUMN events.timing_config IS 'JSON object with day-wise timing configurations';
COMMENT ON COLUMN events.images IS 'JSON array of image IDs';
COMMENT ON COLUMN events.status IS 'Event status: active, completed, or cancelled';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_organisation_id ON events(organisation_id);
CREATE INDEX IF NOT EXISTS idx_events_organisation_location_id ON events(organisation_location_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_from_date ON events(from_date);
CREATE INDEX IF NOT EXISTS idx_events_to_date ON events(to_date);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

