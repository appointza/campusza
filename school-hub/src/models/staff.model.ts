// Staff Model
export type StaffStatus = "active" | "on_leave" | "inactive" | "suspended";
export type StaffRole = "teacher" | "administrator" | "counselor" | "coach" | "librarian" | "nurse" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveType = "sick" | "casual" | "personal" | "emergency" | "other";

export interface Staff {
  id: string;
  staffId: string; // Unique staff ID
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  department: string;
  role: StaffRole;
  subjects: string[]; // Subject IDs or names
  qualification?: string;
  experience?: number; // Years of experience
  joiningDate: string;
  status: StaffStatus;
  photoUrl?: string;
  photoAssetId?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  salary?: {
    amount: number;
    currency: string;
    paymentFrequency: "monthly" | "biweekly" | "weekly";
  };
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  generatedPassword?: string;
}

export interface StaffLeave {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedReason?: string;
  totalDays: number;
  organizationId: string;
  isActive: boolean;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  staffName: string;
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  startTime: string;
  endTime: string;
  subject: string;
  subjectId?: string;
  classId: string;
  className: string;
  room: string;
  isReplacement?: boolean;
  originalTeacherId?: string;
  originalTeacherName?: string;
  replacementTeacherId?: string;
  replacementTeacherName?: string;
  organizationId: string;
  isActive: boolean;
}

export interface StaffReplacement {
  id: string;
  scheduleId: string;
  originalTeacherId: string;
  originalTeacherName: string;
  replacementTeacherId: string;
  replacementTeacherName: string;
  subjectId?: string;
  subject?: string;
  date: string;
  reason: string;
  assignedBy: string;
  assignedDate: string;
  status: "active" | "completed" | "cancelled";
  organizationId: string;
  isActive: boolean;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  staffName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  termId: string;
  termName: string;
  assignedDate: string;
  assignedBy: string;
  status: "active" | "inactive";
  organizationId: string;
  isActive: boolean;
}

// Simplified staff member interface for admin UI
export interface AdminStaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: string;
}

// Simplified staff member interface for schedule UI
export interface StaffMember {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  subjects: string[];
  status: "active" | "on_leave" | "inactive";
}

// Schedule entry interface for UI display
export interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  subjectId?: string;
  teacher: string;
  teacherId: string;
  class: string;
  classId?: string;
  room: string;
  roomId?: string;
  color: string;
  replacementTeacher?: string;
  replacementTeacherId?: string;
  isReplacement?: boolean;
}

// Helper functions
export const getStaffStatusColor = (status: StaffStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "on_leave": return "bg-yellow-100 text-yellow-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "suspended": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getStaffStatusLabel = (status: StaffStatus): string => {
  const labels: Record<StaffStatus, string> = {
    active: "Active",
    on_leave: "On Leave",
    inactive: "Inactive",
    suspended: "Suspended",
  };
  return labels[status];
};

export const getStaffRoleLabel = (role: StaffRole): string => {
  const labels: Record<StaffRole, string> = {
    teacher: "Teacher",
    administrator: "Administrator",
    counselor: "Counselor",
    coach: "Coach",
    librarian: "Librarian",
    nurse: "Nurse",
    other: "Other",
  };
  return labels[role];
};

export const getLeaveStatusColor = (status: LeaveStatus): string => {
  switch (status) {
    case "approved": return "bg-green-100 text-green-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "rejected": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getLeaveTypeLabel = (type: LeaveType): string => {
  const labels: Record<LeaveType, string> = {
    sick: "Sick Leave",
    casual: "Casual Leave",
    personal: "Personal Leave",
    emergency: "Emergency Leave",
    other: "Other",
  };
  return labels[type];
};

// Helper function for simplified staff member status
export const getStaffMemberStatusColor = (status: StaffMember["status"]): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "on_leave": return "bg-yellow-100 text-yellow-700";
    case "inactive": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

