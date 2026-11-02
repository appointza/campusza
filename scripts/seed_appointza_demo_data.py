#!/usr/bin/env python3
"""
Seed demo data for all major Campusza screens (org: appointza).

Default org matches production demo tenant:
  organization_id: 593e1eab-6cbb-4e7c-bf09-a13b778c3e2a

Usage:
  pip install psycopg2-binary
  python scripts/seed_appointza_demo_data.py

Demo logins (after seed):
  Staff:  demo.teacher@appointza.local / Demo@12345
  Student: mobile 9000000001, DOB 2016-05-10 (password = DOB on sign-in tab)
"""
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import date, datetime, timedelta, timezone

import psycopg2
import psycopg2.extras

ORG = "593e1eab-6cbb-4e7c-bf09-a13b778c3e2a"
SEED = "seed_appointza_demo"
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

ACADEMIC_YEAR = "2026-2027"
TERM_NAME = "Term 1 (2026-27)"
DEMO_STAFF_EMAIL = "demo.teacher@appointza.local"
DEMO_STAFF_PASSWORD = "Demo@12345"
DEMO_STUDENT_MOBILE = "9000000001"
DEMO_STUDENT_DOB = date(2016, 5, 10)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ensure_ref(cur, now, category: str, code: str, name: str, order: int = 1) -> str:
    cur.execute(
        """
        SELECT id FROM reference_values
        WHERE organization_id = %s AND category = %s AND lower(code) = lower(%s)
          AND is_active = true
        LIMIT 1
        """,
        (ORG, category, code),
    )
    row = cur.fetchone()
    if row:
        return str(row[0])

    cur.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM reference_values")
    rid = str(cur.fetchone()[0])
    cur.execute(
        """
        INSERT INTO reference_values (
            id, category, code, name, short_name, description, value, display_order, parent_id,
            metadata, is_system, is_default, status, organization_id, isfactory, is_active,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, '', '', '', %s, NULL,
            NULL, false, false, 'active', %s, false, true,
            %s, %s, %s, %s
        )
        """,
        (rid, category, code, name, order, ORG, now, now, SEED, SEED),
    )
    return rid


def ensure_term(cur, now) -> tuple[str, str]:
    cur.execute(
        """
        SELECT id, name, academic_year FROM terms
        WHERE organization_id = %s AND is_active = true AND status = 'active'
        ORDER BY start_date DESC LIMIT 1
        """,
        (ORG,),
    )
    row = cur.fetchone()
    if row:
        return row[0], row[2] or ACADEMIC_YEAR

    term_id = str(uuid.uuid4())
    start = date(2026, 4, 1)
    end = date(2027, 3, 31)
    cur.execute(
        """
        INSERT INTO terms (
            id, name, start_date, end_date, status, academic_year, description,
            organization_id, is_active, created_at, updated_at, created_by, updated_by
        ) VALUES (%s, %s, %s, %s, 'active', %s, %s, %s, true, %s, %s, %s, %s)
        """,
        (
            term_id,
            TERM_NAME,
            start,
            end,
            ACADEMIC_YEAR,
            "Demo term for appointza screens",
            ORG,
            now,
            now,
            SEED,
            SEED,
        ),
    )
    return term_id, ACADEMIC_YEAR


def ensure_staff_user(cur, now, email: str, first: str, last: str, role: str, password: str | None) -> str:
    cur.execute(
        "SELECT id, staff_id FROM staff WHERE organization_id = %s AND lower(email) = lower(%s) LIMIT 1",
        (ORG, email),
    )
    row = cur.fetchone()
    if row:
        staff_uuid, staff_code = row[0], row[1]
    else:
        staff_uuid = str(uuid.uuid4())
        staff_code = f"STF-DEMO-{staff_uuid[:8].upper()}"
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
                'Teaching', %s, '["Mathematics","English"]'::json,
                '', 3, %s, 'active', '',
                'Emergency Contact', 'spouse', '9000000099',
                0, 'INR', 'monthly',
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
                "9000000100",
                date(1990, 1, 15),
                role,
                date.today(),
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
    urow = cur.fetchone()
    if not urow:
        user_id = str(uuid.uuid4())
        pwd_hash = sha256_hex(password) if password else sha256_hex(str(uuid.uuid4()))
        setup_required = password is None
        cur.execute(
            """
            INSERT INTO users (
                id, email, username, password_hash, role, status, organization_id, profile_id,
                last_login_at, last_login_ip, email_verified, email_verified_at, two_factor_enabled,
                password_setup_required, is_active, created_at, updated_at, created_by
            ) VALUES (
                %s, %s, %s, %s, 'staff', 'active', %s, %s,
                NULL, '', true, %s, false,
                %s, true, %s, %s, %s
            )
            """,
            (
                user_id,
                email,
                first.lower(),
                pwd_hash,
                ORG,
                staff_code,
                now,
                setup_required,
                now,
                now,
                SEED,
            ),
        )
    elif password:
        cur.execute(
            """
            UPDATE users SET password_hash = %s, password_setup_required = false, updated_at = %s
            WHERE id = %s
            """,
            (sha256_hex(password), now, urow[0]),
        )

    return staff_uuid


