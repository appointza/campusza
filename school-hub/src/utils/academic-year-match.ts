import {
  ReferenceValueCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import type { Term } from "@/models/term.model";

/** Match stored year (id or label) to a selected academic-year reference id. */
export function academicYearsMatch(
  stored: string | undefined,
  selectedRefId: string,
  values: ReferenceValue[]
): boolean {
  const selected = resolveReferenceValueName(values, ReferenceValueCategory.ACADEMIC_YEAR, selectedRefId)
    .trim()
    .toLowerCase();
  if (!selected || !stored?.trim()) return false;
  const raw = stored.trim().toLowerCase();
  const resolved = resolveReferenceValueName(values, ReferenceValueCategory.ACADEMIC_YEAR, stored)
    .trim()
    .toLowerCase();
  return raw === selected || resolved === selected;
}

export function termMatchesAcademicYear(
  term: Term,
  academicYearRefId: string,
  values: ReferenceValue[]
): boolean {
  return academicYearsMatch(term.academicYear, academicYearRefId, values);
}

export function formatAcademicYearLabel(
  stored: string | undefined,
  values: ReferenceValue[]
): string {
  if (!stored?.trim()) return "—";
  return (
    resolveReferenceValueName(values, ReferenceValueCategory.ACADEMIC_YEAR, stored) || stored
  );
}
