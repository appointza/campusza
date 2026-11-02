-- Migration: Add upi_id column to payment_gateway_credentials table
-- Date: 2026-01-09
-- Description: Adds optional upi_id column for storing UPI payment identifiers

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_gateway_credentials' 
        AND column_name = 'upi_id'
    ) THEN
        ALTER TABLE payment_gateway_credentials 
        ADD COLUMN upi_id VARCHAR(255);
        
        COMMENT ON COLUMN payment_gateway_credentials.upi_id IS 'UPI ID for payment gateway (optional)';
    END IF;
END $$;

