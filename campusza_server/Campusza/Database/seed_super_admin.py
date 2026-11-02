"""One-time: add users.isfactory and upsert platform super admin. Password via SUPER_ADMIN_PASSWORD env."""
import hashlib
import os
import sys
import uuid

import psycopg2

EMAIL = "aravindan9302@gmail.com"
USERNAME = "aravindan9302"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def main() -> int:
    password = os.environ.get("SUPER_ADMIN_PASSWORD", "").strip()
    if not password:
        print("Set SUPER_ADMIN_PASSWORD env var.", file=sys.stderr)
        return 1

    conn = psycopg2.connect(
        host=os.environ.get("PGHOST", "43.205.255.163"),
        port=int(os.environ.get("PGPORT", "5432")),
        dbname=os.environ.get("PGDATABASE", "campusza"),
        user=os.environ.get("PGUSER", "postgres"),
        password=os.environ.get("PGPASSWORD", "abc123"),
    )
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS isfactory BOOLEAN NOT NULL DEFAULT false"
    )

    cur.execute(
        "SELECT id, name FROM organizations WHERE is_active = true ORDER BY created_at ASC LIMIT 1"
    )
    row = cur.fetchone()
    if not row:
        print("No active organization found.", file=sys.stderr)
        return 1
    org_id, org_name = row[0], row[1]

    pwd_hash = sha256(password)
    cur.execute(
        "SELECT id FROM users WHERE lower(email) = lower(%s) LIMIT 1",
        (EMAIL,),
    )
    existing = cur.fetchone()

    if existing:
        user_id = existing[0]
        cur.execute(
            """
            UPDATE users SET
                username = %s,
                password_hash = %s,
                role = 'admin',
                status = 'active',
                organization_id = %s,
                isfactory = true,
                email_verified = true,
                password_setup_required = false,
                is_active = true,
                updated_at = NOW()
            WHERE id = %s
            """,
            (USERNAME, pwd_hash, org_id, user_id),
        )
        print(f"Updated super admin {EMAIL} (org: {org_name})")
    else:
        user_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO users (
                id, email, username, password_hash, role, status,
                organization_id, profile_id, email_verified, two_factor_enabled,
                is_active, isfactory, created_at, updated_at, created_by,
                password_setup_required
            ) VALUES (
                %s, %s, %s, %s, 'admin', 'active',
                %s, %s, true, false,
                true, true, NOW(), NOW(), %s,
                false
            )
            """,
            (user_id, EMAIL, USERNAME, pwd_hash, org_id, user_id, EMAIL),
        )
        print(f"Created super admin {EMAIL} (org: {org_name})")

    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
