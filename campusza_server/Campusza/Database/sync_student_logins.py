"""Backfill / refresh student users: password_hash = SHA256(yyyy-MM-dd DOB)."""
import hashlib
import uuid
import psycopg2

CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def normalize_mobile(phone: str) -> str:
    digits = "".join(c for c in (phone or "") if c.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits


def main() -> None:
    conn = psycopg2.connect(**CONN)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, organization_id, phone, date_of_birth
        FROM students
        WHERE is_active = true
          AND phone IS NOT NULL AND phone <> ''
          AND date_of_birth IS NOT NULL
          AND date_of_birth >= DATE '1900-01-01'
        """
    )
    rows = cur.fetchall()
    synced = 0
    for student_id, org_id, phone, dob in rows:
        mobile = normalize_mobile(phone)
        if not mobile:
            continue
        dob_password = dob.strftime("%Y-%m-%d")
        password_hash = sha256(dob_password)
        email = f"student.{student_id}@campusza.local"

        cur.execute(
            """
            SELECT id FROM users
            WHERE (profile_id = %s OR (mobile = %s AND organization_id = %s AND role = 'student'))
              AND is_active = true
            LIMIT 1
            """,
            (student_id, mobile, org_id),
        )
        existing = cur.fetchone()
        if existing:
            cur.execute(
                """
                UPDATE users
                SET email = %s, username = %s, password_hash = %s, mobile = %s,
                    profile_id = %s, role = 'student', status = 'active',
                    otp_expires_at = NULL, updated_at = NOW()
                WHERE id = %s
                """,
                (email, mobile, password_hash, mobile, student_id, existing[0]),
            )
        else:
            cur.execute(
                """
                INSERT INTO users (
                    id, email, username, password_hash, role, status,
                    organization_id, profile_id, mobile, otp_expires_at,
                    email_verified, two_factor_enabled, is_active,
                    created_at, updated_at, created_by
                ) VALUES (
                    %s, %s, %s, %s, 'student', 'active',
                    %s, %s, %s, NULL,
                    false, false, true,
                    NOW(), NOW(), 'sync_script'
                )
                """,
                (str(uuid.uuid4()), email, mobile, password_hash, org_id, student_id, mobile),
            )
        synced += 1
        print(f"synced {student_id} mobile={mobile} dob={dob_password}")

    print(f"Done. {synced} student login(s) synced.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
