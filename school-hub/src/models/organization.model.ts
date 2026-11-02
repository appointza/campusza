// Organization Model (Multi-tenant support)
export type OrganizationStatus = "active" | "inactive" | "suspended" | "trial";
export type SubscriptionPlan = "free" | "basic" | "premium" | "enterprise";

export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  logoUrl?: string;
  website?: string;
  type: "school" | "college" | "university" | "training_center" | "other";
  status: OrganizationStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  maxUsers: number;
  maxStudents: number;
  currentUsers: number;
  currentStudents: number;
  settings: OrganizationSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface OrganizationSettings {
  academicYear: string;
  termsPerYear: number;
  dateFormat: string; // e.g., "MM/DD/YYYY"
  timeFormat: "12h" | "24h";
  timezone: string;
  currency: string;
  language: string;
  allowStudentRegistration: boolean;
  allowParentPortal: boolean;
  attendanceAutoMark: boolean;
  gradeScaleId?: string;
  emailNotifications: {
    enabled: boolean;
    attendanceAlerts: boolean;
    gradeAlerts: boolean;
    feeReminders: boolean;
    generalAnnouncements: boolean;
  };
  smsNotifications: {
    enabled: boolean;
    attendanceAlerts: boolean;
    feeReminders: boolean;
  };
  features: {
    attendance: boolean;
    grades: boolean;
    fees: boolean;
    certificates: boolean;
    reports: boolean;
    schedule: boolean;
  };
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: "admin" | "staff";
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
  token: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  isActive: boolean;
}

// Helper functions
export const getOrganizationStatusColor = (status: OrganizationStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "suspended": return "bg-red-100 text-red-700";
    case "trial": return "bg-yellow-100 text-yellow-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getSubscriptionPlanLabel = (plan: SubscriptionPlan): string => {
  const labels: Record<SubscriptionPlan, string> = {
    free: "Free",
    basic: "Basic",
    premium: "Premium",
    enterprise: "Enterprise",
  };
  return labels[plan];
};

export const getOrganizationTypeLabel = (type: Organization["type"]): string => {
  const labels: Record<Organization["type"], string> = {
    school: "School",
    college: "College",
    university: "University",
    training_center: "Training Center",
    other: "Other",
  };
  return labels[type];
};

