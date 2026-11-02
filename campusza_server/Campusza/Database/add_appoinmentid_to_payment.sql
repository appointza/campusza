-- Add missing columns to payment table if they don't exist
ALTER TABLE payment ADD COLUMN IF NOT EXISTS appoinmentid BIGINT;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS paymentmodetype VARCHAR(50);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS paymentmodecode VARCHAR(100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_appoinmentid ON payment(appoinmentid);
CREATE INDEX IF NOT EXISTS idx_payment_paymentmodetype ON payment(paymentmodetype);

