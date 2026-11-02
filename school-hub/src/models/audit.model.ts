// Audit Log Model
export type AuditAction = 
  | "create" 
  | "update" 
  | "delete" 
  | "view" 
  | "export" 
  | "login" 
  | "logout"
  | "approve"
  | "reject"
  | "assign"
  | "unassign"
  | "payment"
  | "issue"
  | "other";

export type AuditEntity = 
  | "student"
  | "staff"
  | "class"
  | "attendance"
  | "grade"
  | "fee"
  | "certificate"
  | "term"
  | "user"
  | "organization"
  | "report"
  | "other";

export type AuditRole = "admin" | "staff" | "student" | "parent" | "system";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName?: string; // Human-readable name
  performedBy: string;
  performedByName?: string;
  performedByRole: AuditRole;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  changes?: AuditChange[]; // For update actions
  organizationId: string;
  metadata?: Record<string, unknown>; // Additional context
}

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditFilter {
  action?: AuditAction[];
  entity?: AuditEntity[];
  performedBy?: string;
  performedByRole?: AuditRole[];
  startDate?: string;
  endDate?: string;
  organizationId: string;
}

export interface AuditSummary {
  totalActions: number;
  actionsByType: Record<AuditAction, number>;
  actionsByEntity: Record<AuditEntity, number>;
  actionsByRole: Record<AuditRole, number>;
  period: {
    startDate: string;
    endDate: string;
  };
}

// Helper functions
export const getAuditActionLabel = (action: AuditAction): string => {
  const labels: Record<AuditAction, string> = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    view: "Viewed",
    export: "Exported",
    login: "Logged In",
    logout: "Logged Out",
    approve: "Approved",
    reject: "Rejected",
    assign: "Assigned",
    unassign: "Unassigned",
    payment: "Payment Recorded",
    issue: "Issued",
    other: "Other Action",
  };
  return labels[action];
};

export const getAuditEntityLabel = (entity: AuditEntity): string => {
  const labels: Record<AuditEntity, string> = {
    student: "Student",
    staff: "Staff",
    class: "Class",
    attendance: "Attendance",
    grade: "Grade",
    fee: "Fee",
    certificate: "Certificate",
    term: "Term",
    user: "User",
    organization: "Organization",
    report: "Report",
    other: "Other",
  };
  return labels[entity];
};

export const getAuditRoleLabel = (role: AuditRole): string => {
  const labels: Record<AuditRole, string> = {
    admin: "Administrator",
    staff: "Staff Member",
    student: "Student",
    parent: "Parent",
    system: "System",
  };
  return labels[role];
};

