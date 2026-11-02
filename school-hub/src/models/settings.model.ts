// Settings Model
export type NotificationChannel = "email" | "sms" | "push" | "in_app";
export type ThemeMode = "light" | "dark" | "auto";
export type Language = "en" | "es" | "fr" | "de" | "zh" | "ja" | "hi" | "ar";

export interface ApplicationSettings {
  id: string;
  organizationId: string;
  
  // General Settings
  general: GeneralSettings;
  
  // Academic Settings
  academic: AcademicSettings;
  
  // Notification Settings
  notifications: NotificationSettings;
  
  // Appearance Settings
  appearance: AppearanceSettings;
  
  // Security Settings
  security: SecuritySettings;
  
  // Integration Settings
  integrations: IntegrationSettings;
  
  // Feature Flags
  features: FeatureSettings;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface GeneralSettings {
  organizationName: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  timezone: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  currency: string;
  language: Language;
  fiscalYearStart: string; // MM-DD format
  fiscalYearEnd: string; // MM-DD format
}

export interface AcademicSettings {
  academicYear: string;
  semesterType: "semester_1" | "semester_2" | "annual" | "quarterly" | "term_based";
  termsPerYear: number;
  currentTermId?: string;
  gradeScaleId?: string;
  attendanceRequired: boolean;
  attendanceThreshold: number; // Minimum attendance percentage
  autoPromoteStudents: boolean;
  promotionCriteria: {
    minAttendance: number;
    minGrade: number;
    requireAllSubjects: boolean;
  };
  allowLateEnrollment: boolean;
  maxLateEnrollmentDays: number;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  email: {
    enabled: boolean;
    smtpServer?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail?: string;
    fromName?: string;
  };
  sms: {
    enabled: boolean;
    provider?: string;
    apiKey?: string;
    senderId?: string;
  };
  preferences: {
    attendanceAlerts: boolean;
    gradeAlerts: boolean;
    feeReminders: boolean;
    deadlineReminders: boolean;
    generalAnnouncements: boolean;
    systemUpdates: boolean;
  };
  recipients: {
    attendanceAlerts: ("admin" | "staff" | "parent")[];
    gradeAlerts: ("admin" | "staff" | "parent" | "student")[];
    feeReminders: ("admin" | "parent")[];
    deadlineReminders: ("admin" | "staff")[];
  };
}

export interface AppearanceSettings {
  theme: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  showBranding: boolean;
  sidebarCollapsed: boolean;
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays?: number;
  };
  session: {
    timeoutMinutes: number;
    maxConcurrentSessions: number;
    requireIpValidation: boolean;
  };
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    method: "email" | "sms" | "app";
  };
  ipWhitelist: string[];
  allowedDomains: string[]; // For email-based registration
}

export interface IntegrationSettings {
  google: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    calendarSync: boolean;
  };
  microsoft: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    calendarSync: boolean;
  };
  paymentGateway: {
    enabled: boolean;
    provider?: "stripe" | "paypal" | "razorpay" | "other";
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
  };
  smsGateway: {
    enabled: boolean;
    provider?: string;
    apiKey?: string;
    apiSecret?: string;
  };
}

export interface FeatureSettings {
  attendance: {
    enabled: boolean;
    autoMark: boolean;
    allowBulkMark: boolean;
    requireReason: boolean;
  };
  grades: {
    enabled: boolean;
    allowDraft: boolean;
    requireApproval: boolean;
    allowStudentView: boolean;
  };
  fees: {
    enabled: boolean;
    allowOnlinePayment: boolean;
    allowInstallments: boolean;
    autoGenerateReceipts: boolean;
  };
  certificates: {
    enabled: boolean;
    allowStudentRequest: boolean;
    requireApproval: boolean;
    autoGenerate: boolean;
  };
  reports: {
    enabled: boolean;
    allowCustomReports: boolean;
    allowScheduledReports: boolean;
    retentionDays: number;
  };
  schedule: {
    enabled: boolean;
    allowReplacement: boolean;
    allowConflictCheck: boolean;
  };
  documents: {
    enabled: boolean;
    allowUpload: boolean;
    maxFileSize: number; // in MB
    allowedTypes: string[];
  };
}

// Reference Value Settings (for AdminSettings screen)
export interface ReferenceValueSettings {
  categories: ReferenceValueCategory[];
  allowCustomCategories: boolean;
  requireApproval: boolean;
  organizationId: string;
}

export type ReferenceValueCategory = 
  | "term_status"
  | "student_status"
  | "staff_status"
  | "attendance_status"
  | "fee_status"
  | "grade_scale"
  | "document_type"
  | "certificate_type"
  | "payment_mode"
  | "leave_type"
  | "other";

// System Configuration
export interface SystemConfig {
  id: string;
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  type: "string" | "number" | "boolean" | "json";
  description?: string;
  category: string;
  organizationId?: string; // null for global configs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
export const getLanguageLabel = (lang: Language): string => {
  const labels: Record<Language, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese",
    ja: "Japanese",
    hi: "Hindi",
    ar: "Arabic",
  };
  return labels[lang] || "English";
};

export const getThemeModeLabel = (mode: ThemeMode): string => {
  const labels: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
    auto: "Auto (System)",
  };
  return labels[mode];
};

export const getNotificationChannelLabel = (channel: NotificationChannel): string => {
  const labels: Record<NotificationChannel, string> = {
    email: "Email",
    sms: "SMS",
    push: "Push Notification",
    in_app: "In-App",
  };
  return labels[channel];
};

export const validatePassword = (
  password: string,
  policy: SecuritySettings["passwordPolicy"]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

