// Report Model
export type ReportType = 
  | "attendance" 
  | "student_performance" 
  | "class_summary" 
  | "staff_report" 
  | "enrollment" 
  | "financial" 
  | "custom";
export type ReportFormat = "pdf" | "excel" | "csv" | "json";
export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  organizationId: string;
  generatedBy: string;
  generatedAt: string;
  status: ReportStatus;
  fileUrl?: string;
  fileSize?: number; // in bytes
  parameters: ReportParameters;
  filters: ReportFilters;
  errorMessage?: string;
  expiresAt?: string; // For temporary file storage
  isActive: boolean;
}

export interface ReportParameters {
  startDate?: string;
  endDate?: string;
  classId?: string;
  studentId?: string;
  staffId?: string;
  termId?: string;
  academicYear?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
}

export interface ReportFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  classes?: string[];
  students?: string[];
  staff?: string[];
  subjects?: string[];
  status?: string[];
}

export interface AttendanceReport extends Report {
  type: "attendance";
  data: {
    summary: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      attendanceRate: number;
    };
    dailyRecords: {
      date: string;
      status: "present" | "absent" | "late" | "excused";
    }[];
    byClass?: {
      classId: string;
      className: string;
      attendanceRate: number;
      totalStudents: number;
    }[];
  };
}

export interface StudentPerformanceReport extends Report {
  type: "student_performance";
  data: {
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    termId: string;
    termName: string;
    subjects: {
      subjectId: string;
      subjectName: string;
      finalGrade: number;
      letterGrade: string;
      gpa: number;
    }[];
    overallGPA: number;
    attendanceRate: number;
    rank: number;
  };
}

export interface FinancialReport extends Report {
  type: "financial";
  data: {
    summary: {
      totalFees: number;
      collectedFees: number;
      pendingFees: number;
      collectionRate: number;
    };
    byTerm: {
      termId: string;
      termName: string;
      totalFees: number;
      collectedFees: number;
      pendingFees: number;
    }[];
    byClass: {
      classId: string;
      className: string;
      totalFees: number;
      collectedFees: number;
      pendingFees: number;
    }[];
    paymentHistory: {
      date: string;
      amount: number;
      studentId: string;
      studentName: string;
      paymentMode: string;
    }[];
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  parameters: string[]; // Required parameters
  defaultFormat: ReportFormat;
  organizationId?: string; // null for global templates
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
export const getReportTypeLabel = (type: ReportType): string => {
  const labels: Record<ReportType, string> = {
    attendance: "Attendance Report",
    student_performance: "Student Performance Report",
    class_summary: "Class Summary Report",
    staff_report: "Staff Report",
    enrollment: "Enrollment Report",
    financial: "Financial Report",
    custom: "Custom Report",
  };
  return labels[type];
};

export const getReportStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "processing": return "bg-blue-100 text-blue-700";
    case "completed": return "bg-green-100 text-green-700";
    case "failed": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getReportFormatLabel = (format: ReportFormat): string => {
  const labels: Record<ReportFormat, string> = {
    pdf: "PDF",
    excel: "Excel",
    csv: "CSV",
    json: "JSON",
  };
  return labels[format];
};

