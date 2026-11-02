-- Student login: mobile + OTP on users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_mobile_active
    ON users (organization_id, mobile)
    WHERE mobile IS NOT NULL AND mobile <> '' AND is_active = true;
