-- Migration script to add platform-specific push token columns
-- Created: 2026-01-13
-- Purpose: Store push tokens separately for web, iOS, and Android platforms

-- Add platform-specific push token columns
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS webpushnotification TEXT,
ADD COLUMN IF NOT EXISTS iospushnotification TEXT,
ADD COLUMN IF NOT EXISTS androidpushnotification TEXT;

-- Add comments for documentation
COMMENT ON COLUMN Users.webpushnotification IS 'Web push notification token (FCM web push)';
COMMENT ON COLUMN Users.iospushnotification IS 'iOS push notification token (APNs)';
COMMENT ON COLUMN Users.androidpushnotification IS 'Android push notification token (FCM)';

-- Optional: Migrate existing push_token data to appropriate platform column
-- This assumes existing tokens are Android (most common)
-- Uncomment and adjust if needed:
-- UPDATE Users 
-- SET androidpushnotification = push_token 
-- WHERE push_token IS NOT NULL AND push_token != '' AND androidpushnotification IS NULL;