def ensure_class(cur, now, term_id, academic_year, name, grade, section, teacher_id, teacher_name) -> str:
    cur.execute(
        """
        SELECT id FROM classes
        WHERE organization_id = %s AND name = %s AND COALESCE(academic_year,'') = %s LIMIT 1
        """,
        (ORG, name, academic_year),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    class_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO classes (
            id, name, grade, section, academic_year, term_id, capacity, current_enrollment,
            room, class_teacher_id, class_teacher_name, assistant_mentor_id, assistant_mentor_name,
            subjects, schedule, status, organization_id, is_active, created_at, updated_at, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, %s, %s, 40, 0,
            '', %s, %s, '', '',
            '["Mathematics","English","Science"]'::json, '[]'::json, 'active',
            %s, true, %s, %s, %s, %s
        )
        """,
        (
            class_id,
            name,
            grade,
            section,
            academic_year,
            term_id,
            teacher_id,
            teacher_name,
            ORG,
            now,
            now,
            SEED,
            SEED,
        ),
    )
    return class_id


def ensure_student_in_class(
    cur,
    now,
    term_id,
    term_name,
    academic_year,
    class_id,
    class_name,
    grade,
    section,
    roll: int,
    first: str,
    last: str,
    phone: str,
    dob: date,
    create_user: bool,
) -> str:
    admission = f"DEMO-{grade.replace(' ', '')}-{section}-{roll:02d}"
    email = f"demo.student.{grade.replace(' ', '').lower()}.{section.lower()}.{roll:02d}@campusza.local"

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

    if create_user:
        mobile = phone[-10:] if len(phone) >= 10 else phone
        dob_pwd = dob.isoformat()
        cur.execute(
            """
            SELECT id FROM users WHERE organization_id = %s AND mobile = %s AND role = 'student' LIMIT 1
            """,
            (ORG, mobile),
        )
        if not cur.fetchone():
            cur.execute(
                """
                INSERT INTO users (
                    id, email, username, password_hash, role, status, organization_id, profile_id,
                    mobile, email_verified, password_setup_required, is_active, created_at, updated_at, created_by
                ) VALUES (
                    %s, %s, %s, %s, 'student', 'active', %s, %s,
                    %s, true, false, true, %s, %s, %s
                )
                """,
                (
                    str(uuid.uuid4()),
                    email,
                    first.lower(),
                    sha256_hex(dob_pwd),
                    ORG,
                    student_id,
                    mobile,
                    now,
                    now,
                    SEED,
                ),
            )

    return student_id


def ensure_calendar(cur, now, term_id: str) -> None:
    cur.execute(
        """
        SELECT id FROM school_calendar_weekly_rules
        WHERE organization_id = %s AND term_id = %s AND weekday = 0 AND is_active = true LIMIT 1
        """,
        (ORG, term_id),
    )
    if not cur.fetchone():
        cur.execute(
            """
            INSERT INTO school_calendar_weekly_rules (
                id, organization_id, term_id, weekday, day_type, reason, is_active, created_at, updated_at
            ) VALUES (%s, %s, %s, 0, 'closed', 'Weekly holiday', true, %s, %s)
            """,
            (str(uuid.uuid4()), ORG, term_id, now, now),
        )

    holiday = date.today() + timedelta(days=14)
    cur.execute(
        """
        SELECT id FROM school_calendar_day_overrides
        WHERE organization_id = %s AND term_id = %s AND calendar_date = %s AND is_active = true LIMIT 1
        """,
        (ORG, term_id, holiday),
    )
    if not cur.fetchone():
        cur.execute(
            """
            INSERT INTO school_calendar_day_overrides (
                id, organization_id, term_id, calendar_date, day_type, reason, is_active, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, 'closed', 'Demo school holiday', true, %s, %s)
            """,
            (str(uuid.uuid4()), ORG, term_id, holiday, now, now),
        )


def ensure_notices(cur, now) -> None:
    cur.execute(
        """
        SELECT 1 FROM information_schema.tables WHERE table_name = 'school_notices'
        """
    )
    if not cur.fetchone():
        return
    cur.execute(
        "SELECT id FROM school_notices WHERE organization_id = %s AND title = %s LIMIT 1",
        (ORG, "Welcome to Campusza demo"),
    )
    if cur.fetchone():
        return
    cur.execute(
        """
        INSERT INTO school_notices (
            id, organization_id, title, body, audience, publish_from, publish_to,
            is_active, created_at, updated_at, created_by, updated_by
        ) VALUES (%s, %s, %s, %s, 'all', NULL, NULL, true, %s, %s, %s, %s)
        """,
        (
            str(uuid.uuid4()),
            ORG,
            "Welcome to Campusza demo",
            "Sports day next month. Staff: submit attendance by 3 PM. Students: check homework tab daily.",
            now,
            now,
            SEED,
            SEED,
        ),
    )


def ensure_homework(cur, now, staff_id, staff_name, class_id, class_name) -> None:
    today = date.today()
    cur.execute(
        """
        SELECT id FROM homework_assignments
        WHERE organization_id = %s AND class_id = %s AND assigned_date = %s AND title = %s LIMIT 1
        """,
        (ORG, class_id, today, "Demo: Chapter 3 exercises"),
    )
    if cur.fetchone():
        return
    cur.execute(
        """
        INSERT INTO homework_assignments (
            id, organization_id, staff_id, staff_name, class_id, class_name, subject,
            title, description, assigned_date, due_date, status, is_active, created_at, updated_at, created_by
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'assigned', true, %s, %s, %s)
        """,
        (
            str(uuid.uuid4()),
            ORG,
            staff_id,
            staff_name,
            class_id,
            class_name,
            "Mathematics",
            "Demo: Chapter 3 exercises",
            "Complete questions 1–10 from textbook.",
            today,
            today + timedelta(days=3),
            now,
            now,
            SEED,
        ),
    )


def ensure_schedule(cur, staff_id, staff_name, class_id, class_name) -> None:
    for day in ("monday", "tuesday", "wednesday", "thursday", "friday"):
        cur.execute(
            """
            SELECT id FROM staff_schedules
            WHERE organization_id = %s AND staff_id = %s AND day = %s AND class_id = %s AND is_active = true LIMIT 1
            """,
            (ORG, staff_id, day, class_id),
        )
        if cur.fetchone():
            continue
        cur.execute(
            """
            INSERT INTO staff_schedules (
                id, staff_id, staff_name, day, start_time, end_time, subject, subject_id,
                class_id, class_name, room, is_replacement, original_teacher_id, original_teacher_name,
                replacement_teacher_id, replacement_teacher_name, organization_id, is_active
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, NULL,
                %s, %s, '', false, '', '', '', '', %s, true
            )
            """,
            (
                str(uuid.uuid4()),
                staff_id,
                staff_name,
                day,
                "09:00:00",
                "09:45:00",
                "Mathematics",
                class_id,
                class_name,
                ORG,
            ),
        )


def ensure_attendance_status_ref(cur, now) -> str:
    cur.execute(
        """
        SELECT id FROM reference_values
        WHERE organization_id = %s AND category = 'attendance_status' AND lower(code) = 'present'
        LIMIT 1
        """,
        (ORG,),
    )
    row = cur.fetchone()
    if row:
        return str(row[0])
    return ensure_ref(cur, now, "attendance_status", "present", "Present")


def ensure_attendance(cur, now, class_id, class_name, student_id, student_name, staff_id, staff_name) -> None:
    today = date.today()
    status_ref = ensure_attendance_status_ref(cur, now)
    cur.execute(
        """
        SELECT id FROM attendance
        WHERE organization_id = %s AND class_id = %s AND student_id = %s AND date = %s LIMIT 1
        """,
        (ORG, class_id, student_id, today),
    )
    if cur.fetchone():
        return
    cur.execute(
        """
        INSERT INTO attendance (
            id, type, date, class_id, class_name, student_id, student_name, staff_id, staff_name,
            status, check_in_time, check_out_time, remarks, marked_by, marked_at,
            organization_id, isactive, created_at, updated_at
        ) VALUES (
            %s, 'student', %s, %s, %s, %s, %s, NULL, '',
            %s, NULL, NULL, 'Demo seed', %s, %s,
            %s, true, %s, %s
        )
        """,
        (
            str(uuid.uuid4()),
            today,
            class_id,
            class_name,
            student_id,
            student_name,
            status_ref,
            SEED,
            now,
            ORG,
            now,
            now,
        ),
    )


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
    summary: dict = {"organization_id": ORG, "seed": SEED}

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM organizations WHERE id = %s", (ORG,))
            org = cur.fetchone()
            if not org:
                raise SystemExit(f"Organization {ORG} not found in database.")

            summary["organization_name"] = org[1]

            for cat, code, name in [
                ("academic_year", ACADEMIC_YEAR, ACADEMIC_YEAR),
                ("grade", "5", "Grade 5"),
                ("grade", "6", "Grade 6"),
                ("class_section", "A", "Section A"),
                ("subject", "mathematics", "Mathematics"),
                ("subject", "english", "English"),
                ("subject", "science", "Science"),
                ("department", "teaching", "Teaching"),
                ("staff_role", "teacher", "Teacher"),
            ]:
                ensure_ref(cur, now, cat, code, name)

            term_id, academic_year = ensure_term(cur, now)
            summary["term_id"] = term_id
            summary["academic_year"] = academic_year

            teacher_uuid = ensure_staff_user(
                cur, now, DEMO_STAFF_EMAIL, "Demo", "Teacher", "teacher", DEMO_STAFF_PASSWORD
            )
            ensure_staff_user(cur, now, "assistant.demo@appointza.local", "Demo", "Assistant", "teacher", None)

            cur.execute(
                "SELECT full_name FROM staff WHERE id = %s",
                (teacher_uuid,),
            )
            teacher_name = (cur.fetchone() or ["Demo Teacher"])[0]

            class5 = ensure_class(
                cur, now, term_id, academic_year, "Demo 5-A", "Grade 5", "A", teacher_uuid, teacher_name
            )
            class6 = ensure_class(
                cur, now, term_id, academic_year, "Demo 6-A", "Grade 6", "A", teacher_uuid, teacher_name
            )

            first_names = ("Aarav", "Diya", "Vihaan", "Anaya", "Ishaan", "Meera", "Arjun", "Saanvi")
            demo_student_id = None
            for i, class_id, cname, grade in [
                (0, class5, "Demo 5-A", "Grade 5"),
                (1, class6, "Demo 6-A", "Grade 6"),
            ]:
                for roll in range(1, 5):
                    fn = first_names[(roll - 1 + i * 4) % len(first_names)]
                    ln = "Sharma"
                    phone = f"9000000{100 + roll + i * 10:03d}"
                    dob = date(2016, 5, 10) if roll == 1 and i == 0 else date(2015 + i, 6, roll)
                    sid = ensure_student_in_class(
                        cur,
                        now,
                        term_id,
                        TERM_NAME,
                        academic_year,
                        class_id,
                        cname,
                        grade,
                        "A",
                        roll,
                        fn,
                        ln,
                        DEMO_STUDENT_MOBILE if roll == 1 and i == 0 else phone,
                        DEMO_STUDENT_DOB if roll == 1 and i == 0 else dob,
                        create_user=(roll == 1 and i == 0),
                    )
                    if roll == 1 and i == 0:
                        demo_student_id = sid

            refresh_class_counts(cur, now, class5)
            refresh_class_counts(cur, now, class6)

            ensure_calendar(cur, now, term_id)
            ensure_notices(cur, now)
            ensure_homework(cur, now, teacher_uuid, teacher_name, class5, "Demo 5-A")
            ensure_schedule(cur, teacher_uuid, teacher_name, class5, "Demo 5-A")

            if demo_student_id:
                try:
                    cur.execute(
                        "SELECT full_name FROM students WHERE id = %s",
                        (demo_student_id,),
                    )
                    sname = (cur.fetchone() or ["Demo Student"])[0]
                    ensure_attendance(cur, now, class5, "Demo 5-A", demo_student_id, sname, teacher_uuid, teacher_name)
                except Exception as exc:
                    summary["attendance_skipped"] = str(exc)

            conn.commit()

    summary["demo_logins"] = {
        "staff_email": DEMO_STAFF_EMAIL,
        "staff_password": DEMO_STAFF_PASSWORD,
        "student_mobile": DEMO_STUDENT_MOBILE,
        "student_dob_password": DEMO_STUDENT_DOB.isoformat(),
    }
    summary["classes"] = ["Demo 5-A", "Demo 6-A"]
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
