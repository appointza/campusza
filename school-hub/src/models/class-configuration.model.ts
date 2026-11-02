// Class Configuration Model - For dynamic rules based on class and semester
export type DocumentType = 
  | "marksheet" 
  | "report_card" 
  | "transfer_certificate" 
  | "bonafide_certificate" 
  | "character_certificate"
  | "migration_certificate"
  | "id_card"
  | "other";

export type SemesterType = "semester_1" | "semester_2" | "annual" | "quarterly" | "term_based";

export interface MarksheetConfiguration {
  id: string;
  grade: string; // e.g., "Grade 9", "Grade 10", "All"
  classId?: string; // Optional: specific class, null for all classes in grade
  className?: string;
  semesterType: SemesterType;
  termId?: string; // For term-based systems
  termName?: string;
  isRequired: boolean; // Whether marksheet is required for this class/semester
  marksheetType: "semester_wise" | "annual" | "combined"; // How marksheet should be issued
  issueDate?: string; // When marksheet should be issued (relative to term end)
  autoGenerate: boolean; // Auto-generate marksheet when term ends
  templateId?: string; // Template to use for marksheet generation
  feeAmount?: number; // Fee for marksheet issuance (if any)
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export type DocumentAction = "collect" | "issue"; // collect = from student, issue = by school

export interface DocumentRequirement {
  id: string;
  grade: string; // e.g., "Grade 9", "Grade 10", "All"
  classId?: string; // Optional: specific class
  className?: string;
  semesterType: SemesterType;
  termId?: string;
  termName?: string;
  documentType: DocumentType;
  action: DocumentAction; // "collect" = collect from student, "issue" = issue by school
  isRequired: boolean;
  requiredAt: "admission" | "term_start" | "term_end" | "graduation" | "on_demand";
  assignedStaffId?: string; // Staff member responsible for this document
  assignedStaffName?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ClassFeeConfiguration {
  id: string;
  grade: string; // e.g., "Grade 9", "Grade 10", "All"
  classId?: string; // Optional: specific class
  className?: string;
  semesterType: SemesterType;
  termId?: string;
  termName?: string;
  feeStructures: FeeConfigurationItem[];
  totalAmount: number;
  currency: string;
  dueDate?: string; // Relative to term start/end
  paymentSchedule: "one_time" | "installments" | "monthly";
  numberOfInstallments?: number;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface FeeConfigurationItem {
  id: string;
  feeType: string; // e.g., "tuition", "registration", "library", etc.
  name: string;
  amount: number;
  isOptional: boolean;
  description?: string;
  dueDate?: string; // Relative to term start
}

// Helper functions
export const getSemesterTypeLabel = (type: SemesterType): string => {
  const labels: Record<SemesterType, string> = {
    semester_1: "Semester 1",
    semester_2: "Semester 2",
    annual: "Annual",
    quarterly: "Quarterly",
    term_based: "Term Based",
  };
  return labels[type];
};

export const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    marksheet: "Marksheet",
    report_card: "Report Card",
    transfer_certificate: "Transfer Certificate",
    bonafide_certificate: "Bonafide Certificate",
    character_certificate: "Character Certificate",
    migration_certificate: "Migration Certificate",
    id_card: "ID Card",
    other: "Other Document",
  };
  return labels[type];
};

export const getRequiredAtLabel = (requiredAt: DocumentRequirement["requiredAt"]): string => {
  const labels: Record<DocumentRequirement["requiredAt"], string> = {
    admission: "At Admission",
    term_start: "At Term Start",
    term_end: "At Term End",
    graduation: "At Graduation",
    on_demand: "On Demand",
  };
  return labels[requiredAt];
};

export const getDocumentActionLabel = (action: DocumentAction): string => {
  const labels: Record<DocumentAction, string> = {
    collect: "Collect from Student",
    issue: "Issue by School",
  };
  return labels[action];
};

export const getDocumentActionColor = (action: DocumentAction): string => {
  switch (action) {
    case "collect": return "bg-blue-100 text-blue-700";
    case "issue": return "bg-purple-100 text-purple-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getMarksheetTypeLabel = (type: MarksheetConfiguration["marksheetType"]): string => {
  const labels: Record<MarksheetConfiguration["marksheetType"], string> = {
    semester_wise: "Semester Wise",
    annual: "Annual",
    combined: "Combined",
  };
  return labels[type];
};

// Check if marksheet is required for a class/semester
export const isMarksheetRequired = (
  configurations: MarksheetConfiguration[],
  grade: string,
  semesterType: SemesterType,
  termId?: string,
  classId?: string
): boolean => {
  // First check for specific class configuration
  if (classId) {
    const classConfig = configurations.find(
      (c) => c.classId === classId && c.semesterType === semesterType && c.isActive
    );
    if (classConfig) return classConfig.isRequired;
  }

  // Then check for grade-level configuration
  const gradeConfig = configurations.find(
    (c) => 
      c.grade === grade && 
      c.classId === null && 
      c.semesterType === semesterType && 
      c.isActive
  );
  if (gradeConfig) return gradeConfig.isRequired;

  // Check for term-based configuration
  if (termId) {
    const termConfig = configurations.find(
      (c) => c.termId === termId && c.isActive
    );
    if (termConfig) return termConfig.isRequired;
  }

  // Default: not required
  return false;
};

// Get marksheet configuration for a class/semester
export const getMarksheetConfiguration = (
  configurations: MarksheetConfiguration[],
  grade: string,
  semesterType: SemesterType,
  termId?: string,
  classId?: string
): MarksheetConfiguration | null => {
  // Priority: class-specific > grade-level > term-based
  if (classId) {
    const classConfig = configurations.find(
      (c) => c.classId === classId && c.semesterType === semesterType && c.isActive
    );
    if (classConfig) return classConfig;
  }

  const gradeConfig = configurations.find(
    (c) => 
      c.grade === grade && 
      c.classId === null && 
      c.semesterType === semesterType && 
      c.isActive
  );
  if (gradeConfig) return gradeConfig;

  if (termId) {
    const termConfig = configurations.find(
      (c) => c.termId === termId && c.isActive
    );
    if (termConfig) return termConfig;
  }

  return null;
};

// Get fee configuration for a class/semester
export const getFeeConfiguration = (
  configurations: ClassFeeConfiguration[],
  grade: string,
  semesterType: SemesterType,
  termId?: string,
  classId?: string
): ClassFeeConfiguration | null => {
  // Priority: class-specific > grade-level > term-based
  if (classId) {
    const classConfig = configurations.find(
      (c) => c.classId === classId && c.semesterType === semesterType && c.isActive
    );
    if (classConfig) return classConfig;
  }

  const gradeConfig = configurations.find(
    (c) => 
      c.grade === grade && 
      c.classId === null && 
      c.semesterType === semesterType && 
      c.isActive
  );
  if (gradeConfig) return gradeConfig;

  if (termId) {
    const termConfig = configurations.find(
      (c) => c.termId === termId && c.isActive
    );
    if (termConfig) return termConfig;
  }

  return null;
};

// Get required documents for a class/semester
export const getRequiredDocuments = (
  requirements: DocumentRequirement[],
  grade: string,
  semesterType: SemesterType,
  termId?: string,
  classId?: string
): DocumentRequirement[] => {
  const documents: DocumentRequirement[] = [];

  // Check class-specific requirements
  if (classId) {
    const classReqs = requirements.filter(
      (r) => r.classId === classId && r.semesterType === semesterType && r.isRequired && r.isActive
    );
    documents.push(...classReqs);
  }

  // Check grade-level requirements
  const gradeReqs = requirements.filter(
    (r) => 
      r.grade === grade && 
      r.classId === null && 
      r.semesterType === semesterType && 
      r.isRequired && 
      r.isActive
  );
  documents.push(...gradeReqs);

  // Check term-based requirements
  if (termId) {
    const termReqs = requirements.filter(
      (r) => r.termId === termId && r.isRequired && r.isActive
    );
    documents.push(...termReqs);
  }

  // Remove duplicates
  return documents.filter((doc, index, self) => 
    index === self.findIndex((d) => d.id === doc.id)
  );
};

