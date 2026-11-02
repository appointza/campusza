import type { ScheduleEntry, StaffMember, StaffLeave } from "@/models/staff.model";
import type { ScheduleConflict, ValidationSummary, TimetableRow } from "../types";
import type { WeekRange } from "../types";
import { datesForDayInWeek } from "./schedule-week";

export function validateAssignment(
  candidate: Partial<ScheduleEntry> & { day: string; time: string; teacherId?: string; classId?: string; room?: string; subject?: string },
  allEntries: ScheduleEntry[],
  staffMembers: StaffMember[],
  leaves: StaffLeave[],
  week: WeekRange,
  excludeId?: string,
  breakTimes?: Set<string>
): ScheduleConflict[] {
  const issues: ScheduleConflict[] = [];
  const { day, time, teacherId, classId, room, subject } = candidate;

  if (breakTimes?.has(time)) {
    issues.push({
      type: "break",
      severity: "error",
      message: "Cannot assign a subject to a break/lunch period.",
      day,
      time,
    });
  }

  const others = allEntries.filter((e) => e.id !== excludeId && e.day === day && e.time === time);

  if (classId && others.some((e) => e.classId === classId)) {
    issues.push({
      type: "class",
      severity: "error",
      message: `Class already has a subject at ${day} ${time}.`,
      day,
      time,
    });
  }

  if (teacherId && others.some((e) => e.teacherId === teacherId)) {
    const existing = others.find((e) => e.teacherId === teacherId);
    issues.push({
      type: "teacher",
      severity: "error",
      message: `Teacher is already assigned: ${existing?.class} ${existing?.subject} at ${day} ${time}.`,
      day,
      time,
    });
  }

  if (room) {
    const roomKey = (candidate as { roomId?: string }).roomId || room;
    if (
      others.some((e) => {
        const otherKey = e.roomId || e.room;
        return otherKey && otherKey === roomKey;
      })
    ) {
      issues.push({
        type: "room",
        severity: "error",
        message: `Room is already occupied at ${day} ${time}.`,
        day,
        time,
      });
    }
  }

  if (teacherId && subject) {
    const teacher = staffMembers.find((s) => s.id === teacherId);
    const subjectId = (candidate as { subjectId?: string }).subjectId;
    const subjectMatch =
      !teacher ||
      teacher.subjects.length === 0 ||
      teacher.subjects.some(
        (s) =>
          s === subject ||
          s === subjectId ||
          s.toLowerCase() === subject.toLowerCase()
      );
    if (teacher && !subjectMatch) {
      issues.push({
        type: "subject",
        severity: "warning",
        message: `${teacher.name} is not listed for ${subject}.`,
        day,
        time,
      });
    }
  }

  if (teacherId) {
    const dayDate = datesForDayInWeek(day, week);
    if (dayDate) {
      const onLeave = leaves.some((l) => {
        if (l.staffId !== teacherId || l.status !== "approved") return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        end.setHours(23, 59, 59, 999);
        return dayDate >= start && dayDate <= end;
      });
      if (onLeave) {
        issues.push({
          type: "unavailable",
          severity: "warning",
          message: `Teacher is on approved leave on ${day}.`,
          day,
          time,
        });
      }
    }
  }

  return issues;
}

export function validateBulkAssignments(
  assignments: Array<Partial<ScheduleEntry> & { day: string; time: string }>,
  existing: ScheduleEntry[],
  staffMembers: StaffMember[],
  leaves: StaffLeave[],
  week: WeekRange,
  breakTimes?: Set<string>
): ValidationSummary {
  const combined = [...existing];
  const conflicts: ScheduleConflict[] = [];
  const warnings: ScheduleConflict[] = [];
  let valid = 0;

  for (const a of assignments) {
    const issues = validateAssignment(a, combined, staffMembers, leaves, week, undefined, breakTimes);
    const blocking = issues.filter((i) => i.severity === "error");
    const warn = issues.filter((i) => i.severity === "warning");
    if (blocking.length === 0) {
      valid += 1;
      combined.push(a as ScheduleEntry);
    }
    conflicts.push(...blocking);
    warnings.push(...warn);
  }

  return { valid, conflicts, warnings };
}

export function breakTimeSet(rows: TimetableRow[]): Set<string> {
  return new Set(rows.filter((r) => r.isBreak).map((r) => r.timeLabel));
}
