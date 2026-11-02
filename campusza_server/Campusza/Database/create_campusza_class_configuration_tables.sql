-- =====================================================
-- CAMPUSZA CLASS CONFIGURATION TABLES
-- =====================================================
-- Creates tables used by ClassConfigurationService:
-- - class_fee_configurations
-- - document_requirements

CREATE TABLE IF NOT EXISTS class_fee_configurations (
    id TEXT PRIMARY KEY,
    grade TEXT NOT NULL,
    class_id TEXT,
    class_name TEXT,
    semester_type TEXT,
    term_id TEXT,
    term_name TEXT,
    fee_structures JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    due_date DATE,
    payment_schedule TEXT DEFAULT 'one_time',
    number_of_installments INTEGER DEFAULT 0,
    organization_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_class_fee_configurations_org
    ON class_fee_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_class_fee_configurations_class
    ON class_fee_configurations(class_id);
CREATE INDEX IF NOT EXISTS idx_class_fee_configurations_term
    ON class_fee_configurations(term_id);
CREATE INDEX IF NOT EXISTS idx_class_fee_configurations_grade
    ON class_fee_configurations(grade);
CREATE INDEX IF NOT EXISTS idx_class_fee_configurations_active
    ON class_fee_configurations(is_active);

CREATE TABLE IF NOT EXISTS document_requirements (
    id TEXT PRIMARY KEY,
    grade TEXT NOT NULL,
    class_id TEXT,
    class_name TEXT,
    semester_type TEXT,
    term_id TEXT,
    term_name TEXT,
    document_type TEXT,
    action TEXT,
    is_required BOOLEAN DEFAULT false,
    required_at TEXT,
    assigned_staff_id TEXT,
    assigned_staff_name TEXT,
    description TEXT,
    organization_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_document_requirements_org
    ON document_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_requirements_class
    ON document_requirements(class_id);
CREATE INDEX IF NOT EXISTS idx_document_requirements_term
    ON document_requirements(term_id);
CREATE INDEX IF NOT EXISTS idx_document_requirements_grade
    ON document_requirements(grade);
CREATE INDEX IF NOT EXISTS idx_document_requirements_active
    ON document_requirements(is_active);

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================
SELECT 'Campusza class configuration tables created successfully!' as status;
