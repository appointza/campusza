-- =====================================================
-- Campusza Minimal Schema (Core Tables Only)
-- =====================================================
-- Focused on: Admin Staff, Classes, Class Config
-- =====================================================

-- Enable UUID extension (if using UUIDs)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ORGANIZATION TABLES
-- =====================================================

CREATE TABLE organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address_street VARCHAR(255),
    address_city VARCHAR(255),
    address_state VARCHAR(255),
    address_zip_code VARCHAR(50),
    address_country VARCHAR(100),
    logo_url TEXT,
    website VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('school', 'college', 'university', 'training_center', 'other')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    subscription_plan VARCHAR(50) NOT NULL CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_start_date DATE NOT NULL,
    subscription_end_date DATE,
    max_users INTEGER NOT NULL DEFAULT 0,
    max_students INTEGER NOT NULL DEFAULT 0,
    current_users INTEGER NOT NULL DEFAULT 0,
    current_students INTEGER NOT NULL DEFAULT 0,
    settings JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- =====================================================
-- USER & AUTHENTICATION TABLES
-- =====================================================

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'admin_staff', 'staff', 'student', 'parent')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    otp_expires_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    isfactory BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_permissions (
    id VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'student', 'parent')),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT true,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- =====================================================
-- REFERENCE VALUE TABLES
-- =====================================================

CREATE TABLE reference_values (
    id VARCHAR(255) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    description TEXT,
    value VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    parent_id VARCHAR(255) REFERENCES reference_values(id) ON DELETE SET NULL,
    metadata JSONB,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'archived')),
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    isfactory BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    UNIQUE(category, code, organization_id)
);

-- =====================================================
-- TERM TABLES
-- =====================================================

CREATE TABLE academic_years (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE terms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'upcoming', 'cancelled')),
    academic_year VARCHAR(50) NOT NULL,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255)
);

-- =====================================================
-- CLASS TABLES
-- =====================================================

CREATE TABLE classes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    section VARCHAR(255) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    term_id VARCHAR(255) NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    capacity INTEGER NOT NULL,
    current_enrollment INTEGER NOT NULL DEFAULT 0,
    room VARCHAR(100),
    class_teacher_id VARCHAR(255),
    class_teacher_name VARCHAR(255),
    assistant_mentor_id VARCHAR(255),
    assistant_mentor_name VARCHAR(255),
    subjects JSONB,
    schedule JSONB,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'archived')),
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    UNIQUE(name, academic_year, organization_id)
);

-- =====================================================
-- STAFF TABLES
-- =====================================================

CREATE TABLE staff (
    id VARCHAR(255) PRIMARY KEY,
    staff_id VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    address_street VARCHAR(255),
    address_city VARCHAR(255),
    address_state VARCHAR(255),
    address_zip_code VARCHAR(50),
    address_country VARCHAR(100),
    department VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'administrator', 'counselor', 'coach', 'librarian', 'nurse', 'other')),
    subjects JSONB,
    qualification VARCHAR(255),
    experience INTEGER,
    joining_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'on_leave', 'inactive', 'suspended')),
    photo_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(50),
    salary_amount DECIMAL(10, 2),
    salary_currency VARCHAR(10),
    salary_payment_frequency VARCHAR(20) CHECK (salary_payment_frequency IN ('monthly', 'biweekly', 'weekly')),
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    UNIQUE(staff_id, organization_id)
);

