-- Campusza Exam Management Module (Phase 1 foundation)
-- Run against PostgreSQL. Forward-only; see create_exam_module_rollback.sql for manual rollback.

CREATE TABLE IF NOT EXISTS exam_series (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    term_id VARCHAR(255) NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
    academic_year VARCHAR(50) NOT NULL DEFAULT '',
    name VARCHAR(150) NOT NULL,
    exam_type_ref_id VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Draft',
    instructions TEXT,
    published_at TIMESTAMP,
    published_by VARCHAR(255),
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(255),
    cancel_reason TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT ck_exam_series_dates CHECK (end_date >= start_date),
    CONSTRAINT ck_exam_series_status CHECK (status IN (
        'Draft', 'Scheduled', 'Published', 'In Progress', 'Completed', 'Results Published', 'Cancelled'
    ))
);

CREATE INDEX IF NOT EXISTS idx_exam_series_org_term ON exam_series (organization_id, term_id, start_date);
CREATE INDEX IF NOT EXISTS idx_exam_series_org_status ON exam_series (organization_id, status) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS exam_sessions (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_series_id VARCHAR(255) NOT NULL REFERENCES exam_series(id) ON DELETE CASCADE,
    subject_id VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    max_marks NUMERIC(7,2) NOT NULL,
    passing_marks NUMERIC(7,2) NOT NULL DEFAULT 0,
    instructions TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'Draft',
    marks_status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    marks_submitted_at TIMESTAMP,
    marks_submitted_by VARCHAR(255),
    marks_approved_at TIMESTAMP,
    marks_approved_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT ck_exam_session_time CHECK (end_time > start_time),
    CONSTRAINT ck_exam_session_duration CHECK (duration_minutes > 0),
    CONSTRAINT ck_exam_session_marks CHECK (
        max_marks > 0 AND passing_marks >= 0 AND passing_marks <= max_marks
    ),
    CONSTRAINT ck_exam_session_status CHECK (status IN (
        'Draft', 'Scheduled', 'Published', 'In Progress', 'Completed', 'Cancelled'
    )),
    CONSTRAINT ck_exam_session_marks_status CHECK (marks_status IN (
        'Draft', 'Submitted', 'Approved'
    ))
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_series_date ON exam_sessions (organization_id, exam_series_id, exam_date);

CREATE TABLE IF NOT EXISTS exam_session_classes (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_session_id VARCHAR(255) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_session_classes UNIQUE (organization_id, exam_session_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_session_classes_class ON exam_session_classes (organization_id, class_id, exam_session_id);

CREATE TABLE IF NOT EXISTS exam_rooms (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    floor VARCHAR(50),
    capacity INTEGER NOT NULL,
    rows_count INTEGER,
    columns_count INTEGER,
    linked_class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT uq_exam_rooms_org_name UNIQUE (organization_id, name),
    CONSTRAINT ck_exam_rooms_capacity CHECK (capacity > 0),
    CONSTRAINT ck_exam_rooms_rows CHECK (rows_count IS NULL OR rows_count > 0),
    CONSTRAINT ck_exam_rooms_cols CHECK (columns_count IS NULL OR columns_count > 0)
);

CREATE TABLE IF NOT EXISTS exam_session_rooms (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_session_id VARCHAR(255) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_room_id VARCHAR(255) NOT NULL REFERENCES exam_rooms(id) ON DELETE RESTRICT,
    allocated_capacity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_session_rooms UNIQUE (organization_id, exam_session_id, exam_room_id),
    CONSTRAINT ck_exam_session_rooms_cap CHECK (allocated_capacity > 0)
);

CREATE TABLE IF NOT EXISTS exam_invigilators (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_session_id VARCHAR(255) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_room_id VARCHAR(255) NOT NULL REFERENCES exam_rooms(id) ON DELETE CASCADE,
    staff_id VARCHAR(255) NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    role VARCHAR(30) NOT NULL DEFAULT 'Invigilator',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_invigilators UNIQUE (organization_id, exam_session_id, exam_room_id, staff_id),
    CONSTRAINT ck_exam_invigilator_role CHECK (role IN ('Invigilator', 'Chief Invigilator'))
);

CREATE TABLE IF NOT EXISTS exam_seat_allocations (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_session_id VARCHAR(255) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_room_id VARCHAR(255) NOT NULL REFERENCES exam_rooms(id) ON DELETE CASCADE,
    student_enrollment_id VARCHAR(255) NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    seat_label VARCHAR(30) NOT NULL,
    allocation_source VARCHAR(20) NOT NULL DEFAULT 'Auto',
    is_locked BOOLEAN NOT NULL DEFAULT false,
    allocated_by VARCHAR(255) NOT NULL DEFAULT '',
    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_seat_enrollment UNIQUE (organization_id, exam_session_id, student_enrollment_id),
    CONSTRAINT uq_exam_seat_label UNIQUE (organization_id, exam_session_id, exam_room_id, seat_label),
    CONSTRAINT ck_exam_seat_source CHECK (allocation_source IN ('Auto', 'Manual'))
);

CREATE INDEX IF NOT EXISTS idx_exam_seats_room ON exam_seat_allocations (organization_id, exam_session_id, exam_room_id);

CREATE TABLE IF NOT EXISTS exam_class_mark_registers (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_series_id VARCHAR(255) NOT NULL REFERENCES exam_series(id) ON DELETE CASCADE,
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    marks_status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    submitted_at TIMESTAMP,
    submitted_by VARCHAR(255),
    approved_at TIMESTAMP,
    approved_by VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT uq_exam_class_register UNIQUE (organization_id, exam_series_id, class_id),
    CONSTRAINT ck_exam_class_register_status CHECK (marks_status IN ('Draft', 'Submitted', 'Approved'))
);

CREATE TABLE IF NOT EXISTS exam_marks (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_session_id VARCHAR(255) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    student_enrollment_id VARCHAR(255) NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(7,2),
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    remarks TEXT,
    entered_by VARCHAR(255) NOT NULL DEFAULT '',
    entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL DEFAULT '',
    CONSTRAINT uq_exam_marks UNIQUE (organization_id, exam_session_id, student_enrollment_id),
    CONSTRAINT ck_exam_marks_nonneg CHECK (marks_obtained IS NULL OR marks_obtained >= 0),
    CONSTRAINT ck_exam_marks_attendance CHECK (attendance_status IN (
        'Pending', 'Present', 'Absent', 'Excused', 'Exempt'
    )),
    CONSTRAINT ck_exam_marks_absent_null CHECK (
        (attendance_status = 'Absent' AND marks_obtained IS NULL)
        OR (attendance_status <> 'Absent')
    )
);

CREATE INDEX IF NOT EXISTS idx_exam_marks_session ON exam_marks (organization_id, exam_session_id);

CREATE TABLE IF NOT EXISTS exam_result_publications (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_series_id VARCHAR(255) NOT NULL REFERENCES exam_series(id) ON DELETE CASCADE,
    published_by VARCHAR(255) NOT NULL,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Published',
    CONSTRAINT ck_exam_result_pub_status CHECK (status IN ('Published', 'Revoked'))
);

CREATE TABLE IF NOT EXISTS exam_audit_log (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(80) NOT NULL,
    reason TEXT,
    before_json JSONB,
    after_json JSONB,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_audit_org_entity ON exam_audit_log (organization_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_exam_audit_created ON exam_audit_log (organization_id, created_at DESC);
