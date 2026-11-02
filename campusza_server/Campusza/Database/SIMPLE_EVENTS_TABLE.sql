-- SIMPLE VERSION: Just the table, no indexes
-- Copy and paste this into your PostgreSQL client

CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    organisation_id INT NOT NULL,
    organisation_location_id INT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) CHECK (event_type IN ('single', 'range', 'daily')) NOT NULL,
    event_date DATE,
    from_date DATE,
    to_date DATE,
    timing_config JSONB,
    payment_type VARCHAR(20) CHECK (payment_type IN ('clientpay', 'userpay')) NOT NULL,
    entry_amount DECIMAL(10,2),
    slot_limit INT,
    dress_code VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    images JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

