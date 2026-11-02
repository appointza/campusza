import type { Student } from "./student.model";

export type EnrollmentStatus = "enrolled" | "withdrawn" | "completed" | "transferred" | "left";
export type EnrollmentRecordStatus = "current" | "completed" | "transferred" | "left";
export type PromotionOutcome = "promote" | "repeat" | "transfer_out" | "left_school";

export interface StudentEnrollment {
  id: string;
  organizationId: string;
  studentId: string;
  academicYear: string;
  classId: string;
  className?: string;
  grade?: string;
  section?: string;
  rollNumber?: number;
  enrollmentStatus: EnrollmentStatus;
  joinedDate?: string;
  leftDate?: string;
  status: EnrollmentRecordStatus;
  isCurrent: boolean;
  termId?: string;
  termName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface StudentEnrollmentWithProfile {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  academicYear: string;
  classId: string;
  className: string;
  grade: string;
  section: string;
  rollNumber?: number;
  enrollmentStatus: string;
  status: string;
  isCurrent: boolean;
  studentStatus: string;
  admissionDate?: string;
  joinedDate?: string;
}

export interface StudentTransfer {
  id: string;
  organizationId: string;
  studentId: string;
  enrollmentId: string;
  fromClassId: string;
  fromClassName: string;
  fromSection: string;
  toClassId: string;
  toClassName: string;
  toSection: string;
  reason: string;
  effectiveDate: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

export interface StudentPromotionOutcome {
  studentId: string;
  outcome: PromotionOutcome;
  rollNumber?: number;
}

export interface PromoteStudentsRequest {
  organizationId: string;
  fromAcademicYear: string;
  fromClassId: string;
  fromSection: string;
  toAcademicYear: string;
  toClassId: string;
  toClassName: string;
  toGrade: string;
  toSection: string;
  newTermId?: string;
  newTermName?: string;
  promotedBy: string;
  notes?: string;
  students: StudentPromotionOutcome[];
}

export interface TransferStudentRequest {
  organizationId: string;
  studentId: string;
  enrollmentId: string;
  toClassId: string;
  toClassName: string;
  toGrade: string;
  toSection: string;
  rollNumber?: number;
  reason: string;
  effectiveDate: string;
}

export interface CreateStudentWithEnrollmentRequest {
  student: Partial<Student>;
  enrollment: Partial<StudentEnrollment>;
}

export const getEnrollmentStatusLabel = (status: EnrollmentRecordStatus): string => {
  const labels: Record<EnrollmentRecordStatus, string> = {
    current: "Current",
    completed: "Completed",
    transferred: "Transferred",
    left: "Left",
  };
  return labels[status] ?? status;
};

export const getPromotionOutcomeLabel = (outcome: PromotionOutcome): string => {
  const labels: Record<PromotionOutcome, string> = {
    promote: "Promote",
    repeat: "Repeat Same Class",
    transfer_out: "Transfer Out",
    left_school: "Left School",
  };
  return labels[outcome] ?? outcome;
};
