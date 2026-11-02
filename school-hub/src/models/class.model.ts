// Class Model
export type ClassStatus = "active" | "inactive" | "archived";

export interface Class {
  id: string;
  name: string; // e.g., "Grade 10-A"
  grade: string; // e.g., "Grade 10"
  section: string; // e.g., "A"
  academicYear: string; // e.g., "2024-25"
  termId: string;
  capacity: number;
  currentEnrollment: number;
  room: string;
  classTeacherId: string;
  classTeacherName: string;
  assistantMentorId?: string;
  assistantMentorName?: string;
  subjects: ClassSubject[];
  schedule: ClassSchedule[];
  status: ClassStatus;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ClassSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
  isOptional: boolean;
  organizationId: string;
  isActive: boolean;
}

export interface ClassSchedule {
  id: string;
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  organizationId: string;
  isActive: boolean;
}

export interface ClassAssignment {
  id: string;
  classId: string;
  studentId: string;
  assignedDate: string;
  assignedBy: string;
  remarks?: string;
  organizationId: string;
  isActive: boolean;
}

// Helper functions
export const getClassStatusColor = (status: ClassStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "archived": return "bg-blue-100 text-blue-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getDayLabel = (day: ClassSchedule["day"]): string => {
  const labels: Record<ClassSchedule["day"], string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };
  return labels[day];
};

