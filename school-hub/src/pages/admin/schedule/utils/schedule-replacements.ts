import type { ScheduleEntry, StaffLeave, StaffMember, StaffReplacement } from "@/models/staff.model";
import type { WeekRange } from "../types";
import { localDateYmd } from "@/utils/date";
import { datesForDayInWeek } from "./schedule-week";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";

export type AffectedScheduleItem = {
  schedule: ScheduleEntry;
  leave: StaffLeave;
  date: string;
};

export function replacementMapKey(scheduleId: string, dateYmd: string): string {
  return `${scheduleId}|${dateYmd.slice(0, 10)}`;
}

export function normalizeDateYmd(date: string): string {
  return date.slice(0, 10);
}

export function isDateInLeaveRange(dateYmd: string, leave: StaffLeave): boolean {
  if (leave.status !== "approved" || !leave.isActive) return false;
  const date = normalizeDateYmd(dateYmd);
  return date >= normalizeDateYmd(leave.startDate) && date <= normalizeDateYmd(leave.endDate);
}

export function getScheduleDateForWeek(scheduleDay: string, week: WeekRange): string | null {
  const dayDate = datesForDayInWeek(scheduleDay, week);
  return dayDate ? localDateYmd(dayDate) : null;
}

export function buildReplacementsForWeek(
  replacements: StaffReplacement[],
  week: WeekRange
): Map<string, StaffReplacement> {
  const map = new Map<string, StaffReplacement>();
  replacements.forEach((rep) => {
    if (!rep.isActive) return;
    const dateYmd = normalizeDateYmd(rep.date);
    const repDate = new Date(`${dateYmd}T00:00:00`);
    if (repDate >= week.start && repDate <= week.end) {
      map.set(replacementMapKey(rep.scheduleId, dateYmd), rep);
    }
  });
  return map;
}

export function isReplacementActive(rep: StaffReplacement): boolean {
  if (!rep.isActive) return false;
  const status = (rep.status || "active").trim().toLowerCase();
  return status === "active";
}

export function hasActiveReplacementForScheduleOnDate(
  scheduleId: string,
  dateYmd: string,
  replacements: StaffReplacement[]
): boolean {
  const d = normalizeDateYmd(dateYmd);
  return replacements.some(
    (r) => isReplacementActive(r) && r.scheduleId === scheduleId && normalizeDateYmd(r.date) === d
  );
}

/** True when this timetable row already has a substitute in the viewed week (incl. if date was changed in the dialog). */
export function hasActiveReplacementForScheduleSlot(
  scheduleId: string,
  slotDateYmd: string,
  replacements: StaffReplacement[],
  week: WeekRange
): boolean {
  if (hasActiveReplacementForScheduleOnDate(scheduleId, slotDateYmd, replacements)) return true;
  return replacements.some((r) => {
    if (!isReplacementActive(r) || r.scheduleId !== scheduleId) return false;
    const d = normalizeDateYmd(r.date);
    const repDate = new Date(`${d}T12:00:00`);
    return repDate >= week.start && repDate <= week.end;
  });
}

export function getReplacementForScheduleOnDate(
  scheduleId: string,
  dateYmd: string,
  replacements: StaffReplacement[]
): StaffReplacement | undefined {
  const d = normalizeDateYmd(dateYmd);
  return replacements.find(
    (r) => isReplacementActive(r) && r.scheduleId === scheduleId && normalizeDateYmd(r.date) === d
  );
}

export function getReplacementForScheduleOnDay(
  scheduleId: string,
  scheduleDay: string,
  week: WeekRange,
  replacementsForWeek: Map<string, StaffReplacement>
): StaffReplacement | undefined {
  const dateYmd = getScheduleDateForWeek(scheduleDay, week);
  if (!dateYmd) return undefined;
  return replacementsForWeek.get(replacementMapKey(scheduleId, dateYmd));
}

export function getSubjectRefsForStaffMember(
  staff: StaffMember | undefined,
  referenceValues: ReferenceValue[]
): ReferenceValue[] {
  if (!staff) return [];
  const all = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.SUBJECT);
  return all.filter((ref) => staffTeachesSubject(staff, ref.id, ref.name, referenceValues));
}

export function pickDefaultReplacementSubjectId(
  scheduledSubjectId: string,
  scheduledSubjectLabel: string,
  teacherSubjectRefs: ReferenceValue[]
): string {
  if (teacherSubjectRefs.length === 0) return "";
  const label = scheduledSubjectLabel.trim().toLowerCase();
  const match = teacherSubjectRefs.find(
    (r) =>
      r.id === scheduledSubjectId ||
      r.name.trim().toLowerCase() === label ||
      (scheduledSubjectId && r.id === scheduledSubjectId)
  );
  return match?.id ?? teacherSubjectRefs[0].id;
}

export function staffTeachesSubject(
  staff: StaffMember,
  subjectId: string,
  subjectName: string,
  referenceValues: ReferenceValue[]
): boolean {
  const canonical = new Set<string>();
  const add = (value?: string) => {
    if (!value?.trim()) return;
    const name =
      resolveReferenceValueName(referenceValues, ReferenceValueCategory.SUBJECT, value) || value;
    canonical.add(name.trim().toLowerCase());
  };
  add(subjectId);
  add(subjectName);
  return (staff.subjects || []).some((sub) => {
    const label = resolveReferenceValueName(referenceValues, ReferenceValueCategory.SUBJECT, sub) || sub;
    return canonical.has(label.trim().toLowerCase());
  });
}

export function isReplacementTeacherBusy(
  schedule: ScheduleEntry[],
  replacements: StaffReplacement[],
  targetScheduleId: string,
  replacementTeacherId: string,
  dateYmd: string
): boolean {
  const target = schedule.find((s) => s.id === targetScheduleId);
  if (!target) return false;

  const samePeriod = (a: ScheduleEntry, b: ScheduleEntry) =>
    a.day === b.day && a.time === b.time;

  const hasOwnClass = schedule.some(
    (s) =>
      s.teacherId === replacementTeacherId &&
      s.id !== targetScheduleId &&
      samePeriod(s, target)
  );
  if (hasOwnClass) return true;

  const date = dateYmd.slice(0, 10);
  return replacements.some((rep) => {
    if (!rep.isActive || rep.status !== "active") return false;
    if (rep.replacementTeacherId !== replacementTeacherId) return false;
    if (rep.date.slice(0, 10) !== date) return false;
    const other = schedule.find((s) => s.id === rep.scheduleId);
    return Boolean(other && samePeriod(other, target));
  });
}

export function getAffectedSchedulesForWeek(
  schedules: ScheduleEntry[],
  leaves: StaffLeave[],
  week: WeekRange,
  replacements: StaffReplacement[]
): AffectedScheduleItem[] {
  const out: AffectedScheduleItem[] = [];
  const approved = leaves.filter((leave) => leave.status === "approved" && leave.isActive);

  approved.forEach((leave) => {
    schedules.forEach((schedule) => {
      if (schedule.isReplacement) return;
      const dateYmd = getScheduleDateForWeek(schedule.day, week);
      if (!dateYmd) return;
      if (schedule.teacherId !== leave.staffId) return;
      if (!isDateInLeaveRange(dateYmd, leave)) return;
      if (hasActiveReplacementForScheduleSlot(schedule.id, dateYmd, replacements, week)) return;
      out.push({ schedule, leave, date: dateYmd });
    });
  });

  return out;
}
