// Subject Model
export type SubjectType = "core" | "elective" | "optional" | "extracurricular";
export type SubjectStatus = "active" | "inactive" | "archived";

export interface Subject {
  id: string;
  code: string; // Subject code, e.g., "MATH101"
  name: string;
  shortName?: string;
  description?: string;
  type: SubjectType;
  department: string;
  credits?: number;
  weeklyHours: number;
  prerequisites?: string[]; // Array of subject IDs
  status: SubjectStatus;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface SubjectAssignment {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  termId: string;
  termName: string;
  weeklyHours: number;
  assignedDate: string;
  assignedBy: string;
  status: "active" | "inactive";
  organizationId: string;
  isActive: boolean;
}

// Helper functions
export const getSubjectTypeLabel = (type: SubjectType): string => {
  const labels: Record<SubjectType, string> = {
    core: "Core Subject",
    elective: "Elective",
    optional: "Optional",
    extracurricular: "Extracurricular",
  };
  return labels[type];
};

export const getSubjectStatusColor = (status: SubjectStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "archived": return "bg-blue-100 text-blue-700";
    default: return "bg-muted text-muted-foreground";
  }
};

