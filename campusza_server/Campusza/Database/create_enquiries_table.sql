-- Migration: Create enquiries table
-- Date: 2024
-- Description: Creates the enquiries table for storing contact form submissions and other enquiries

CREATE TABLE IF NOT EXISTS enquiries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(20),
    message TEXT,
    organisation_id BIGINT NOT NULL DEFAULT 1,
    created_by BIGINT DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'new',
    source VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments to document the table
COMMENT ON TABLE enquiries IS 'Stores contact form submissions and other enquiries';
COMMENT ON COLUMN enquiries.name IS 'Name of the person submitting the enquiry';
COMMENT ON COLUMN enquiries.email IS 'Email address of the enquirer';
COMMENT ON COLUMN enquiries.mobile IS 'Mobile/phone number of the enquirer';
COMMENT ON COLUMN enquiries.message IS 'Message content from the contact form';
COMMENT ON COLUMN enquiries.organisation_id IS 'Organization ID (defaults to 1 for contact form)';
COMMENT ON COLUMN enquiries.created_by IS 'User ID who created the enquiry (0 for public contact form)';
COMMENT ON COLUMN enquiries.status IS 'Status of the enquiry (new, in_progress, resolved, etc.)';
COMMENT ON COLUMN enquiries.source IS 'Source of the enquiry (contact_form, phone, email, etc.)';
COMMENT ON COLUMN enquiries.is_active IS 'Whether the enquiry is active';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enquiries_organisation_id ON enquiries(organisation_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_source ON enquiries(source);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_enquiries_is_active ON enquiries(is_active);

-- Verify the table was created
SELECT 'enquiries table created successfully!' AS status;
SELECT COUNT(*) AS total_enquiries FROM enquiries;

