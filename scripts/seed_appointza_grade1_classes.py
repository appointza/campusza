#!/usr/bin/env python3
"""Create Grade 1 sections A, B, C with class teachers and rooms (appointza org)."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

import psycopg2

ORG = "593e1eab-6cbb-4e7c-bf09-a13b778c3e2a"
ACADEMIC_YEAR_CODE = "2026-2027"
SEED = "seed_grade1_classes"
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

# section_code, staff_email, room_name (must be unique per academic year)
CLASS_ROWS = [
    ("A", "priya.rao@appointza.local", "Room 1"),
    ("B", "karthik.m@appointza.local", "Room 2"),
    ("C", "anita.desai@appointza.local", "Room 3"),
]


def ref_row(cur, category: str, code: str) -> tuple[str, str] | None:
    cur.execute(
        """
        SELECT id, name FROM reference_values
        WHERE organization_id = %s AND category = %s AND lower(code) = lower(%s) AND is_active = true
        LIMIT 1
        """,
        (ORG, category, code),
    )
    row = cur.fetchone()
    if not row:
        return None
    return str(row[0]), str(row[1])


def staff_by_email(cur, email: str) -> tuple[str, str] | None:
    cur.execute(
        """
        SELECT id, full_name FROM staff
        WHERE organization_id = %s AND lower(email) = lower(%s) AND is_active = true
        LIMIT 1
        """,
        (ORG, email),
    )
    row = cur.fetchone()
    if not row:
        return None
    return str(row[0]), str(row[1])


def room_by_name(cur, name: str) -> tuple[str, str] | None:
    cur.execute(
        """
        SELECT id, name FROM school_rooms
        WHERE organization_id = %s AND name = %s AND is_active = true
        LIMIT 1
        """,
        (ORG, name),
    )
    row = cur.fetchone()
    if not row:
        return None
    return str(row[0]), str(row[1])


def active_term(cur) -> tuple[str, str] | None:
    cur.execute(
        """
        SELECT id, name FROM terms
        WHERE organization_id = %s AND is_active = true AND academic_year = %s
        ORDER BY start_date ASC
        LIMIT 1
        """,
        (ORG, ACADEMIC_YEAR_CODE),
    )
    row = cur.fetchone()
    if not row:
        cur.execute(
            """
            SELECT id, name FROM terms
            WHERE organization_id = %s AND is_active = true
            ORDER BY start_date DESC
            LIMIT 1
            """,
            (ORG,),
        )
        row = cur.fetchone()
    if not row:
        return None
    return str(row[0]), str(row[1])


def subject_ids(cur) -> list[str]:
    ids: list[str] = []
    for code in ("MATHEMATICS", "ENGLISH", "SCIENCE", "TAMIL"):
        r = ref_row(cur, "subject", code)
        if r:
            ids.append(r[0])
    return ids


def ensure_class(
    cur,
    now,
    name: str,
    grade_id: str,
    section_id: str,
    year_id: str,
    term_id: str,
    room_id: str,
    room_name: str,
    teacher_id: str,
    teacher_name: str,
    subjects: list[str],
) -> tuple[str, bool]:
    cur.execute(
        """
        SELECT id FROM classes
        WHERE organization_id = %s AND name = %s AND COALESCE(academic_year, '') = %s AND is_active = true
        LIMIT 1
        """,
        (ORG, name, year_id),
    )
    row = cur.fetchone()
    if row:
        return str(row[0]), False

    # homeroom uniqueness: skip if room taken for this year
    cur.execute(
        """
        SELECT name FROM classes
        WHERE organization_id = %s AND is_active = true
          AND COALESCE(academic_year, '') = %s
          AND (school_room_id = %s OR room = %s)
        LIMIT 1
        """,
        (ORG, year_id, room_id, room_name),
    )
    taken = cur.fetchone()
    if taken:
        raise RuntimeError(f"{room_name} already homeroom for {taken[0]} in {ACADEMIC_YEAR_CODE}")

    class_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO classes (
            id, name, grade, section, academic_year, term_id, capacity, current_enrollment,
            room, school_room_id, class_teacher_id, class_teacher_name, assistant_mentor_id, assistant_mentor_name,
            subjects, schedule, status, organization_id, is_active, created_at, updated_at, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, 40, 0,
            %s, %s, %s, %s, '', '',
            %s::json, '[]'::json, 'active',
            %s, true, %s, %s, %s, %s
        )
        """,
        (
            class_id,
            name,
            grade_id,
            section_id,
            year_id,
            term_id,
            room_name,
            room_id,
            teacher_id,
            teacher_name,
            json.dumps(subjects),
            ORG,
            now,
            now,
            SEED,
            SEED,
        ),
    )
    return class_id, True


def main() -> None:
    now = datetime.now(timezone.utc)
    created: list[str] = []
    skipped: list[str] = []
    errors: list[str] = []

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            grade = ref_row(cur, "grade", "1")
            year = ref_row(cur, "academic_year", ACADEMIC_YEAR_CODE)
            term = active_term(cur)
            if not grade:
                raise SystemExit('Missing grade reference "1" — run seed_appointza_references.py')
            if not year:
                raise SystemExit(f'Missing academic year "{ACADEMIC_YEAR_CODE}"')
            if not term:
                raise SystemExit("No active term for org")

            grade_id, grade_name = grade
            year_id, _year_name = year
            term_id, _term_name = term
            subjects = subject_ids(cur)

            for section_code, email, room_name in CLASS_ROWS:
                section = ref_row(cur, "class_section", section_code)
                if not section:
                    errors.append(f"Missing section {section_code}")
                    continue
                section_id, section_name = section
                staff = staff_by_email(cur, email)
                if not staff:
                    errors.append(f"Missing staff {email}")
                    continue
                room = room_by_name(cur, room_name)
                if not room:
                    errors.append(f"Missing room {room_name}")
                    continue
                room_id, room_label = room
                teacher_id, teacher_name = staff

                # Match AdminClasses name: "{gradeName}-{sectionName}"
                class_name = f"{grade_name}-{section_name}"
                try:
                    _cid, was_new = ensure_class(
                        cur,
                        now,
                        class_name,
                        grade_id,
                        section_id,
                        year_id,
                        term_id,
                        room_id,
                        room_label,
                        teacher_id,
                        teacher_name,
                        subjects,
                    )
                    if was_new:
                        created.append(class_name)
                    else:
                        skipped.append(class_name)
                except RuntimeError as e:
                    errors.append(str(e))

            conn.commit()

    print(
        json.dumps(
            {
                "organization_id": ORG,
                "classes_created": created,
                "classes_skipped": skipped,
                "errors": errors,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
