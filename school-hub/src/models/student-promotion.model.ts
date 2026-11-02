export interface StudentAcademicHistory {
  id: string;
  organizationId: string;
  studentId: string;
  academicYear: string;
  grade: string;
  classId?: string;
  className?: string;
  section?: string;
  rollNumber?: number;
  // Performance data
  totalMarks?: number;
  percentage?: number;
  gpa?: number;
  gradeLetter?: string;
  // Status
  promotionStatus: "current" | "promoted" | "retained" | "transferred" | "dropped";
  promotionDate?: string;
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface StudentPromotion {
  id: string;
  organizationId: string;
  studentId: string;
  studentName: string;
  fromGrade: string;
  fromClassId?: string;
  fromClassName?: string;
  toGrade: string;
  toClassId?: string;
  toClassName?: string;
  academicYearFrom: string;
  academicYearTo: string;
  // Performance for promotion decision
  finalPercentage?: number;
  gpa?: number;
  // Decision
  promotionType: "promoted" | "retained" | "transferred" | "dropped";
  promotionDate: string;
  promotedBy: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}
