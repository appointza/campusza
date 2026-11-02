"""Apply pending Campusza migrations (extended_profile, student login columns)."""
import psycopg2

CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

STATEMENTS = [
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS extended_profile JSONB NOT NULL DEFAULT '{}'::jsonb;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;",
    """
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_mobile_active
        ON users (organization_id, mobile)
        WHERE mobile IS NOT NULL AND mobile <> '' AND is_active = true;
    """,
]


def main() -> None:
    conn = psycopg2.connect(**CONN)
    conn.autocommit = True
    cur = conn.cursor()
    for sql in STATEMENTS:
        print("Running:", sql.strip().split("\n")[0][:80])
        cur.execute(sql)
        print("  OK")
    cur.execute(
        """
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'extended_profile'
        """
    )
    print("extended_profile exists:", cur.fetchone())
    cur.close()
    conn.close()
    print("All migrations applied.")


if __name__ == "__main__":
    main()
