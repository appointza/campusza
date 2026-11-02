// Attendance Model
export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "half_day";
export type AttendanceType = "student" | "staff";

export interface Attendance {
  id: string;
  type: AttendanceType;
  date: string;
  classId?: string; // For student attendance
  className?: string;
  studentId?: string; // For student attendance
  studentName?: string;
  staffId?: string; // For staff attendance
  staffName?: string;
  status: AttendanceStatus;
  checkInTime?: string; // For late arrivals
  checkOutTime?: string;
  remarks?: string;
  markedBy: string; // User who marked the attendance
  markedAt: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  className: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number; // Percentage
  markedBy: string;
  markedAt: string;
  organizationId: string;
  isActive: boolean;
}

export interface AttendanceSummary {
  studentId?: string;
  staffId?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface AttendanceRule {
  id: string;
  name: string;
  type: AttendanceType;
  lateThreshold: number; // Minutes after which it's considered late
  halfDayThreshold: number; // Minutes for half day
  excusedReasons: string[];
  autoMarkAbsent: boolean; // Auto mark absent if not marked
  autoMarkTime?: string; // Time to auto mark
  organizationId: string;
  isActive: boolean;
}

// Helper functions
export const getAttendanceStatusColor = (status: AttendanceStatus): string => {
  switch (status) {
    case "present": return "bg-green-100 text-green-700";
    case "absent": return "bg-red-100 text-red-700";
    case "late": return "bg-yellow-100 text-yellow-700";
    case "excused": return "bg-blue-100 text-blue-700";
    case "half_day": return "bg-orange-100 text-orange-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getAttendanceStatusLabel = (status: AttendanceStatus): string => {
  const labels: Record<AttendanceStatus, string> = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    excused: "Excused",
    half_day: "Half Day",
  };
  return labels[status];
};

export const calculateAttendanceRate = (
  present: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
};

