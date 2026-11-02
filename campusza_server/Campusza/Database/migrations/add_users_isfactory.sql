-- Super admin flag on campusza users (public.users with organization_id)
ALTER TABLE users ADD COLUMN IF NOT EXISTS isfactory BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.isfactory IS 'When true, user is a platform super admin (factory account).';

CREATE INDEX IF NOT EXISTS idx_users_isfactory ON users (isfactory) WHERE isfactory = true;
