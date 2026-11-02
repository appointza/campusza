#!/usr/bin/env python3
"""
Insert dummy reference_values (+ school rooms) for Settings → References (appointza org).

  python scripts/seed_appointza_references.py
"""
from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timezone

import psycopg2

ORG = "593e1eab-6cbb-4e7c-bf09-a13b778c3e2a"
SEED = "seed_appointza_references"
CONN = {
    "host": "43.205.255.163",
    "port": 5432,
    "dbname": "campusza",
    "user": "postgres",
    "password": "abc123",
}

# (category, code, name, display_order, is_default)
REFERENCE_ROWS: list[tuple[str, str, str, int, bool]] = [
    # Academic structure
    ("academic_year", "2025-2026", "2025-2026", 1, False),
    ("academic_year", "2026-2027", "2026-2027", 2, True),
    ("academic_year", "2027-2028", "2027-2028", 3, False),
    ("grade", "UKG", "UKG", 1, False),
    ("grade", "LKG", "LKG", 2, False),
    ("grade", "1", "Grade 1", 3, False),
    ("grade", "2", "Grade 2", 4, False),
    ("grade", "3", "Grade 3", 5, False),
    ("grade", "4", "Grade 4", 6, False),
    ("grade", "5", "Grade 5", 7, False),
    ("grade", "6", "Grade 6", 8, False),
    ("grade", "7", "Grade 7", 9, False),
    ("grade", "8", "Grade 8", 10, False),
    ("grade", "9", "Grade 9", 11, False),
    ("grade", "10", "Grade 10", 12, False),
    ("grade", "11", "Grade 11", 13, False),
    ("grade", "12", "Grade 12", 14, False),
    ("class_section", "A", "Section A", 1, True),
    ("class_section", "B", "Section B", 2, False),
    ("class_section", "C", "Section C", 3, False),
    ("semester_type", "SEMESTER_1", "Semester 1", 1, False),
    ("semester_type", "SEMESTER_2", "Semester 2", 2, False),
    ("semester_type", "ANNUAL", "Annual", 3, True),
    ("semester_type", "QUARTERLY", "Quarterly", 4, False),
    ("semester_type", "TERM_BASED", "Term Based", 5, False),
    # Subjects & departments
    ("subject", "MATHEMATICS", "Mathematics", 1, False),
    ("subject", "ENGLISH", "English", 2, False),
    ("subject", "SCIENCE", "Science", 3, False),
    ("subject", "SOCIAL", "Social Studies", 4, False),
    ("subject", "TAMIL", "Tamil", 5, False),
    ("subject", "HINDI", "Hindi", 6, False),
    ("subject", "COMPUTER", "Computer Science", 7, False),
    ("subject", "PE", "Physical Education", 8, False),
    ("subject_type", "CORE", "Core", 1, True),
    ("subject_type", "ELECTIVE", "Elective", 2, False),
    ("subject_type", "LANGUAGE", "Language", 3, False),
    ("department", "SCI", "Science", 1, False),
    ("department", "MATH", "Mathematics", 2, False),
    ("department", "ENG", "English", 3, False),
    ("department", "SOC", "Social Studies", 4, False),
    ("department", "COMP", "Computer Science", 5, False),
    ("department", "ART", "Arts", 6, False),
    ("department", "PE", "Physical Education", 7, False),
    ("department", "ADMIN", "Administration", 8, False),
    # People lookups
    ("gender", "MALE", "Male", 1, False),
    ("gender", "FEMALE", "Female", 2, False),
    ("gender", "OTHER", "Other", 3, False),
    ("blood_group", "A_POS", "A+", 1, False),
    ("blood_group", "A_NEG", "A-", 2, False),
    ("blood_group", "B_POS", "B+", 3, False),
    ("blood_group", "B_NEG", "B-", 4, False),
    ("blood_group", "AB_POS", "AB+", 5, False),
    ("blood_group", "AB_NEG", "AB-", 6, False),
    ("blood_group", "O_POS", "O+", 7, False),
    ("blood_group", "O_NEG", "O-", 8, False),
    ("relationship", "FATHER", "Father", 1, False),
    ("relationship", "MOTHER", "Mother", 2, False),
    ("relationship", "GUARDIAN", "Guardian", 3, False),
    ("relationship", "SIBLING", "Sibling", 4, False),
    ("relationship", "OTHER", "Other", 5, False),
    # Staff
    ("staff_role", "TEACHER", "Teacher", 1, True),
    ("staff_role", "PRINCIPAL", "Principal", 2, False),
    ("staff_role", "VICE_PRINCIPAL", "Vice Principal", 3, False),
    ("staff_role", "ADMIN_STAFF", "Admin Staff", 4, False),
    ("staff_role", "LIBRARIAN", "Librarian", 5, False),
    ("staff_status", "ACTIVE", "Active", 1, True),
    ("staff_status", "ON_LEAVE", "On Leave", 2, False),
    ("staff_status", "INACTIVE", "Inactive", 3, False),
    ("staff_status", "SUSPENDED", "Suspended", 4, False),
    ("leave_type", "CASUAL", "Casual Leave", 1, False),
    ("leave_type", "SICK", "Sick Leave", 2, False),
    ("leave_type", "EARNED", "Earned Leave", 3, False),
    ("leave_type", "MATERNITY", "Maternity Leave", 4, False),
    # Students & attendance
    ("student_status", "ACTIVE", "Active", 1, True),
    ("student_status", "INACTIVE", "Inactive", 2, False),
    ("student_status", "GRADUATED", "Graduated", 3, False),
    ("student_status", "TRANSFERRED", "Transferred", 4, False),
    ("student_status", "SUSPENDED", "Suspended", 5, False),
    ("attendance_status", "PRESENT", "Present", 1, True),
    ("attendance_status", "ABSENT", "Absent", 2, False),
    ("attendance_status", "LATE", "Late", 3, False),
    ("attendance_status", "EXCUSED", "Excused", 4, False),
    # Fees & payments
    ("payment_mode", "CASH", "Cash", 1, False),
    ("payment_mode", "CARD", "Card", 2, False),
    ("payment_mode", "BANK_TRANSFER", "Bank Transfer", 3, False),
    ("payment_mode", "ONLINE", "Online Payment", 4, False),
    ("payment_mode", "CHEQUE", "Cheque", 5, False),
    ("fee_type", "TUITION", "Tuition Fee", 1, False),
    ("fee_type", "TRANSPORT", "Transport Fee", 2, False),
    ("fee_type", "LAB", "Lab Fee", 3, False),
    ("fee_type", "EXAM", "Exam Fee", 4, False),
    ("fee_status", "PAID", "Paid", 1, False),
    ("fee_status", "PARTIAL", "Partially Paid", 2, False),
    ("fee_status", "DUE", "Due", 3, True),
    ("fee_status", "OVERDUE", "Overdue", 4, False),
    # Documents & certificates
    ("document_type", "MARKSHEET", "Marksheet", 1, False),
    ("document_type", "REPORT_CARD", "Report Card", 2, False),
    ("document_type", "TRANSFER_CERTIFICATE", "Transfer Certificate", 3, False),
    ("document_type", "BONAFIDE", "Bonafide Certificate", 4, False),
    ("document_type", "ID_CARD", "ID Card", 5, False),
    ("certificate_type", "COMPLETION", "Course Completion", 1, False),
    ("certificate_type", "MERIT", "Merit Certificate", 2, False),
    ("certificate_status", "ISSUED", "Issued", 1, False),
    ("certificate_status", "PENDING", "Pending", 2, True),
    # Assessment / grades
    ("assessment", "UNIT_TEST", "Unit Test", 1, False),
    ("assessment", "MID_TERM", "Mid Term", 2, False),
    ("assessment", "FINAL", "Final Exam", 3, False),
    ("assessment_type", "WRITTEN", "Written", 1, False),
    ("assessment_type", "ORAL", "Oral", 2, False),
    ("assessment_type", "PRACTICAL", "Practical", 3, False),
    ("assessment_component", "THEORY", "Theory", 1, False),
    ("assessment_component", "INTERNAL", "Internal Assessment", 2, False),
    ("assessment_status", "DRAFT", "Draft", 1, True),
    ("assessment_status", "PUBLISHED", "Published", 2, False),
    ("grade_status", "PASS", "Pass", 1, False),
    ("grade_status", "FAIL", "Fail", 2, False),
    ("grade_status", "SUPPLEMENTARY", "Supplementary", 3, False),
    # Reports
    ("report_type", "ATTENDANCE", "Attendance Report", 1, False),
    ("report_type", "FEE", "Fee Report", 2, False),
    ("report_type", "EXAM", "Exam Report", 3, False),
    ("report_format", "PDF", "PDF", 1, True),
    ("report_format", "EXCEL", "Excel", 2, False),
    ("report_format", "CSV", "CSV", 3, False),
    # Location
    ("country", "IN", "India", 1, True),
    ("state", "TN", "Tamil Nadu", 1, False),
    ("state", "KA", "Karnataka", 2, False),
    ("city", "CHENNAI", "Chennai", 1, False),
    ("city", "COIMBATORE", "Coimbatore", 2, False),
    ("city", "MADURAI", "Madurai", 3, False),
    # Timetable periods
    ("period", "P1", "8:00 AM", 1, False),
    ("period", "P2", "9:00 AM", 2, False),
    ("period", "P3", "10:00 AM", 3, False),
    ("period", "P4", "11:00 AM", 4, False),
    ("period", "P5", "12:00 PM", 5, False),
    ("period", "P6", "1:00 PM", 6, False),
    ("period", "P7", "2:00 PM", 7, False),
    ("period", "P8", "3:00 PM", 8, False),
    ("period", "P9", "4:00 PM", 9, False),
    # Misc org (optional lists in settings)
    ("user_role", "ADMIN", "Admin", 1, False),
    ("user_role", "STAFF", "Staff", 2, False),
    ("user_role", "STUDENT", "Student", 3, False),
    ("user_status", "ACTIVE", "Active", 1, True),
    ("user_status", "INACTIVE", "Inactive", 2, False),
    ("organization_type", "SCHOOL", "School", 1, True),
    ("organization_type", "COLLEGE", "College", 2, False),
    ("subscription_plan", "STANDARD", "Standard", 1, True),
    ("subscription_plan", "PREMIUM", "Premium", 2, False),
]


