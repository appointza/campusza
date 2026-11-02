// Term/Semester Model
export type TermStatus = "active" | "completed" | "upcoming" | "cancelled";

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  academicYear: string;
  organizationId: string;
  description?: string;
  holidays?: Holiday[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface Holiday {
  id: string;
  termId: string;
  name: string;
  date: string;
  type: "national" | "regional" | "institutional" | "other";
  isOptional: boolean;
  organizationId: string;
  isActive: boolean;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2024-25"
  startDate: string;
  endDate: string;
  terms: Term[];
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
export const getTermStatusColor = (status: TermStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "completed": return "bg-blue-100 text-blue-700";
    case "upcoming": return "bg-yellow-100 text-yellow-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getTermStatusLabel = (status: TermStatus): string => {
  const labels: Record<TermStatus, string> = {
    active: "Active",
    completed: "Completed",
    upcoming: "Upcoming",
    cancelled: "Cancelled",
  };
  return labels[status];
};

export const isTermActive = (term: Term): boolean => {
  if (term.status !== "active") return false;
  const today = new Date();
  const start = new Date(term.startDate);
  const end = new Date(term.endDate);
  return today >= start && today <= end;
};

