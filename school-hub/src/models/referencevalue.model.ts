// Reference Value Model - For lookup/reference data

// Reference Value Category Enum
export enum ReferenceValueCategory {
  DEPARTMENT = "department",
  SUBJECT = "subject",
  GRADE = "grade",
  CLASS_SECTION = "class_section",
  COUNTRY = "country",
  STATE = "state",
  CITY = "city",
  BLOOD_GROUP = "blood_group",
  GENDER = "gender",
  RELATIONSHIP = "relationship",
  STAFF_ROLE = "staff_role",
  LEAVE_TYPE = "leave_type",
  PAYMENT_MODE = "payment_mode",
  FEE_TYPE = "fee_type",
  CERTIFICATE_TYPE = "certificate_type",
  DOCUMENT_TYPE = "document_type",
  SEMESTER_TYPE = "semester_type",
  ACADEMIC_YEAR = "academic_year",
  ASSESSMENT = "assessment",
  ASSESSMENT_COMPONENT = "assessment_component",
  ASSESSMENT_TYPE = "assessment_type",
  ASSESSMENT_STATUS = "assessment_status",
  ATTENDANCE_STATUS = "attendance_status",
  STUDENT_STATUS = "student_status",
  STAFF_STATUS = "staff_status",
  TERM_STATUS = "term_status",
  FEE_STATUS = "fee_status",
  CERTIFICATE_STATUS = "certificate_status",
  GRADE_STATUS = "grade_status",
  REPORT_TYPE = "report_type",
  REPORT_FORMAT = "report_format",
  ORGANIZATION_TYPE = "organization_type",
  SUBSCRIPTION_PLAN = "subscription_plan",
  USER_ROLE = "user_role",
  USER_STATUS = "user_status",
  ROOM_NUMBER = "room_number",
  SUBJECT_TYPE = "subject_type",
  PERIOD = "period",
  OTHER = "other",
}

/** Legacy / mistaken DB values → canonical enum string (snake_case). */
const REFERENCE_CATEGORY_ALIASES: Record<string, ReferenceValueCategory | string> = {
  termstatus: ReferenceValueCategory.TERM_STATUS,
  term_status: ReferenceValueCategory.TERM_STATUS,
};

/**
 * Single canonical category string for API + UI grouping.
 * Fixes duplicates like `TERM_STATUS` vs `term_status` in `reference_values.category`.
 */
export function normalizeReferenceValueCategory(category: string | undefined | null): string {
  if (category == null || String(category).trim() === "") return "";
  const s = String(category).trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (REFERENCE_CATEGORY_ALIASES[s] as string | undefined) ?? s;
}

/** Managed on dedicated admin screens — hidden from Settings → References. */
const REFERENCE_MANAGED_ELSEWHERE: Record<
  string,
  { route: string; screenLabel: string; description: string }
> = {
  [ReferenceValueCategory.ROOM_NUMBER]: {
    route: "/admin/settings?tab=references&ref=rooms",
    screenLabel: "School rooms",
    description: "Class homerooms, timetable periods, and exam seating.",
  },
  [ReferenceValueCategory.TERM_STATUS]: {
    route: "/admin/settings?tab=references&ref=terms",
    screenLabel: "Academic terms",
    description: "Term names, dates, and status — not reference lookup rows.",
  },
};

/** Virtual sidebar ids on Settings → References (data lives on dedicated routes). */
export const REFERENCE_MANAGED_SIDEBAR_ID = {
  SCHOOL_ROOMS: "@managed/school_rooms",
  ACADEMIC_TERMS: "@managed/academic_terms",
} as const;

export type ReferenceManagedSidebarId =
  (typeof REFERENCE_MANAGED_SIDEBAR_ID)[keyof typeof REFERENCE_MANAGED_SIDEBAR_ID];

export const REFERENCE_MANAGED_SIDEBAR_ENTRIES: ReadonlyArray<{
  id: ReferenceManagedSidebarId;
  route: string;
  screenLabel: string;
  description: string;
}> = [
  {
    id: REFERENCE_MANAGED_SIDEBAR_ID.SCHOOL_ROOMS,
    route: "/admin/settings?tab=references&ref=rooms",
    screenLabel: "School rooms",
    description: "Class homerooms, timetable periods, and exam seating.",
  },
  {
    id: REFERENCE_MANAGED_SIDEBAR_ID.ACADEMIC_TERMS,
    route: "/admin/settings?tab=references&ref=terms",
    screenLabel: "Academic terms",
    description: "Term names, start/end dates, and status for each academic year.",
  },
];

