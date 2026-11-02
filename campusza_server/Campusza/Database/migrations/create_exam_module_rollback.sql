-- Manual rollback for create_exam_module.sql (run only if Phase 1 must be reversed)
-- Order respects foreign keys.

DROP TABLE IF EXISTS exam_audit_log;
DROP TABLE IF EXISTS exam_result_publications;
DROP TABLE IF EXISTS exam_marks;
DROP TABLE IF EXISTS exam_class_mark_registers;
DROP TABLE IF EXISTS exam_seat_allocations;
DROP TABLE IF EXISTS exam_invigilators;
DROP TABLE IF EXISTS exam_session_rooms;
DROP TABLE IF EXISTS exam_rooms;
DROP TABLE IF EXISTS exam_session_classes;
DROP TABLE IF EXISTS exam_sessions;
DROP TABLE IF EXISTS exam_series;
