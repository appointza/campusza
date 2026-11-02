#!/usr/bin/env python3
"""Ensure 10 enrolled students per active class (appointza org). Safe to rerun."""
from __future__ import annotations

import hashlib
import json
import re
import uuid
from datetime import date, datetime, timezone

import psycopg2

ORG = "593e1eab-6cbb-4e7c-bf09-a13b778c3e2a"
SEED = "seed_students_per_class"
TARGET_PER_CLASS = 10
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

FIRST_NAMES = (
    "Aarav",
    "Diya",
    "Vihaan",
    "Anaya",
    "Ishaan",
    "Meera",
    "Arjun",
    "Saanvi",
    "Kabir",
    "Nisha",
    "Rohan",
    "Kavya",
    "Aditya",
    "Pooja",
    "Dev",
    "Lakshmi",
    "Harsh",
    "Sneha",
    "Yash",
    "Anika",
)
LAST_NAMES = ("Sharma", "Patel", "Iyer", "Reddy", "Kumar", "Nair", "Singh", "Das")


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def slug(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", s)[:24] or "CLS"


def enrollment_count(cur, class_id: str) -> int:
    cur.execute(
        """
        SELECT COUNT(*) FROM student_enrollments
        WHERE organization_id = %s AND class_id = %s AND is_current = true AND is_active = true
        """,
        (ORG, class_id),
    )
    return int(cur.fetchone()[0])


def max_roll(cur, class_id: str) -> int:
    cur.execute(
        """
        SELECT COALESCE(MAX(roll_number), 0) FROM student_enrollments
        WHERE organization_id = %s AND class_id = %s AND is_active = true
        """,
        (ORG, class_id),
    )
    return int(cur.fetchone()[0])


def add_student(
    cur,
    now,
    class_id: str,
    class_name: str,
    grade: str,
    section: str,
    academic_year: str,
    term_id: str,
    term_name: str,
    roll: int,
    class_slug: str,
    phone_seq: int,
) -> str:
    first = FIRST_NAMES[(roll - 1) % len(FIRST_NAMES)]
    last = LAST_NAMES[(roll + hash(class_id)) % len(LAST_NAMES)]
    admission = f"STU-{class_slug}-{roll:02d}"
    email = f"{admission.lower()}@campusza.local"
    phone = f"91{8000000000 + phone_seq:010d}"[-12:]
    if phone.startswith("91") and len(phone) > 12:
        phone = phone[-10:]
    phone = f"9{800000000 + phone_seq:09d}"[-10:]
    dob = date(2014 + (roll % 4), (roll % 12) + 1, min(28, roll + 5))

    cur.execute(
        "SELECT id FROM students WHERE organization_id = %s AND student_id = %s LIMIT 1",
        (ORG, admission),
    )
    row = cur.fetchone()
    if row:
        student_id = row[0]
    else:
        student_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO students (
                id, student_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                address_street, address_city, address_state, address_zip_code, address_country,
                parent_guardian_name, parent_guardian_relationship, parent_guardian_email, parent_guardian_phone,
                parent_guardian_occupation, class_id, class_name, grade, section, roll_number, admission_date,
                current_academic_year, current_semester_type, current_term_id, current_term_name,
                status, photo_url, blood_group, medical_conditions,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                organization_id, is_active, created_at, updated_at, created_by, updated_by, extended_profile
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, 'other',
                '', 'Chennai', 'Tamil Nadu', '600001', 'India',
                %s, 'mother', %s, %s, '',
                NULL, '', '', '', 0, %s,
                %s, 'annual', %s, %s,
                'active', '', 'O+', '',
                %s, 'mother', %s,
                %s, true, %s, %s, %s, %s, '{}'::json
            )
            """,
            (
                student_id,
                admission,
                first,
                last,
                f"{first} {last}",
                email,
                phone,
                dob,
                f"Parent {first}",
                f"parent.{admission.lower()}@campusza.local",
                phone,
                date.today(),
                academic_year,
                term_id,
                term_name,
                f"EC {first}",
                phone,
                ORG,
                now,
                now,
                SEED,
                SEED,
            ),
        )

    cur.execute(
        """
        SELECT id FROM student_enrollments
        WHERE organization_id = %s AND student_id = %s AND class_id = %s
          AND is_current = true AND is_active = true LIMIT 1
        """,
        (ORG, student_id, class_id),
    )
    if not cur.fetchone():
        cur.execute(
            """
            INSERT INTO student_enrollments (
                id, organization_id, student_id, academic_year, class_id, class_name,
                grade, section, roll_number, enrollment_status, joined_date, left_date,
                status, is_current, term_id, term_name, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, 'enrolled', %s, NULL,
                'current', true, %s, %s, true, %s, %s, %s, %s
            )
            """,
            (
                str(uuid.uuid4()),
                ORG,
                student_id,
                academic_year,
                class_id,
                class_name,
                grade,
                section,
                roll,
                date.today(),
                term_id,
                term_name,
                now,
                now,
                SEED,
                SEED,
            ),
        )

    cur.execute(
        """
        UPDATE students SET class_id = %s, class_name = %s, grade = %s, section = %s,
            roll_number = %s, current_academic_year = %s, current_term_id = %s, current_term_name = %s,
            phone = %s, date_of_birth = %s, updated_at = %s, updated_by = %s
        WHERE id = %s
        """,
        (
            class_id,
            class_name,
            grade,
            section,
            roll,
            academic_year,
            term_id,
            term_name,
            phone,
            dob,
            now,
            SEED,
            student_id,
        ),
    )

    return student_id


def refresh_class_counts(cur, now, class_id: str) -> None:
    cur.execute(
        """
        SELECT COUNT(*) FROM student_enrollments
        WHERE organization_id = %s AND class_id = %s AND is_current = true AND is_active = true
        """,
        (ORG, class_id),
    )
    total = cur.fetchone()[0]
    cur.execute(
        "UPDATE classes SET current_enrollment = %s, updated_at = %s WHERE id = %s",
        (total, now, class_id),
    )


def main() -> None:
    now = datetime.now(timezone.utc)
    phone_seq = 100000
    by_class: dict[str, int] = {}
    total_added = 0

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.id, c.name, c.grade, c.section, c.academic_year, c.term_id,
                       COALESCE(t.name, 'Term')
                FROM classes c
                LEFT JOIN terms t ON t.id = c.term_id
                WHERE c.organization_id = %s AND c.is_active = true
                ORDER BY c.name
                """,
                (ORG,),
            )
            classes = cur.fetchall()
            if not classes:
                raise SystemExit("No active classes for org.")

            for class_id, name, grade, section, academic_year, term_id, term_name in classes:
                academic_year = academic_year or "2026-2027"
                term_id = term_id or ""
                term_name = term_name or "Term"
                current = enrollment_count(cur, class_id)
                need = max(0, TARGET_PER_CLASS - current)
                if need == 0:
                    refresh_class_counts(cur, now, class_id)
                    continue

                class_slug = slug(name)[:16].upper()
                next_roll = max_roll(cur, class_id)
                added_here = 0
                for _ in range(need):
                    next_roll += 1
                    phone_seq += 1
                    add_student(
                        cur,
                        now,
                        class_id,
                        name,
                        grade or "",
                        section or "",
                        academic_year,
                        term_id,
                        term_name,
                        next_roll,
                        class_slug,
                        phone_seq,
                    )
                    added_here += 1
                    total_added += 1

                refresh_class_counts(cur, now, class_id)
                by_class[name] = added_here

            conn.commit()

    print(
        json.dumps(
            {
                "organization_id": ORG,
                "target_per_class": TARGET_PER_CLASS,
                "students_added": total_added,
                "added_by_class": by_class,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