/** @deprecated Use REFERENCE_MANAGED_SIDEBAR_ENTRIES */
export const REFERENCE_MANAGED_ON_OTHER_SCREENS = REFERENCE_MANAGED_SIDEBAR_ENTRIES.map(
  ({ id, route, screenLabel, description }) => ({
    category:
      id === REFERENCE_MANAGED_SIDEBAR_ID.SCHOOL_ROOMS
        ? ReferenceValueCategory.ROOM_NUMBER
        : ReferenceValueCategory.TERM_STATUS,
    route,
    screenLabel,
    description,
  })
);

export function isManagedSidebarReferenceCategory(category: string | undefined | null): boolean {
  return REFERENCE_MANAGED_SIDEBAR_ENTRIES.some((e) => e.id === category);
}

export function getManagedSidebarReferenceEntry(category: string | undefined | null) {
  return REFERENCE_MANAGED_SIDEBAR_ENTRIES.find((e) => e.id === category);
}

/** Label for References sidebar + header (reference category or managed entry). */
export function getReferenceSidebarCategoryLabel(category: string): string {
  const managed = getManagedSidebarReferenceEntry(category);
  if (managed) return managed.screenLabel;
  return getReferenceValueCategoryLabel(category);
}

export function getReferenceCategoryManagedElsewhere(
  category: string | undefined | null
): { route: string; screenLabel: string; description: string } | undefined {
  const norm = normalizeReferenceValueCategory(category);
  return REFERENCE_MANAGED_ELSEWHERE[norm];
}

export function isReferenceCategoryManagedElsewhere(category: string | undefined | null): boolean {
  const norm = normalizeReferenceValueCategory(category);
  return norm in REFERENCE_MANAGED_ELSEWHERE;
}

// Type alias for backward compatibility
export type ReferenceValueCategoryType = ReferenceValueCategory | string;

export type ReferenceValueStatus = "active" | "inactive" | "archived";

