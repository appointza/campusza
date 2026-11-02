// Staff Schedule Types
export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveType = "sick" | "casual" | "personal" | "emergency" | "other";

export interface StaffMember {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  subjects: string[];
  status: "active" | "on_leave" | "inactive";
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
}

export interface ScheduleEntry {
  id: number;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  teacherId: string;
  class: string;
  room: string;
  color: string;
  replacementTeacher?: string;
  replacementTeacherId?: string;
  isReplacement?: boolean;
}

export interface StaffReplacement {
  id: string;
  scheduleId: number;
  originalTeacherId: string;
  originalTeacherName: string;
  replacementTeacherId: string;
  replacementTeacherName: string;
  date: string;
  reason: string;
  assignedBy: string;
  assignedDate: string;
}

// Helper functions
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

export const getStaffStatusColor = (status: StaffMember["status"]): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "on_leave": return "bg-yellow-100 text-yellow-700";
    case "inactive": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};
