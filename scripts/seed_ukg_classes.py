"""Create 3 UKG classes (A/B/C), assign mentors, 10 students each."""
import json
import uuid
from datetime import date, datetime, timezone

import psycopg2

ORG = "dbd8d63e-78e1-4647-ac45-27bf7ff619a2"
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

GRADE = "UKG"
CLASS_DEFS = [
    ("A", "UKG-A"),
    ("B", "UKG-B"),
    ("C", "UKG-C"),
]
PER_CLASS = 10
STAFF_OFFSET = 3  # skip mentors used for 6-A/7-A/8-A

FIRST_NAMES = (
    "Aadhya", "Advik", "Myra", "Reyansh", "Kiara",
    "Vivaan", "Anvi", "Kabir", "Sara", "Dhruv",
)
LAST_NAMES = (
    "Krishnan", "Verma", "Pillai", "Chopra", "Bose",
    "Malhotra", "Joshi", "Kulkarni", "Saxena", "Banerjee",
)


def slug(class_name: str) -> str:
    return class_name.replace("-", "").lower()


def main():
    now = datetime.now(timezone.utc)
    today = date.today()
    summary = {"classes_created": [], "enrollment": {}}

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
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
            term_id = term_row[0] if term_row else None
            academic_year = term_row[1] if term_row else "2025-26"

            cur.execute(
                """
                SELECT id, TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) AS full_name
                FROM staff
                WHERE organization_id = %s AND is_active = true
                ORDER BY email NULLS LAST, created_at
                OFFSET %s LIMIT 3
                """,
                (ORG, STAFF_OFFSET),
            )
            mentors = cur.fetchall()
            if len(mentors) < 3:
                raise SystemExit(f"Need 3 staff (offset {STAFF_OFFSET}); found {len(mentors)}")

            cur.execute(
                "SELECT COALESCE(name, '') FROM terms WHERE id = %s",
                (term_id,),
            )
            term_name_row = cur.fetchone()
            term_name = term_name_row[0] if term_name_row else ""

            class_rows = []
            for section, name in CLASS_DEFS:
                cur.execute(
                    """
                    SELECT id FROM classes
                    WHERE organization_id = %s AND name = %s
                      AND COALESCE(academic_year, '') = %s
                    LIMIT 1
                    """,
                    (ORG, name, academic_year),
                )
                existing = cur.fetchone()
                if existing:
                    class_id = existing[0]
                else:
                    staff_id, staff_name = mentors[len(class_rows)]
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
                            %s, true, %s, %s, 'seed_ukg', 'seed_ukg'
                        )
                        """,
                        (
                            class_id,
                            name,
                            GRADE,
                            section,
                            academic_year,
                            term_id,
                            staff_id,
                            staff_name,
                            ORG,
                            now,
                            now,
                        ),
                    )
                    summary["classes_created"].append(
                        {"name": name, "id": class_id, "mentor": staff_name}
                    )
                class_rows.append((class_id, name, section))

            for class_id, class_name, section in class_rows:
                s = slug(class_name)
                new_students = 0
                for roll in range(1, PER_CLASS + 1):
                    email = f"student.ukg.{s}{roll:02d}@campusza.com"
                    admission_no = f"STU-UKG-{section}-{roll:02d}"

                    cur.execute(
                        "SELECT id FROM students WHERE organization_id = %s AND email = %s",
                        (ORG, email),
                    )
                    row = cur.fetchone()
                    if row:
                        student_id = row[0]
                        cur.execute(
                            """
                            SELECT 1 FROM student_enrollments
                            WHERE student_id = %s AND class_id = %s
                              AND is_current = true AND is_active = true
                            """,
                            (student_id, class_id),
                        )
                        if cur.fetchone():
                            continue
                    else:
                        student_id = str(uuid.uuid4())
                        gender = "male" if roll % 2 else "female"
                        first = FIRST_NAMES[roll - 1]
                        last = LAST_NAMES[roll - 1]
                        full_name = f"{first} {last}"
                        cur.execute(
                            """
                            INSERT INTO students (
                                id, student_id, first_name, last_name, full_name, email, phone,
                                date_of_birth, gender,
                                address_street, address_city, address_state, address_zip_code, address_country,
                                parent_guardian_name, parent_guardian_relationship,
                                parent_guardian_email, parent_guardian_phone, parent_guardian_occupation,
                                class_id, class_name, grade, section, roll_number, admission_date,
                                current_academic_year, current_semester_type, current_term_id, current_term_name,
                                status, photo_url, blood_group, medical_conditions,
                                emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                                organization_id, is_active, created_at, updated_at, created_by, updated_by,
                                extended_profile
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s,
                                %s, %s,
                                '', 'Chennai', 'Tamil Nadu', '600001', 'India',
                                %s, 'mother',
                                %s, %s, '',
                                NULL, '', '', '', 0, %s,
                                %s, 'annual', %s, %s,
                                'active', '', '', '',
                                %s, 'mother', %s,
                                %s, true, %s, %s, 'seed_ukg', 'seed_ukg',
                                '{}'::json
                            )
                            """,
                            (
                                student_id,
                                admission_no,
                                first,
                                last,
                                full_name,
                                email,
                                f"91{810000000 + roll + ord(section)}",
                                date(2019, 3, 10 + roll),
                                gender,
                                f"Parent of {first}",
                                f"parent.ukg.{s}{roll:02d}@campusza.com",
                                f"91{910000000 + roll}",
                                today,
                                academic_year,
                                term_id,
                                term_name,
                                f"Emergency {first}",
                                f"91{710000000 + roll}",
                                ORG,
                                now,
                                now,
                            ),
                        )
                        new_students += 1

                    enrollment_id = str(uuid.uuid4())
                    cur.execute(
                        """
                        INSERT INTO student_enrollments (
                            id, organization_id, student_id, academic_year, class_id, class_name,
                            grade, section, roll_number, enrollment_status, joined_date, left_date,
                            status, is_current, term_id, term_name, is_active,
                            created_at, updated_at, created_by, updated_by
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, 'enrolled', %s, NULL,
                            'current', true, %s, %s, true,
                            %s, %s, 'seed_ukg', 'seed_ukg'
                        )
                        """,
                        (
                            enrollment_id,
                            ORG,
                            student_id,
                            academic_year,
                            class_id,
                            class_name,
                            GRADE,
                            section,
                            roll,
                            today,
                            term_id,
                            term_name,
                            now,
                            now,
                        ),
                    )
                    cur.execute(
                        """
                        UPDATE students
                        SET class_id = %s, class_name = %s, grade = %s, section = %s,
                            roll_number = %s, current_academic_year = %s,
                            current_term_id = %s, current_term_name = %s,
                            updated_at = %s, updated_by = 'seed_ukg'
                        WHERE id = %s
                        """,
                        (
                            class_id,
                            class_name,
                            GRADE,
                            section,
                            roll,
                            academic_year,
                            term_id,
                            term_name,
                            now,
                            student_id,
                        ),
                    )

                cur.execute(
                    """
                    SELECT COUNT(*) FROM student_enrollments
                    WHERE organization_id = %s AND class_id = %s
                      AND is_current = true AND is_active = true
                    """,
                    (ORG, class_id),
                )
                total = cur.fetchone()[0]
                cur.execute(
                    """
                    UPDATE classes
                    SET current_enrollment = %s, updated_at = %s, updated_by = 'seed_ukg'
                    WHERE id = %s
                    """,
                    (total, now, class_id),
                )
                summary["enrollment"][class_name] = {
                    "class_id": class_id,
                    "enrolled_total": total,
                    "new_students_this_run": new_students,
                }

            conn.commit()

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
