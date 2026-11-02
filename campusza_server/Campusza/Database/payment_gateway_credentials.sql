-- Create payment_gateway_credentials table
CREATE TABLE IF NOT EXISTS payment_gateway_credentials (
    id BIGSERIAL PRIMARY KEY,           -- internal DB ID
    gateway_id BIGINT,                  -- long integer ID (not unique)

    organization_id BIGINT NOT NULL,    -- college / business
    gateway_name VARCHAR(50) NOT NULL,   -- razorpay | phonepe | stripe

    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    upi_id VARCHAR(255),                -- UPI ID (optional)

    webhook_secret VARCHAR(255),        -- optional
    environment VARCHAR(20) DEFAULT 'production', -- test / production

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_gateway_org_id ON payment_gateway_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_gateway_id ON payment_gateway_credentials(gateway_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_name ON payment_gateway_credentials(gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_active ON payment_gateway_credentials(is_active);

-- Add comments
COMMENT ON TABLE payment_gateway_credentials IS 'Stores payment gateway credentials for different organizations';
COMMENT ON COLUMN payment_gateway_credentials.id IS 'Primary key - internal database ID';
COMMENT ON COLUMN payment_gateway_credentials.gateway_id IS 'Long integer ID for the gateway (not unique)';
COMMENT ON COLUMN payment_gateway_credentials.organization_id IS 'Reference to the organization/business';
COMMENT ON COLUMN payment_gateway_credentials.gateway_name IS 'Name of the payment gateway: razorpay, phonepe, stripe, etc.';
COMMENT ON COLUMN payment_gateway_credentials.api_key IS 'API key for the payment gateway';
COMMENT ON COLUMN payment_gateway_credentials.api_secret IS 'API secret for the payment gateway';
COMMENT ON COLUMN payment_gateway_credentials.upi_id IS 'UPI ID for payment gateway (optional)';
COMMENT ON COLUMN payment_gateway_credentials.webhook_secret IS 'Webhook secret for verifying webhook requests (optional)';
COMMENT ON COLUMN payment_gateway_credentials.environment IS 'Environment: test or production';
COMMENT ON COLUMN payment_gateway_credentials.is_active IS 'Whether this credential set is currently active';

