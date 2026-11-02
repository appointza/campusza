-- Student enrollment and transfer tables
-- Run against the Campusza PostgreSQL database

CREATE TABLE IF NOT EXISTS student_enrollments (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL,
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    grade VARCHAR(50),
    section VARCHAR(255),
    roll_number INTEGER,
    enrollment_status VARCHAR(50) NOT NULL DEFAULT 'enrolled'
        CHECK (enrollment_status IN ('enrolled', 'withdrawn', 'completed', 'transferred', 'left')),
    joined_date DATE,
    left_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'current'
        CHECK (status IN ('current', 'completed', 'transferred', 'left')),
    is_current BOOLEAN NOT NULL DEFAULT false,
    term_id VARCHAR(255) REFERENCES terms(id) ON DELETE SET NULL,
    term_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_org ON student_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_year ON student_enrollments(academic_year);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class ON student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_current ON student_enrollments(student_id, is_current) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS student_transfers (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id VARCHAR(255) REFERENCES student_enrollments(id) ON DELETE SET NULL,
    from_class_id VARCHAR(255),
    from_class_name VARCHAR(255),
    from_section VARCHAR(255),
    to_class_id VARCHAR(255),
    to_class_name VARCHAR(255),
    to_section VARCHAR(255),
    reason TEXT,
    effective_date DATE NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_student_transfers_student ON student_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_student_transfers_enrollment ON student_transfers(enrollment_id);

-- Backfill current enrollments from existing student records
INSERT INTO student_enrollments (
    id, organization_id, student_id, academic_year, class_id, class_name, grade, section,
    roll_number, enrollment_status, joined_date, status, is_current, term_id, term_name,
    is_active, created_at, updated_at, created_by, updated_by
)
SELECT
    gen_random_uuid()::text,
    s.organization_id,
    s.id,
    COALESCE(NULLIF(s.current_academic_year, ''), 'Unknown'),
    s.class_id,
    s.class_name,
    s.grade,
    s.section,
    s.roll_number,
    'enrolled',
    s.admission_date,
    'current',
    true,
    s.current_term_id,
    s.current_term_name,
    s.is_active,
    s.created_at,
    s.updated_at,
    s.created_by,
    s.updated_by
FROM students s
WHERE s.is_active = true
  AND NOT EXISTS (
      SELECT 1 FROM student_enrollments e
      WHERE e.student_id = s.id AND e.is_current = true AND e.is_active = true
  );
