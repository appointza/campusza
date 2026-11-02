-- Email OTP, password reset, and initial setup tokens (hashes only)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_setup_required BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS auth_verification_challenges (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL,
    email VARCHAR(320) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    secret_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    consumed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    created_ip VARCHAR(45) NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_purpose_active
    ON auth_verification_challenges (user_id, purpose)
    WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_challenges_email_purpose_active
    ON auth_verification_challenges (lower(email), purpose)
    WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at
    ON auth_verification_challenges (expires_at);

CREATE TABLE IF NOT EXISTS auth_send_rate_limits (
    scope_key VARCHAR(512) PRIMARY KEY,
    window_start TIMESTAMP NOT NULL,
    send_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);
