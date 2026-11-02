-- Staff homework assignments by class and date
CREATE TABLE IF NOT EXISTS homework_assignments (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    staff_id VARCHAR(255) NOT NULL,
    staff_name VARCHAR(255),
    class_id VARCHAR(255) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_homework_assignments_org_date
    ON homework_assignments(organization_id, assigned_date);

CREATE INDEX IF NOT EXISTS idx_homework_assignments_class
    ON homework_assignments(class_id);

CREATE INDEX IF NOT EXISTS idx_homework_assignments_staff
    ON homework_assignments(staff_id);
