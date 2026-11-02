-- Repair partial exam module installs (fixes ExamSession Select / GetAdminExamsPage 500).
-- Safe to run multiple times.

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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255) NOT NULL DEFAULT ''
);

ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS marks_status VARCHAR(30) NOT NULL DEFAULT 'Draft';

CREATE TABLE IF NOT EXISTS exam_session_classes (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    exam_session_id VARCHAR(255) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_session_classes UNIQUE (organization_id, exam_session_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_session_classes_class ON exam_session_classes (organization_id, class_id, exam_session_id);
