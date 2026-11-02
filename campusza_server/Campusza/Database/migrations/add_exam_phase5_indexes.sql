-- Phase 5: exam lookup indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_exam_class_register_org_series
    ON exam_class_mark_registers (organization_id, exam_series_id, class_id);

CREATE INDEX IF NOT EXISTS idx_exam_invigilators_staff_session
    ON exam_invigilators (organization_id, staff_id, exam_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_invigilator_room_staff
    ON exam_invigilators (organization_id, exam_session_id, exam_room_id, staff_id);