def ensure_ref(cur, now, category: str, code: str, name: str, order: int, is_default: bool) -> tuple[str, bool]:
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
        return str(row[0]), False

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
            NULL, false, %s, 'active', %s, false, true,
            %s, %s, %s, %s
        )
        """,
        (rid, category, code, name, order, is_default, ORG, now, now, SEED, SEED),
    )
    return rid, True


def ensure_school_rooms(cur, now, count: int = 12) -> tuple[int, int]:
    created = 0
    skipped = 0
    for n in range(1, count + 1):
        name = f"Room {n}"
        cur.execute(
            "SELECT id FROM school_rooms WHERE organization_id = %s AND name = %s LIMIT 1",
            (ORG, name),
        )
        if cur.fetchone():
            skipped += 1
            continue
        cur.execute(
            """
            INSERT INTO school_rooms (
                id, organization_id, name, building, floor, capacity,
                rows_count, columns_count, linked_class_id, legacy_reference_id,
                is_active, created_at, updated_at, created_by, updated_by
            ) VALUES (
                %s, %s, %s, 'Main Block', %s, %s,
                NULL, NULL, NULL, NULL,
                true, %s, %s, %s, %s
            )
            """,
            (
                str(uuid.uuid4()),
                ORG,
                name,
                "Ground" if n <= 4 else ("First" if n <= 8 else "Second"),
                25 + (n % 6),
                now,
                now,
                SEED,
                SEED,
            ),
        )
        created += 1
    return created, skipped


def ensure_extra_term(cur, now) -> tuple[str | None, bool]:
    cur.execute(
        """
        SELECT COUNT(*) FROM terms
        WHERE organization_id = %s AND is_active = true
        """,
        (ORG,),
    )
    if cur.fetchone()[0] >= 2:
        return None, False

    term_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO terms (
            id, name, start_date, end_date, status, academic_year, description,
            organization_id, is_active, created_at, updated_at, created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s, 'active', %s, %s,
            %s, true, %s, %s, %s, %s
        )
        """,
        (
            term_id,
            "Term 2 (2026-27)",
            date(2026, 10, 1),
            date(2027, 3, 31),
            "2026-2027",
            "Second term demo data",
            ORG,
            now,
            now,
            SEED,
            SEED,
        ),
    )
    return term_id, True


def main() -> None:
    now = datetime.now(timezone.utc)
    inserted = 0
    skipped = 0
    by_category: dict[str, int] = {}

    with psycopg2.connect(**CONN) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM organizations WHERE id = %s", (ORG,))
            if not cur.fetchone():
                raise SystemExit(f"Organization {ORG} not found.")

            for category, code, name, order, is_default in REFERENCE_ROWS:
                _, created = ensure_ref(cur, now, category, code, name, order, is_default)
                if created:
                    inserted += 1
                    by_category[category] = by_category.get(category, 0) + 1
                else:
                    skipped += 1

            rooms_created, rooms_skipped = ensure_school_rooms(cur, now)
            extra_term_id, term_created = ensure_extra_term(cur, now)
            conn.commit()

    print(
        json.dumps(
            {
                "organization_id": ORG,
                "reference_values_inserted": inserted,
                "reference_values_skipped_existing": skipped,
                "inserted_by_category": by_category,
                "school_rooms_created": rooms_created,
                "school_rooms_skipped": rooms_skipped,
                "extra_term_created": term_created,
                "extra_term_id": extra_term_id,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
