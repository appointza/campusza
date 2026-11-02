import {
  ReferenceValueCategory,
  getReferenceValueCategoryLabel,
  isReferenceCategoryManagedElsewhere,
  normalizeReferenceValueCategory,
} from "@/models/referencevalue.model";
import type { ReferenceValue } from "@/models/referencevalue.model";

export type OnboardingSuggestedValue = {
  code: string;
  name: string;
};

export type OnboardingCategorySpec = {
  category: ReferenceValueCategory;
  /** Clearer name shown in the setup wizard */
  label: string;
  required: boolean;
  why: string;
  suggestions: OnboardingSuggestedValue[];
};

function currentAcademicYearSuggestion(): OnboardingSuggestedValue[] {
  const now = new Date();
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const next = start + 1;
  return [
    { code: `${start}_${next}`, name: `${start}-${next}` },
    { code: `${next}_${next + 1}`, name: `${next}-${next + 1}` },
  ];
}

/** School-specific lookups the rest of the app needs. System-seeded lists (gender, attendance, etc.) are skipped. */
export const ONBOARDING_CATEGORIES: OnboardingCategorySpec[] = [
  {
    category: ReferenceValueCategory.ACADEMIC_YEAR,
    label: "Academic year",
    required: true,
    why: "Terms, classes, students, and promotions all pick an academic year.",
    suggestions: currentAcademicYearSuggestion(),
  },
  {
    category: ReferenceValueCategory.GRADE,
    label: "Grade",
    required: true,
    why: "Classes, class config, students, and promotions need grades.",
    suggestions: [
      { code: "LKG", name: "LKG" },
      { code: "UKG", name: "UKG" },
      ...Array.from({ length: 12 }, (_, i) => ({
        code: `G${i + 1}`,
        name: String(i + 1),
      })),
    ],
  },
  {
    category: ReferenceValueCategory.CLASS_SECTION,
    label: "Class section",
    required: true,
    why: "Each class is a grade + section (A, B, C, …).",
    suggestions: [
      { code: "A", name: "A" },
      { code: "B", name: "B" },
      { code: "C", name: "C" },
      { code: "D", name: "D" },
    ],
  },
  {
    category: ReferenceValueCategory.SUBJECT,
    label: "Subject",
    required: true,
    why: "Staff subjects and the timetable use this list.",
    suggestions: [
      { code: "ENG", name: "English" },
      { code: "MATH", name: "Mathematics" },
      { code: "SCI", name: "Science" },
      { code: "SOC", name: "Social Studies" },
      { code: "COMP", name: "Computer Science" },
      { code: "PE", name: "Physical Education" },
      { code: "ART", name: "Arts" },
    ],
  },
  {
    category: ReferenceValueCategory.DEPARTMENT,
    label: "Department",
    required: true,
    why: "Staff records and attendance grouping use departments.",
    suggestions: [
      { code: "ACAD", name: "Academic" },
      { code: "ADMIN", name: "Administration" },
      { code: "SCI", name: "Science" },
      { code: "MATH", name: "Mathematics" },
      { code: "ENG", name: "English" },
    ],
  },
  {
    category: ReferenceValueCategory.ASSESSMENT,
    label: "Exam / test types",
    required: true,
    why: "Pick which exam you are entering marks for (unit test, midterm, …).",
    suggestions: [
      { code: "FA1", name: "Formative 1" },
      { code: "FA2", name: "Formative 2" },
      { code: "SA1", name: "Summative 1" },
      { code: "SA2", name: "Summative 2" },
    ],
  },
  {
    category: ReferenceValueCategory.ASSESSMENT_COMPONENT,
    label: "Grade columns",
    required: true,
    why: "Columns on the mark sheet (theory, practical, internal) — reused for every exam.",
    suggestions: [
      { code: "THEORY", name: "Theory" },
      { code: "PRACTICAL", name: "Practical" },
      { code: "INTERNAL", name: "Internal" },
    ],
  },
  {
    category: ReferenceValueCategory.STAFF_ROLE,
    label: "Staff role",
    required: true,
    why: "Staff profiles need a role (teacher, principal, …).",
    suggestions: [
      { code: "TEACHER", name: "Teacher" },
      { code: "PRINCIPAL", name: "Principal" },
      { code: "ADMIN", name: "Administrator" },
      { code: "CLERK", name: "Clerk" },
    ],
  },
  {
    category: ReferenceValueCategory.LEAVE_TYPE,
    label: "Leave type",
    required: false,
    why: "Needed before staff can request leave.",
    suggestions: [
      { code: "CASUAL", name: "Casual Leave" },
      { code: "SICK", name: "Sick Leave" },
      { code: "EARNED", name: "Earned Leave" },
    ],
  },
];

export type OnboardingStatus = {
  complete: boolean;
  missingCategories: ReferenceValueCategory[];
  hasTerm: boolean;
  counts: Record<string, number>;
};

export function countByCategory(values: ReferenceValue[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const v of values) {
    const k = normalizeReferenceValueCategory(v.category);
    if (!k) continue;
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

export function getOnboardingStatus(values: ReferenceValue[], termCount: number): OnboardingStatus {
  const counts = countByCategory(values);
  const missingCategories = ONBOARDING_CATEGORIES.filter((c) => {
    if (!c.required) return false;
    return (counts[c.category] ?? 0) === 0;
  }).map((c) => c.category);

  const hasTerm = termCount > 0;
  return {
    complete: missingCategories.length === 0 && hasTerm,
    missingCategories,
    hasTerm,
    counts,
  };
}

export function categoryHasValues(counts: Record<string, number>, category: ReferenceValueCategory): boolean {
  return (counts[category] ?? 0) > 0;
}

export function onboardingCategoryLabel(category: ReferenceValueCategory): string {
  return ONBOARDING_CATEGORIES.find((c) => c.category === category)?.label
    ?? getReferenceValueCategoryLabel(category);
}

/** Lookup categories editable under Admin → Settings → References (excludes rooms/terms panels). */
export const SETTINGS_REFERENCES_LOOKUP_CATEGORIES: ReferenceValueCategory[] =
  ONBOARDING_CATEGORIES.map((c) => c.category);

const SETTINGS_REFERENCES_LOOKUP_SET = new Set(
  SETTINGS_REFERENCES_LOOKUP_CATEGORIES.map((c) => normalizeReferenceValueCategory(c))
);

export function isSettingsReferencesLookupCategory(category: string | undefined | null): boolean {
  const norm = normalizeReferenceValueCategory(category);
  if (!norm || isReferenceCategoryManagedElsewhere(norm)) return false;
  return SETTINGS_REFERENCES_LOOKUP_SET.has(norm);
}

export function toReferenceCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

export const ONBOARDING_DONE_KEY_PREFIX = "campusza_onboarding_done_";

export function onboardingDoneStorageKey(organizationId: string): string {
  return `${ONBOARDING_DONE_KEY_PREFIX}${organizationId || "org"}`;
}
