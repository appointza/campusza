-- Rollback: add_auth_verification_tokens.sql (manual apply only)
DROP TABLE IF EXISTS auth_send_rate_limits;
DROP TABLE IF EXISTS auth_verification_challenges;

ALTER TABLE users DROP COLUMN IF EXISTS setup_completed_at;
ALTER TABLE users DROP COLUMN IF EXISTS password_setup_required;
