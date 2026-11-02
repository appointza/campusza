// Certificate Model
export type CertificateType = 
  | "bonafide" 
  | "transfer" 
  | "course_completion" 
  | "id_card" 
  | "character" 
  | "migration"
  | "birth"
  | "conduct"
  | "study"
  | "other";
export type CertificateStatus = "issued" | "pending" | "not_required" | "rejected" | "cancelled";

export interface Certificate {
  id: string;
  certificateNo: string; // Unique certificate number
  studentId: string;
  studentName: string;
  termId: string;
  termName: string;
  academicYear: string;
  type: CertificateType;
  status: CertificateStatus;
  issuedDate?: string;
  issuedBy?: string;
  issuedByName?: string;
  validFrom?: string;
  validUntil?: string;
  remarks?: string;
  rejectionReason?: string;
  fileUrl?: string; // PDF or image URL
  templateId?: string; // Reference to certificate template
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: CertificateType;
  description?: string;
  templateContent: string; // HTML or template content
  fields: CertificateField[];
  organizationId?: string; // null for global templates
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateField {
  id: string;
  name: string;
  type: "text" | "date" | "number" | "signature" | "image";
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isRequired: boolean;
  defaultValue?: string;
}

export interface CertificateRequest {
  id: string;
  studentId: string;
  studentName: string;
  certificateType: CertificateType;
  reason: string;
  requestedDate: string;
  requestedBy: string; // Student or parent
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: string;
  rejectedReason?: string;
  certificateId?: string; // Once issued
  organizationId: string;
  isActive: boolean;
}

// Helper functions
export const getCertificateStatusColor = (status: CertificateStatus): string => {
  switch (status) {
    case "issued": return "bg-green-100 text-green-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "not_required": return "bg-gray-100 text-gray-700";
    case "rejected": return "bg-red-100 text-red-700";
    case "cancelled": return "bg-gray-200 text-gray-800";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getCertificateStatusLabel = (status: CertificateStatus): string => {
  const labels: Record<CertificateStatus, string> = {
    issued: "Issued",
    pending: "Pending",
    not_required: "Not Required",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };
  return labels[status];
};

export const getCertificateTypeLabel = (type: CertificateType): string => {
  const labels: Record<CertificateType, string> = {
    bonafide: "Bonafide Certificate",
    transfer: "Transfer Certificate",
    course_completion: "Course Completion Certificate",
    id_card: "ID Card",
    character: "Character Certificate",
    migration: "Migration Certificate",
    birth: "Birth Certificate",
    conduct: "Conduct Certificate",
    study: "Study Certificate",
    other: "Other Certificate",
  };
  return labels[type];
};

