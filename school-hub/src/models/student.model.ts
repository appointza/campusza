// Student Model — permanent profile (class/year placement lives in student_enrollments)
import type { StudentExtendedProfile } from "./student-profile.model";

export type StudentStatus = "active" | "inactive" | "graduated" | "transferred" | "suspended";

export interface Student {
  id: string;
  studentId: string;

  firstName: string;
  lastName: string;
  fullName?: string;

  email?: string;
  phone: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;

  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  parentGuardian: {
    name: string;
    relationship: "father" | "mother" | "guardian" | "other";
    email?: string;
    phone: string;
    occupation?: string;
  };

  /** Denormalized pointers synced from current enrollment */
  classId: string;
  className?: string;
  grade?: string;
  section?: string;
  rollNumber: number;
  admissionDate?: string;
  currentAcademicYear: string;
  currentTermId?: string;
  currentTermName?: string;
  status?: StudentStatus | string;

  photoUrl?: string;
  bloodGroup?: string;
  medicalConditions?: string;

  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  organizationId: string;
  isActive: boolean;
  extendedProfile?: StudentExtendedProfile;
  loginMobile?: string;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export const getStudentStatusColor = (status: StudentStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "graduated": return "bg-blue-100 text-blue-700";
    case "transferred": return "bg-yellow-100 text-yellow-700";
    case "suspended": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getStudentStatusLabel = (status: StudentStatus): string => {
  const labels: Record<StudentStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    graduated: "Graduated",
    transferred: "Transferred",
    suspended: "Suspended",
  };
  return labels[status] ?? status;
};
