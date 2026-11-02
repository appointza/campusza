"""Ensure 10 enrolled students per demo class (6-A, 7-A, 8-A)."""
import json
import uuid
from datetime import date, datetime, timezone

import psycopg2

ORG = "dbd8d63e-78e1-4647-ac45-27bf7ff619a2"
CLASS_NAMES = ("6-A", "7-A", "8-A")
PER_CLASS = 10
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

FIRST_NAMES = (
    "Aarav", "Diya", "Vihaan", "Ananya", "Arjun",
    "Isha", "Rohan", "Meera", "Karan", "Sneha",
)
LAST_NAMES = (
    "Patel", "Sharma", "Reddy", "Nair", "Gupta",
    "Iyer", "Singh", "Das", "Rao", "Menon",
)


def class_slug(class_name: str) -> str:
    return class_name.replace("-", "").lower()


def main():
    now = datetime.now(timezone.utc)
    today = date.today()
    dob = date(2012, 5, 15)
    summary = {"classes": {}}

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.id, c.name, c.grade, c.section, c.academic_year, c.term_id,
                       COALESCE(t.name, '') AS term_name
                FROM classes c
                LEFT JOIN terms t ON t.id = c.term_id
                WHERE c.organization_id = %s
                  AND c.is_active = true
                  AND c.name = ANY(%s)
                ORDER BY c.name
                """,
                (ORG, list(CLASS_NAMES)),
            )
            classes = cur.fetchall()
            if len(classes) != len(CLASS_NAMES):
                raise SystemExit(f"Expected {len(CLASS_NAMES)} classes; found {len(classes)}")

            for class_id, class_name, grade, section, academic_year, term_id, term_name in classes:
                cur.execute(
                    """
                    SELECT COUNT(*) FROM student_enrollments
                    WHERE organization_id = %s AND class_id = %s
                      AND is_current = true AND is_active = true
                    """,
                    (ORG, class_id),
                )
                existing = cur.fetchone()[0]
                slug = class_slug(class_name)
                created = []

                for roll in range(1, PER_CLASS + 1):
                    email = f"student.demo.{slug}{roll:02d}@campusza.com"
                    admission_no = f"STU-DEMO-{slug.upper()}-{roll:02d}"

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
                                %s, 'father',
                                %s, %s, '',
                                NULL, '', '', '', 0, %s,
                                %s, 'annual', %s, %s,
                                'active', '', '', '',
                                %s, 'father', %s,
                                %s, true, %s, %s, 'seed_script', 'seed_script',
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
                                f"91{800000000 + roll + hash(slug) % 1000}",
                                dob.replace(year=2018 - int(class_name[0])),
                                gender,
                                f"Parent of {first}",
                                f"parent.{slug}{roll:02d}@campusza.com",
                                f"91{900000000 + roll}",
                                today,
                                academic_year,
                                term_id or None,
                                term_name,
                                f"Emergency {first}",
                                f"91{700000000 + roll}",
                                ORG,
                                now,
                                now,
                            ),
                        )

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
                            %s, %s, 'seed_script', 'seed_script'
                        )
                        """,
                        (
                            enrollment_id,
                            ORG,
                            student_id,
                            academic_year,
                            class_id,
                            class_name,
                            grade,
                            section,
                            roll,
                            today,
                            term_id or None,
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
                            updated_at = %s, updated_by = 'seed_script'
                        WHERE id = %s
                        """,
                        (
                            class_id,
                            class_name,
                            grade,
                            section,
                            roll,
                            academic_year,
                            term_id or None,
                            term_name,
                            now,
                            student_id,
                        ),
                    )
                    created.append({"roll": roll, "email": email, "admission_no": admission_no})

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
                    SET current_enrollment = %s, updated_at = %s, updated_by = 'seed_script'
                    WHERE id = %s
                    """,
                    (total, now, class_id),
                )
                summary["classes"][class_name] = {
                    "class_id": class_id,
                    "enrolled_total": total,
                    "new_this_run": len(created),
                }

            conn.commit()

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