CREATE TABLE staff_leaves (
    id VARCHAR(255) PRIMARY KEY,
    staff_id VARCHAR(255) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    staff_name VARCHAR(255) NOT NULL,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick', 'casual', 'personal', 'emergency', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    applied_date DATE NOT NULL,
    approved_by VARCHAR(255),
    approved_date DATE,
    rejected_reason TEXT,
    total_days INTEGER NOT NULL,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_schedules (
    id VARCHAR(255) PRIMARY KEY,
    staff_id VARCHAR(255) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    staff_name VARCHAR(255) NOT NULL,
    day VARCHAR(20) NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(255) NOT NULL,
    subject_id VARCHAR(255),
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    class_name VARCHAR(255) NOT NULL,
    room VARCHAR(255) NOT NULL,
    is_replacement BOOLEAN NOT NULL DEFAULT false,
    original_teacher_id VARCHAR(255),
    original_teacher_name VARCHAR(255),
    replacement_teacher_id VARCHAR(255),
    replacement_teacher_name VARCHAR(255),
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_replacements (
    id VARCHAR(255) PRIMARY KEY,
    schedule_id VARCHAR(255) NOT NULL REFERENCES staff_schedules(id) ON DELETE CASCADE,
    original_teacher_id VARCHAR(255) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    original_teacher_name VARCHAR(255) NOT NULL,
    replacement_teacher_id VARCHAR(255) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    replacement_teacher_name VARCHAR(255) NOT NULL,
    subject_id VARCHAR(255),
    subject VARCHAR(255),
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    assigned_by VARCHAR(255) NOT NULL,
    assigned_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STUDENT TABLES
-- =====================================================

CREATE TABLE students (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    address_street VARCHAR(255),
    address_city VARCHAR(255),
    address_state VARCHAR(255),
    address_zip_code VARCHAR(50),
    address_country VARCHAR(100),
    parent_guardian_name VARCHAR(255),
    parent_guardian_relationship VARCHAR(50) CHECK (parent_guardian_relationship IN ('father', 'mother', 'guardian', 'other')),
    parent_guardian_email VARCHAR(255),
    parent_guardian_phone VARCHAR(50),
    parent_guardian_occupation VARCHAR(255),
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    grade VARCHAR(50) NOT NULL,
    section VARCHAR(255) NOT NULL,
    roll_number INTEGER NOT NULL,
    admission_date DATE NOT NULL,
    current_academic_year VARCHAR(50) NOT NULL,
    current_semester_type VARCHAR(50) CHECK (current_semester_type IN ('semester_1', 'semester_2', 'annual', 'quarterly', 'term_based')),
    current_term_id VARCHAR(255) REFERENCES terms(id) ON DELETE SET NULL,
    current_term_name VARCHAR(255),
    status VARCHAR(255) NOT NULL REFERENCES reference_values(id),
    photo_url TEXT,
    blood_group VARCHAR(10),
    medical_conditions TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(50),
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    UNIQUE(student_id, organization_id),
    UNIQUE(class_id, roll_number, organization_id)
);

-- =====================================================
-- CLASS SCHEDULE TABLES
-- =====================================================

CREATE TABLE class_schedules (
    id VARCHAR(255) PRIMARY KEY,
    day VARCHAR(20) NOT NULL CHECK (day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id VARCHAR(255),
    subject_name VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) REFERENCES staff(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255),
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    class_name VARCHAR(255) NOT NULL,
    room VARCHAR(100) NOT NULL,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ATTENDANCE TABLES
-- =====================================================

CREATE TABLE attendance (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('student', 'staff')),
    date DATE NOT NULL,
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE CASCADE,
    class_name VARCHAR(255),
    student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    staff_id VARCHAR(255) REFERENCES staff(id) ON DELETE CASCADE,
    staff_name VARCHAR(255),
    status VARCHAR(255) NOT NULL REFERENCES reference_values(id),
    check_in_time TIME,
    check_out_time TIME,
    remarks TEXT,
    marked_by VARCHAR(255) NOT NULL,
    marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, date, COALESCE(student_id, staff_id), organization_id)
);

CREATE TABLE homework_assignments (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    staff_id VARCHAR(255) NOT NULL,
    staff_name VARCHAR(255),
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    class_name VARCHAR(255),
    subject VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE TABLE attendance_records (
    id VARCHAR(255) PRIMARY KEY,
    date DATE NOT NULL,
    class_id VARCHAR(255) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    class_name VARCHAR(255) NOT NULL,
    total_students INTEGER NOT NULL,
    present INTEGER NOT NULL DEFAULT 0,
    absent INTEGER NOT NULL DEFAULT 0,
    late INTEGER NOT NULL DEFAULT 0,
    excused INTEGER NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5, 2) NOT NULL,
    marked_by VARCHAR(255) NOT NULL,
    marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, class_id, organization_id)
);

-- =====================================================
-- DOCUMENT UPLOADS (STUDENT DOCUMENT STORAGE)
-- =====================================================

CREATE TABLE document_uploads (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    term_id VARCHAR(255) REFERENCES terms(id) ON DELETE SET NULL,
    term_name VARCHAR(255),
    document_type VARCHAR(255) NOT NULL REFERENCES reference_values(id),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('submitted', 'verified', 'rejected')),
    remarks TEXT,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CLASS CONFIGURATION TABLES
-- =====================================================

CREATE TABLE class_fee_configurations (
    id VARCHAR(255) PRIMARY KEY,
    grade VARCHAR(50) NOT NULL,
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    semester_type VARCHAR(50) NOT NULL CHECK (semester_type IN ('semester_1', 'semester_2', 'annual', 'quarterly', 'term_based')),
    term_id VARCHAR(255) REFERENCES terms(id) ON DELETE SET NULL,
    term_name VARCHAR(255),
    fee_structures JSONB,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    due_date DATE,
    payment_schedule VARCHAR(50) NOT NULL DEFAULT 'one_time',
    number_of_installments INTEGER NOT NULL DEFAULT 1,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255)
);

