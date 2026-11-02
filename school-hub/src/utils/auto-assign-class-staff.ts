import type { Staff } from "@/models/staff.model";
import {
  ReferenceValueCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";

export type ClassTeacherAssignment = { teacherId: string; teacherName: string };

export function staffMatchesSubject(
  staff: Staff,
  subjectId: string,
  subjectName: string,
  subjectOptions: ReferenceValue[]
): boolean {
  const ids = staff.subjects || [];
  if (ids.length === 0) return true;
  return ids.some((value) => {
    if (value === subjectId) return true;
    const label = resolveReferenceValueName(subjectOptions, ReferenceValueCategory.SUBJECT, value);
    return label === subjectName;
  });
}

export function staffOptionsForSubject(
  activeStaff: Staff[],
  subjectOptions: ReferenceValue[],
  subjectId: string,
  subjectName: string
): Staff[] {
  const matched = activeStaff.filter((staff) =>
    staffMatchesSubject(staff, subjectId, subjectName, subjectOptions)
  );
  return matched.length > 0 ? matched : activeStaff;
}

function staffDisplayName(staff: Staff): string {
  return staff.fullName?.trim() || `${staff.firstName || ""} ${staff.lastName || ""}`.trim();
}

/**
 * Pick teachers per class/subject from staff who teach that subject (or any active staff as fallback).
 * Balances load across classes; prefers one teacher per subject per class; honors class homeroom when they match.
 */
export function autoAssignTeachersForGrade(params: {
  classes: { id: string; classTeacherId?: string }[];
  gradeSubjectIds: string[];
  subjectOptions: ReferenceValue[];
  activeStaff: Staff[];
  existing: Record<string, Record<string, ClassTeacherAssignment>>;
  replaceAll?: boolean;
}): Record<string, Record<string, ClassTeacherAssignment>> {
  const { classes, gradeSubjectIds, subjectOptions, activeStaff, existing, replaceAll = false } = params;
  const usage = new Map<string, number>();
  const next: Record<string, Record<string, ClassTeacherAssignment>> = {};

  const sortedClasses = [...classes].sort((a, b) => a.id.localeCompare(b.id));

  for (const cls of sortedClasses) {
    next[cls.id] = { ...(existing[cls.id] || {}) };
    const usedInClass = new Set<string>();

    for (const subjectId of gradeSubjectIds) {
      const prev = next[cls.id][subjectId];
      if (!replaceAll && prev?.teacherId) {
        usedInClass.add(prev.teacherId);
        usage.set(prev.teacherId, (usage.get(prev.teacherId) || 0) + 1);
        continue;
      }

      const ref = subjectOptions.find((s) => s.id === subjectId);
      const subjectName = ref?.name || subjectId;
      let candidates = staffOptionsForSubject(activeStaff, subjectOptions, subjectId, subjectName);

      const homeroomId = cls.classTeacherId?.trim();
      if (homeroomId && candidates.some((s) => s.id === homeroomId)) {
        const homeroom = candidates.find((s) => s.id === homeroomId)!;
        const others = candidates.filter((s) => s.id !== homeroomId);
        candidates = [homeroom, ...others];
      }

      const preferUnusedInClass = candidates.filter((s) => !usedInClass.has(s.id));
      const pool = preferUnusedInClass.length > 0 ? preferUnusedInClass : candidates;

      pool.sort((a, b) => {
        const ua = usage.get(a.id) || 0;
        const ub = usage.get(b.id) || 0;
        if (ua !== ub) return ua - ub;
        return staffDisplayName(a).localeCompare(staffDisplayName(b));
      });

      const pick = pool[0];
      if (!pick) {
        next[cls.id][subjectId] = { teacherId: "", teacherName: "" };
        continue;
      }

      next[cls.id][subjectId] = {
        teacherId: pick.id,
        teacherName: staffDisplayName(pick),
      };
      usedInClass.add(pick.id);
      usage.set(pick.id, (usage.get(pick.id) || 0) + 1);
    }
  }

  return next;
}
