"""One-off: fetch 3 staff and insert 3 classes with class mentors."""
import json
import uuid
from datetime import datetime, timezone

import psycopg2

ORG = "dbd8d63e-78e1-4647-ac45-27bf7ff619a2"
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

CLASS_DEFS = [
    ("Grade 6", "A", "6-A"),
    ("Grade 7", "A", "7-A"),
    ("Grade 8", "A", "8-A"),
]


def main():
    now = datetime.now(timezone.utc)
    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, COALESCE(first_name,'') || ' ' || COALESCE(last_name,'') AS full_name
                FROM staff
                WHERE organization_id = %s AND is_active = true
                ORDER BY email NULLS LAST, created_at
                LIMIT 3
                """,
                (ORG,),
            )
            mentors = cur.fetchall()
            if len(mentors) < 3:
                raise SystemExit(f"Need 3 active staff; found {len(mentors)}")

            cur.execute(
                """
                SELECT id, academic_year
                FROM terms
                WHERE organization_id = %s AND is_active = true AND status = 'active'
                ORDER BY start_date
                LIMIT 1
                """,
                (ORG,),
            )
            term_row = cur.fetchone()
            term_id = term_row[0] if term_row else ""
            academic_year = term_row[1] if term_row else "2025-26"

            created = []
            for (grade, section, name), (staff_id, staff_name) in zip(CLASS_DEFS, mentors):
                cur.execute(
                    """
                    SELECT id FROM classes
                    WHERE organization_id = %s AND name = %s
                      AND COALESCE(academic_year, '') = %s
                    LIMIT 1
                    """,
                    (ORG, name, academic_year),
                )
                if cur.fetchone():
                    print(f"Skip existing class: {name}")
                    continue

                class_id = str(uuid.uuid4())
                cur.execute(
                    """
                    INSERT INTO classes (
                        id, name, grade, section, academic_year, term_id, capacity, current_enrollment,
                        room, class_teacher_id, class_teacher_name, assistant_mentor_id, assistant_mentor_name,
                        subjects, schedule, status,
                        organization_id, is_active, created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, 40, 0,
                        '', %s, %s, '', '',
                        '[]'::json, '[]'::json, 'active',
                        %s, true, %s, %s, 'seed_script', 'seed_script'
                    )
                    """,
                    (
                        class_id,
                        name,
                        grade,
                        section,
                        academic_year,
                        term_id,
                        staff_id,
                        staff_name.strip(),
                        ORG,
                        now,
                        now,
                    ),
                )
                created.append(
                    {
                        "id": class_id,
                        "name": name,
                        "mentor_id": staff_id,
                        "mentor_name": staff_name.strip(),
                    }
                )

            conn.commit()
    print(json.dumps({"created": created, "mentors_used": len(mentors)}, indent=2))


if __name__ == "__main__":
    main()