CREATE TABLE document_requirements (
    id VARCHAR(255) PRIMARY KEY,
    grade VARCHAR(50) NOT NULL,
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    semester_type VARCHAR(50) NOT NULL CHECK (semester_type IN ('semester_1', 'semester_2', 'annual', 'quarterly', 'term_based')),
    term_id VARCHAR(255) REFERENCES terms(id) ON DELETE SET NULL,
    term_name VARCHAR(255),
    document_type VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('collect', 'issue')),
    is_required BOOLEAN NOT NULL DEFAULT false,
    required_at VARCHAR(50) NOT NULL,
    assigned_staff_id VARCHAR(255) REFERENCES staff(id) ON DELETE SET NULL,
    assigned_staff_name VARCHAR(255),
    description TEXT,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_reference_values_category ON reference_values(category);
CREATE INDEX idx_reference_values_organization_id ON reference_values(organization_id);
CREATE INDEX idx_reference_values_status ON reference_values(status);

CREATE INDEX idx_terms_organization_id ON terms(organization_id);
CREATE INDEX idx_terms_status ON terms(status);
CREATE INDEX idx_terms_academic_year ON terms(academic_year);

CREATE INDEX idx_classes_organization_id ON classes(organization_id);
CREATE INDEX idx_classes_term_id ON classes(term_id);
CREATE INDEX idx_classes_status ON classes(status);

CREATE INDEX idx_staff_organization_id ON staff(organization_id);
CREATE INDEX idx_staff_staff_id ON staff(staff_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_leaves_staff_id ON staff_leaves(staff_id);
CREATE INDEX idx_staff_leaves_status ON staff_leaves(status);
CREATE INDEX idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX idx_staff_schedules_class_id ON staff_schedules(class_id);
CREATE INDEX idx_staff_replacements_schedule_id ON staff_replacements(schedule_id);

CREATE INDEX idx_students_organization_id ON students(organization_id);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status);

CREATE INDEX idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX idx_class_schedules_teacher_id ON class_schedules(teacher_id);
CREATE INDEX idx_class_schedules_day ON class_schedules(day);

