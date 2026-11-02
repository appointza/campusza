// Grade/Assessment Model
export type AssessmentType = "quiz" | "assignment" | "midterm" | "final" | "project" | "participation" | "homework" | "other";
export type GradeStatus = "draft" | "published" | "archived";

export interface Assessment {
  id: string;
  name: string;
  type: AssessmentType;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  maxScore: number;
  weight: number; // Percentage weight in final grade
  dueDate?: string;
  assessmentDate: string;
  instructions?: string;
  createdBy: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status: GradeStatus;
}

export interface Grade {
  id: string;
  assessmentId: string;
  assessmentName: string;
  assessmentType: AssessmentType;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  termId: string;
  termName: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  remarks?: string;
  gradedBy: string;
  gradedAt: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradeBook {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  termId: string;
  termName: string;
  grades: Grade[];
  totalScore: number;
  maxTotalScore: number;
  finalPercentage: number;
  finalLetterGrade: string;
  gpa?: number;
  rank?: number;
  organizationId: string;
  isActive: boolean;
}

export interface GradeScale {
  id: string;
  name: string;
  scale: {
    min: number;
    max: number;
    letter: string;
    gpa: number;
    description?: string;
  }[];
  isDefault: boolean;
  organizationId: string;
  isActive: boolean;
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  academicYear: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    finalGrade: number;
    letterGrade: string;
    gpa: number;
    rank: number;
  }[];
  overallGPA: number;
  overallRank: number;
  attendanceRate: number;
  remarks: string;
  issuedBy: string;
  issuedAt: string;
  status: "draft" | "published";
  organizationId: string;
  isActive: boolean;
}

// Helper functions
export const calculateLetterGrade = (
  percentage: number,
  scale?: GradeScale["scale"]
): string => {
  const defaultScale = [
    { min: 90, max: 100, letter: "A", gpa: 4.0 },
    { min: 80, max: 89, letter: "B", gpa: 3.0 },
    { min: 70, max: 79, letter: "C", gpa: 2.0 },
    { min: 60, max: 69, letter: "D", gpa: 1.0 },
    { min: 0, max: 59, letter: "F", gpa: 0.0 },
  ];

  const gradeScale = scale || defaultScale;
  const grade = gradeScale.find(
    (g) => percentage >= g.min && percentage <= g.max
  );
  return grade?.letter || "F";
};

export const calculateGPA = (
  percentage: number,
  scale?: GradeScale["scale"]
): number => {
  const defaultScale = [
    { min: 90, max: 100, letter: "A", gpa: 4.0 },
    { min: 80, max: 89, letter: "B", gpa: 3.0 },
    { min: 70, max: 79, letter: "C", gpa: 2.0 },
    { min: 60, max: 69, letter: "D", gpa: 1.0 },
    { min: 0, max: 59, letter: "F", gpa: 0.0 },
  ];

  const gradeScale = scale || defaultScale;
  const grade = gradeScale.find(
    (g) => percentage >= g.min && percentage <= g.max
  );
  return grade?.gpa || 0.0;
};

export const getAssessmentTypeLabel = (type: AssessmentType): string => {
  const labels: Record<AssessmentType, string> = {
    quiz: "Quiz",
    assignment: "Assignment",
    midterm: "Midterm Exam",
    final: "Final Exam",
    project: "Project",
    participation: "Participation",
    homework: "Homework",
    other: "Other",
  };
  return labels[type];
};

export const getGradeStatusColor = (status: GradeStatus): string => {
  switch (status) {
    case "draft": return "bg-yellow-100 text-yellow-700";
    case "published": return "bg-green-100 text-green-700";
    case "archived": return "bg-gray-100 text-gray-700";
    default: return "bg-muted text-muted-foreground";
  }
};

