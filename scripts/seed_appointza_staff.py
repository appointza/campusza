#!/usr/bin/env python3
"""Seed dummy staff for /admin/staff (appointza org). Safe to rerun."""
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import date, datetime, timezone

import psycopg2

ORG = "593e1eab-6cbb-4e7c-bf09-a13b778c3e2a"
SEED = "seed_appointza_staff"
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

# email, first, last, role, dept_code, subject_codes[], status, phone_suffix
STAFF_ROWS: list[tuple[str, str, str, str, str, list[str], str, str]] = [
    ("priya.rao@appointza.local", "Priya", "Rao", "teacher", "MATH", ["MATHEMATICS"], "active", "201"),
    ("karthik.m@appointza.local", "Karthik", "Menon", "teacher", "SCI", ["SCIENCE"], "active", "202"),
    ("anita.desai@appointza.local", "Anita", "Desai", "teacher", "ENG", ["ENGLISH"], "active", "203"),
    ("suresh.iyer@appointza.local", "Suresh", "Iyer", "teacher", "SOC", ["SOCIAL"], "on_leave", "204"),
    ("meena.k@appointza.local", "Meena", "Krishnan", "librarian", "ADMIN", [], "active", "205"),
    ("rajesh.p@appointza.local", "Rajesh", "Pillai", "administrator", "ADMIN", [], "active", "206"),
    ("deepa.n@appointza.local", "Deepa", "Nair", "counselor", "ADMIN", [], "active", "207"),
    ("vijay.s@appointza.local", "Vijay", "Singh", "coach", "PE", ["PE"], "active", "208"),
    ("lisa.fern@appointza.local", "Lisa", "Fernandes", "nurse", "ADMIN", [], "active", "209"),
    ("om.prakash@appointza.local", "Om", "Prakash", "teacher", "COMP", ["COMPUTER"], "inactive", "210"),
]


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ref_id(cur, category: str, code: str) -> str | None:
    cur.execute(
        """
        SELECT id FROM reference_values
        WHERE organization_id = %s AND category = %s AND lower(code) = lower(%s) AND is_active = true
        LIMIT 1
        """,
        (ORG, category, code),
    )
    row = cur.fetchone()
    return str(row[0]) if row else None


def ensure_staff(
    cur,
    now,
    email: str,
    first: str,
    last: str,
    role: str,
    department_id: str,
    subject_ids: list[str],
    status: str,
    phone: str,
) -> tuple[str, bool]:
    cur.execute(
        "SELECT id FROM staff WHERE organization_id = %s AND lower(email) = lower(%s) LIMIT 1",
        (ORG, email),
    )
    row = cur.fetchone()
    if row:
        return str(row[0]), False

    staff_uuid = str(uuid.uuid4())
    staff_code = f"STF-{staff_uuid[:8].upper()}"
    subjects_json = json.dumps(subject_ids)
    cur.execute(
        """
        INSERT INTO staff (
            id, staff_id, first_name, last_name, full_name, email, phone,
            date_of_birth, gender, address_street, address_city, address_state,
            address_zip_code, address_country, department, role, subjects,
            qualification, experience, joining_date, status, photo_url,
            emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
            salary_amount, salary_currency, salary_payment_frequency,
            organization_id, is_active, created_at, updated_at, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, 'other', '', 'Chennai', 'Tamil Nadu', '600001', 'India',
            %s, %s, %s::json,
            'B.Ed', 5, %s, %s, '',
            'Emergency Contact', 'spouse', %s,
            45000, 'INR', 'monthly',
            %s, true, %s, %s, %s, %s
        )
        """,
        (
            staff_uuid,
            staff_code,
            first,
            last,
            f"{first} {last}",
            email,
            phone,
            date(1988, 3, 20),
            department_id,
            role,
            subjects_json,
            date(2020, 6, 1),
            status,
            f"9000000{phone[-3:]}",
            ORG,
            now,
            now,
            SEED,
            SEED,
        ),
    )

    cur.execute(
        "SELECT id FROM users WHERE lower(email) = lower(%s) AND is_active = true LIMIT 1",
        (email,),
    )
    if not cur.fetchone():
        user_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO users (
                id, email, username, password_hash, role, status, organization_id, profile_id,
                last_login_at, last_login_ip, email_verified, email_verified_at, two_factor_enabled,
                password_setup_required, is_active, created_at, updated_at, created_by
            ) VALUES (
                %s, %s, %s, %s, 'staff', 'active', %s, %s,
                NULL, '', false, NULL, false,
                true, true, %s, %s, %s
            )
            """,
            (
                user_id,
                email,
                email.split("@")[0],
                sha256_hex(str(uuid.uuid4())),
                ORG,
                staff_uuid,
                now,
                now,
                SEED,
            ),
        )

    return staff_uuid, True


def main() -> None:
    now = datetime.now(timezone.utc)
    created = 0
    skipped = 0
    errors: list[str] = []

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM organizations WHERE id = %s", (ORG,))
            if not cur.fetchone():
                raise SystemExit(f"Organization {ORG} not found.")

            for email, first, last, role, dept_code, subj_codes, status, phone_suffix in STAFF_ROWS:
                dept_id = ref_id(cur, "department", dept_code)
                if not dept_id:
                    errors.append(f"{email}: missing department ref {dept_code}")
                    continue
                subj_ids = []
                for sc in subj_codes:
                    sid = ref_id(cur, "subject", sc)
                    if sid:
                        subj_ids.append(sid)
                    else:
                        errors.append(f"{email}: missing subject ref {sc}")
                _, was_created = ensure_staff(
                    cur,
                    now,
                    email,
                    first,
                    last,
                    role,
                    dept_id,
                    subj_ids,
                    status,
                    f"+91 98765 {phone_suffix}",
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1

            conn.commit()

    print(
        json.dumps(
            {
                "organization_id": ORG,
                "staff_created": created,
                "staff_skipped_existing": skipped,
                "warnings": errors,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