CREATE INDEX idx_attendance_organization_id ON attendance(organization_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_staff_id ON attendance(staff_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);

CREATE INDEX idx_attendance_records_date ON attendance_records(date);
CREATE INDEX idx_attendance_records_class_id ON attendance_records(class_id);

CREATE INDEX idx_document_uploads_student_id ON document_uploads(student_id);
CREATE INDEX idx_document_uploads_document_type ON document_uploads(document_type);
CREATE INDEX idx_document_uploads_class_id ON document_uploads(class_id);
CREATE INDEX idx_document_uploads_term_id ON document_uploads(term_id);

CREATE INDEX idx_class_fee_configurations_org ON class_fee_configurations(organization_id);
CREATE INDEX idx_document_requirements_org ON document_requirements(organization_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reference_values_updated_at BEFORE UPDATE ON reference_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_terms_updated_at BEFORE UPDATE ON terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_leaves_updated_at BEFORE UPDATE ON staff_leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_replacements_updated_at BEFORE UPDATE ON staff_replacements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON class_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_uploads_updated_at BEFORE UPDATE ON document_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_fee_configurations_updated_at BEFORE UPDATE ON class_fee_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_requirements_updated_at BEFORE UPDATE ON document_requirements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEFAULT REFERENCE VALUES (CORE ONLY)
-- =====================================================

-- Semester Type Reference Values
INSERT INTO reference_values (id, category, code, name, display_order, is_system, is_default, status, organization_id, is_active, created_at, updated_at, created_by) VALUES
('REF_SEM_TYPE_001', 'semester_type', 'SEMESTER_1', 'Semester 1', 1, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_SEM_TYPE_002', 'semester_type', 'SEMESTER_2', 'Semester 2', 2, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_SEM_TYPE_003', 'semester_type', 'ANNUAL', 'Annual', 3, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_SEM_TYPE_004', 'semester_type', 'QUARTERLY', 'Quarterly', 4, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_SEM_TYPE_005', 'semester_type', 'TERM_BASED', 'Term Based', 5, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system');

-- Attendance Status Reference Values
INSERT INTO reference_values (id, category, code, name, display_order, is_system, is_default, status, organization_id, is_active, created_at, updated_at, created_by) VALUES
('REF_ATT_STAT_001', 'attendance_status', 'PRESENT', 'Present', 1, true, true, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_ATT_STAT_002', 'attendance_status', 'ABSENT', 'Absent', 2, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_ATT_STAT_003', 'attendance_status', 'LATE', 'Late', 3, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_ATT_STAT_004', 'attendance_status', 'EXCUSED', 'Excused', 4, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system');

-- Student Status Reference Values
INSERT INTO reference_values (id, category, code, name, display_order, is_system, is_default, status, organization_id, is_active, created_at, updated_at, created_by) VALUES
('REF_STU_STAT_001', 'student_status', 'ACTIVE', 'Active', 1, true, true, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_STU_STAT_002', 'student_status', 'INACTIVE', 'Inactive', 2, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_STU_STAT_003', 'student_status', 'GRADUATED', 'Graduated', 3, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_STU_STAT_004', 'student_status', 'TRANSFERRED', 'Transferred', 4, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_STU_STAT_005', 'student_status', 'SUSPENDED', 'Suspended', 5, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system');

-- Document Type Reference Values
INSERT INTO reference_values (id, category, code, name, display_order, is_system, is_default, status, organization_id, is_active, created_at, updated_at, created_by) VALUES
('REF_DOC_TYPE_001', 'document_type', 'MARKSHEET', 'Marksheet', 1, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_002', 'document_type', 'REPORT_CARD', 'Report Card', 2, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_003', 'document_type', 'TRANSFER_CERTIFICATE', 'Transfer Certificate', 3, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_004', 'document_type', 'BONAFIDE_CERTIFICATE', 'Bonafide Certificate', 4, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_005', 'document_type', 'CHARACTER_CERTIFICATE', 'Character Certificate', 5, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_006', 'document_type', 'MIGRATION_CERTIFICATE', 'Migration Certificate', 6, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_007', 'document_type', 'ID_CARD', 'ID Card', 7, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DOC_TYPE_008', 'document_type', 'OTHER', 'Other Document', 8, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system');

-- Department Reference Values
INSERT INTO reference_values (id, category, code, name, display_order, is_system, is_default, status, organization_id, is_active, created_at, updated_at, created_by) VALUES
('REF_DEP_001', 'department', 'SCI', 'Science', 1, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DEP_002', 'department', 'MATH', 'Mathematics', 2, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DEP_003', 'department', 'ENG', 'English', 3, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DEP_004', 'department', 'SOC', 'Social Studies', 4, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DEP_005', 'department', 'COMP', 'Computer Science', 5, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DEP_006', 'department', 'ART', 'Arts', 6, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_DEP_007', 'department', 'PE', 'Physical Education', 7, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system');

-- Period / Time Slot Reference Values (for timetable; name = display time e.g. "8:00 AM")
-- Use organization_id = NULL for global, or your organization UUID for org-specific periods.
INSERT INTO reference_values (id, category, code, name, display_order, is_system, is_default, status, organization_id, is_active, created_at, updated_at, created_by) VALUES
('REF_PERIOD_001', 'period', 'P1', '8:00 AM', 1, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_002', 'period', 'P2', '9:00 AM', 2, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_003', 'period', 'P3', '10:00 AM', 3, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_004', 'period', 'P4', '11:00 AM', 4, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_005', 'period', 'P5', '12:00 PM', 5, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_006', 'period', 'P6', '1:00 PM', 6, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_007', 'period', 'P7', '2:00 PM', 7, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_008', 'period', 'P8', '3:00 PM', 8, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system'),
('REF_PERIOD_009', 'period', 'P9', '4:00 PM', 9, true, false, 'active', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system');

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================

CREATE TABLE attendance (
    id VARCHAR(255) PRIMARY KEY,

    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('student', 'staff')),

    date DATE NOT NULL,

    class_id VARCHAR(255) 
        REFERENCES classes(id) ON DELETE CASCADE,

    class_name VARCHAR(255),

    student_id VARCHAR(255) 
        REFERENCES students(id) ON DELETE CASCADE,

    student_name VARCHAR(255),

    staff_id VARCHAR(255) 
        REFERENCES staff(id) ON DELETE CASCADE,

    staff_name VARCHAR(255),

    status VARCHAR(50) NOT NULL 
        CHECK (status IN ('present', 'absent', 'late', 'half_day')),

    check_in_time TIME,
    check_out_time TIME,

    remarks TEXT,

    marked_by VARCHAR(255) NOT NULL,
    marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    organization_id VARCHAR(255) NOT NULL 
        REFERENCES organizations(id) ON DELETE CASCADE,

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Enforce correct relation
    CHECK (
        (type = 'student' AND student_id IS NOT NULL AND staff_id IS NULL)
        OR
        (type = 'staff' AND staff_id IS NOT NULL AND student_id IS NULL)
    )
);

-- =====================================================
-- STUDENT PROMOTION TABLES
-- =====================================================

CREATE TABLE student_academic_history (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(50) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    section VARCHAR(255),
    roll_number INTEGER,
    -- Performance data
    total_marks NUMERIC(6,2),
    percentage NUMERIC(5,2),
    gpa NUMERIC(3,2),
    grade_letter VARCHAR(2),
    -- Status
    promotion_status VARCHAR(50) DEFAULT 'current' CHECK (promotion_status IN ('current', 'promoted', 'retained', 'transferred', 'dropped')),
    promotion_date TIMESTAMP,
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255)
);

CREATE TABLE student_promotions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    from_grade VARCHAR(10) NOT NULL,
    from_class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    from_class_name VARCHAR(255),
    to_grade VARCHAR(10) NOT NULL,
    to_class_id VARCHAR(255) REFERENCES classes(id) ON DELETE SET NULL,
    to_class_name VARCHAR(255),
    academic_year_from VARCHAR(50) NOT NULL,
    academic_year_to VARCHAR(50) NOT NULL,
    -- Performance for promotion decision
    final_percentage NUMERIC(5,2),
    gpa NUMERIC(3,2),
    -- Decision
    promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('promoted', 'retained', 'transferred', 'dropped')),
    promotion_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    promoted_by VARCHAR(255) NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255)
);

CREATE TABLE student_enrollments (
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

CREATE TABLE student_transfers (
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

CREATE INDEX idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_current ON student_enrollments(student_id, is_current) WHERE is_current = true;
CREATE INDEX idx_student_transfers_student ON student_transfers(student_id);

-- Index for faster queries
CREATE INDEX idx_student_academic_history_student_id ON student_academic_history(student_id);
CREATE INDEX idx_student_academic_history_academic_year ON student_academic_history(academic_year);
CREATE INDEX idx_student_promotions_student_id ON student_promotions(student_id);
CREATE INDEX idx_student_promotions_academic_year_from ON student_promotions(academic_year_from);

-- Bell schedule: period times per grade (timetable rows)
CREATE TABLE IF NOT EXISTS grade_periods (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    grade_id VARCHAR(255) NOT NULL,
    grade_name VARCHAR(255) NOT NULL DEFAULT '',
    period_code VARCHAR(50) NOT NULL,
    period_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    updated_by VARCHAR(255),
    UNIQUE (organization_id, grade_id, period_code)
);

CREATE INDEX IF NOT EXISTS idx_grade_periods_org_grade
    ON grade_periods (organization_id, grade_id)
    WHERE is_active = true;

-- Admission number series per organization
CREATE TABLE IF NOT EXISTS organization_admission_number_series (
    organization_id VARCHAR(255) PRIMARY KEY,
    prefix VARCHAR(50) NOT NULL DEFAULT '',
    suffix VARCHAR(50) NOT NULL DEFAULT '',
    next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number >= 1),
    padding INTEGER NOT NULL DEFAULT 4 CHECK (padding >= 1 AND padding <= 12),
    auto_generate BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_org_admission_series_org
    ON organization_admission_number_series (organization_id);

SELECT 'Core schema created successfully!' as status;