export interface ReferenceValue {
  id: string;
  category: ReferenceValueCategory | string; // Support both enum and string for flexibility
  code: string; // Unique code within category (e.g., "MATH" for subject)
  name: string; // Display name
  shortName?: string; // Abbreviated name
  description?: string;
  value?: string; // Additional value if needed
  displayOrder: number; // Order for display in dropdowns
  parentId?: string; // For hierarchical references (e.g., city -> state)
  metadata?: Record<string, unknown>; // Additional properties
  isSystem: boolean; // System-defined vs user-defined
  isDefault: boolean; // Default value for the category
  status: ReferenceValueStatus;
  organizationId?: string; // null for global/system values
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ReferenceValueGroup {
  id: string;
  category: ReferenceValueCategory | string;
  name: string;
  description?: string;
  values: ReferenceValue[];
  isSystem: boolean;
  organizationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Predefined reference value categories with their common values
export interface ReferenceValueTemplate {
  category: ReferenceValueCategory | string;
  name: string;
  description: string;
  defaultValues: Omit<ReferenceValue, "id" | "category" | "organizationId" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">[];
}

// Common reference value templates
export const referenceValueTemplates: ReferenceValueTemplate[] = [
  {
    category: ReferenceValueCategory.GENDER,
    name: "Gender",
    description: "Gender options",
    defaultValues: [
      { code: "MALE", name: "Male", displayOrder: 1, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "FEMALE", name: "Female", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "OTHER", name: "Other", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
  {
    category: ReferenceValueCategory.BLOOD_GROUP,
    name: "Blood Group",
    description: "Blood group types",
    defaultValues: [
      { code: "A+", name: "A+", displayOrder: 1, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "A-", name: "A-", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "B+", name: "B+", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "B-", name: "B-", displayOrder: 4, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "AB+", name: "AB+", displayOrder: 5, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "AB-", name: "AB-", displayOrder: 6, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "O+", name: "O+", displayOrder: 7, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "O-", name: "O-", displayOrder: 8, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
  {
    category: ReferenceValueCategory.RELATIONSHIP,
    name: "Relationship",
    description: "Family relationship types",
    defaultValues: [
      { code: "FATHER", name: "Father", displayOrder: 1, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "MOTHER", name: "Mother", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "GUARDIAN", name: "Guardian", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "SIBLING", name: "Sibling", displayOrder: 4, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "OTHER", name: "Other", displayOrder: 5, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
  {
    category: ReferenceValueCategory.PAYMENT_MODE,
    name: "Payment Mode",
    description: "Payment methods",
    defaultValues: [
      { code: "CASH", name: "Cash", displayOrder: 1, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "CARD", name: "Card", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "BANK_TRANSFER", name: "Bank Transfer", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "ONLINE", name: "Online Payment", displayOrder: 4, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "CHEQUE", name: "Cheque", displayOrder: 5, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
  {
    category: ReferenceValueCategory.STUDENT_STATUS,
    name: "Student Status",
    description: "Student status options",
    defaultValues: [
      { code: "ACTIVE", name: "Active", displayOrder: 1, isSystem: true, isDefault: true, status: "active", isActive: true },
      { code: "INACTIVE", name: "Inactive", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "GRADUATED", name: "Graduated", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "TRANSFERRED", name: "Transferred", displayOrder: 4, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "SUSPENDED", name: "Suspended", displayOrder: 5, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
  {
    category: ReferenceValueCategory.STAFF_STATUS,
    name: "Staff Status",
    description: "Staff status options",
    defaultValues: [
      { code: "ACTIVE", name: "Active", displayOrder: 1, isSystem: true, isDefault: true, status: "active", isActive: true },
      { code: "ON_LEAVE", name: "On Leave", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "INACTIVE", name: "Inactive", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "SUSPENDED", name: "Suspended", displayOrder: 4, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
  {
    category: ReferenceValueCategory.PERIOD,
    name: "Period / Time Slot",
    description: "Timetable periods (display time for schedule grid)",
    defaultValues: [
      { code: "P1", name: "8:00 AM", displayOrder: 1, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P2", name: "9:00 AM", displayOrder: 2, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P3", name: "10:00 AM", displayOrder: 3, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P4", name: "11:00 AM", displayOrder: 4, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P5", name: "12:00 PM", displayOrder: 5, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P6", name: "1:00 PM", displayOrder: 6, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P7", name: "2:00 PM", displayOrder: 7, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P8", name: "3:00 PM", displayOrder: 8, isSystem: true, isDefault: false, status: "active", isActive: true },
      { code: "P9", name: "4:00 PM", displayOrder: 9, isSystem: true, isDefault: false, status: "active", isActive: true },
    ],
  },
];

// Helper functions
export const getReferenceValueStatusColor = (status: ReferenceValueStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "archived": return "bg-blue-100 text-blue-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const getReferenceValueCategoryLabel = (category: ReferenceValueCategory | string): string => {
  const labels: Record<string, string> = {
    [ReferenceValueCategory.DEPARTMENT]: "Department",
    [ReferenceValueCategory.SUBJECT]: "Subject",
    [ReferenceValueCategory.GRADE]: "Grade",
    [ReferenceValueCategory.CLASS_SECTION]: "Class Section",
    [ReferenceValueCategory.COUNTRY]: "Country",
    [ReferenceValueCategory.STATE]: "State",
    [ReferenceValueCategory.CITY]: "City",
    [ReferenceValueCategory.BLOOD_GROUP]: "Blood Group",
    [ReferenceValueCategory.GENDER]: "Gender",
    [ReferenceValueCategory.RELATIONSHIP]: "Relationship",
    [ReferenceValueCategory.STAFF_ROLE]: "Staff Role",
    [ReferenceValueCategory.LEAVE_TYPE]: "Leave Type",
    [ReferenceValueCategory.PAYMENT_MODE]: "Payment Mode",
    [ReferenceValueCategory.FEE_TYPE]: "Fee Type",
    [ReferenceValueCategory.CERTIFICATE_TYPE]: "Certificate Type",
    [ReferenceValueCategory.DOCUMENT_TYPE]: "Document Type",
    [ReferenceValueCategory.SEMESTER_TYPE]: "Semester Type",
    [ReferenceValueCategory.ACADEMIC_YEAR]: "Academic Year",
    [ReferenceValueCategory.ASSESSMENT]: "Exam / test types",
    [ReferenceValueCategory.ASSESSMENT_COMPONENT]: "Grade columns",
    [ReferenceValueCategory.ASSESSMENT_TYPE]: "Assessment Type",
    [ReferenceValueCategory.ASSESSMENT_STATUS]: "Assessment Status",
    [ReferenceValueCategory.ATTENDANCE_STATUS]: "Attendance Status",
    [ReferenceValueCategory.STUDENT_STATUS]: "Student Status",
    [ReferenceValueCategory.STAFF_STATUS]: "Staff Status",
    [ReferenceValueCategory.TERM_STATUS]: "Term Status",
    [ReferenceValueCategory.FEE_STATUS]: "Fee Status",
    [ReferenceValueCategory.CERTIFICATE_STATUS]: "Certificate Status",
    [ReferenceValueCategory.GRADE_STATUS]: "Grade Status",
    [ReferenceValueCategory.REPORT_TYPE]: "Report Type",
    [ReferenceValueCategory.REPORT_FORMAT]: "Report Format",
    [ReferenceValueCategory.ORGANIZATION_TYPE]: "Organization Type",
    [ReferenceValueCategory.SUBSCRIPTION_PLAN]: "Subscription Plan",
    [ReferenceValueCategory.USER_ROLE]: "User Role",
    [ReferenceValueCategory.USER_STATUS]: "User Status",
    [ReferenceValueCategory.ROOM_NUMBER]: "Room Number",
    [ReferenceValueCategory.PERIOD]: "Period / Time Slot",
    [ReferenceValueCategory.OTHER]: "Other",
  };
  return labels[category] || category;
};

export const getReferenceValuesByCategory = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string
): ReferenceValue[] => {
  const want = normalizeReferenceValueCategory(category);
  return values
    .filter(
      (v) =>
        normalizeReferenceValueCategory(v.category) === want &&
        v.status === "active" &&
        v.isActive
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

const normalizeRefValue = (value?: string): string => (value || "").trim().toLowerCase();

export const resolveReferenceValue = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string,
  value?: string
): ReferenceValue | undefined => {
  if (!value) return undefined;
  const needle = normalizeRefValue(value);
  const want = normalizeReferenceValueCategory(category);
  return values.find((v) =>
    normalizeReferenceValueCategory(v.category) === want &&
    (v.id === value || normalizeRefValue(v.code) === needle || normalizeRefValue(v.name) === needle)
  );
};

export const resolveReferenceValueId = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string,
  value?: string
): string => {
  if (!value) return "";
  return resolveReferenceValue(values, category, value)?.id || value;
};

/** True when a class row's grade field matches the selected grade reference (id, code, or name). */
export function classMatchesGradeRef(
  classGrade: string | undefined,
  gradeId: string,
  gradeValues: ReferenceValue[]
): boolean {
  if (!gradeId || !classGrade?.trim() || gradeValues.length === 0) return false;
  if (classGrade === gradeId) return true;
  const classGradeId = resolveReferenceValueId(gradeValues, ReferenceValueCategory.GRADE, classGrade);
  if (classGradeId === gradeId) return true;
  const selectedName = resolveReferenceValueName(gradeValues, ReferenceValueCategory.GRADE, gradeId);
  if (selectedName && normalizeRefValue(classGrade) === normalizeRefValue(selectedName)) return true;
  return false;
}

export const resolveReferenceValueName = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string,
  value?: string
): string => {
  if (!value) return "";
  return resolveReferenceValue(values, category, value)?.name || value;
};

export const normalizeReferenceValueIds = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string,
  input: string[] = []
): string[] => {
  const normalized = input
    .map((item) => resolveReferenceValueId(values, category, item))
    .filter((item) => item);
  return Array.from(new Set(normalized));
};

export const getReferenceValueByCode = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string,
  code: string
): ReferenceValue | undefined => {
  return values.find((v) => v.category === category && v.code === code && v.status === "active" && v.isActive);
};

export const getDefaultReferenceValue = (
  values: ReferenceValue[],
  category: ReferenceValueCategory | string
): ReferenceValue | undefined => {
  const want = normalizeReferenceValueCategory(category);
  return values.find(
    (v) =>
      normalizeReferenceValueCategory(v.category) === want &&
      v.isDefault &&
      v.status === "active" &&
      v.isActive
  );
};

