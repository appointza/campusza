import type { StaffSchedule } from "@/models/staff.model";
import type { GradePeriod } from "@/models/grade-period.model";
import { formatTimeLabel } from "@/models/grade-period.model";
import { isBreakPeriodCode } from "@/utils/generate-bell-schedule";
import type { ScheduleEntry } from "@/models/staff.model";
import type { TimetableRow, EffectiveScheduleEntry } from "../types";

export function toDisplayDay(day: string): string {
  if (!day) return "";
  return `${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()}`;
}

export function toApiDay(day: string): StaffSchedule["day"] {
  return day.toLowerCase() as StaffSchedule["day"];
}

export function toDisplayTime(time: string): string {
  if (!time) return "";
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

export function toApiTime(time: string): string {
  if (!time) return "";
  const upper = time.trim().toUpperCase();
  const ampm = upper.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    if (ampm[3] === "AM") {
      if (h === 12) h = 0;
    } else if (h !== 12) {
      h += 12;
    }
    return `${String(h).padStart(2, "0")}:${m}:00`;
  }
  const hms = upper.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hms) return `${hms[1].padStart(2, "0")}:${hms[2]}:${hms[3] || "00"}`;
  return time;
}

const COLORS = [
  "bg-primary/20 text-primary",
  "bg-secondary/20 text-secondary",
  "bg-cyan-500/20 text-cyan-700",
  "bg-emerald-500/20 text-emerald-700",
  "bg-amber-500/20 text-amber-700",
  "bg-indigo-500/20 text-indigo-700",
  "bg-pink-500/20 text-pink-700",
  "bg-violet-500/20 text-violet-700",
];

export function getColorForIndex(index: number): string {
  return COLORS[index % COLORS.length];
}

export function mapScheduleToEntry(
  scheduleItem: StaffSchedule,
  index: number,
  roomOptions: Array<{ id: string; name: string }> = []
): ScheduleEntry {
  const raw = (scheduleItem.room || "").trim();
  const byId = roomOptions.find((r) => r.id === raw);
  const byName = roomOptions.find((r) => r.name === raw);
  const roomId = byId?.id ?? byName?.id ?? raw;
  const roomDisplay = byId?.name ?? byName?.name ?? raw;

  return {
    id: scheduleItem.id,
    day: toDisplayDay(scheduleItem.day),
    time: toDisplayTime(scheduleItem.startTime),
    subject: scheduleItem.subject,
    subjectId: scheduleItem.subjectId || undefined,
    teacher: scheduleItem.staffName,
    teacherId: scheduleItem.staffId,
    class: scheduleItem.className,
    classId: scheduleItem.classId,
    room: roomDisplay,
    roomId,
    color: getColorForIndex(index),
    replacementTeacher: scheduleItem.replacementTeacherName || undefined,
    replacementTeacherId: scheduleItem.replacementTeacherId || undefined,
    isReplacement: scheduleItem.isReplacement || false,
  };
}

export function gradePeriodsToRows(periods: GradePeriod[]): TimetableRow[] {
  return [...periods]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((p) => ({
      key: `${p.periodCode}-${p.displayOrder}`,
      periodCode: p.periodCode,
      periodName: p.periodName,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak: isBreakPeriodCode(p.periodCode),
      displayOrder: p.displayOrder,
      timeLabel: formatTimeLabel(p.startTime),
      rangeLabel: `${formatTimeLabel(p.startTime)} – ${formatTimeLabel(p.endTime)}`,
    }));
}

/** Merge teacher assignments into a unified slot list keyed by start time. */
export function buildTeacherSlotRows(
  entries: EffectiveScheduleEntry[],
  gradePeriodsByGrade: Record<string, GradePeriod[]>,
  classGradeMap: Record<string, string>
): TimetableRow[] {
  const rowMap = new Map<string, TimetableRow>();

  const addPeriod = (p: GradePeriod) => {
    const timeLabel = formatTimeLabel(p.startTime);
    if (!rowMap.has(timeLabel)) {
      rowMap.set(timeLabel, {
        key: `${p.periodCode}-${p.displayOrder}-${timeLabel}`,
        periodCode: p.periodCode,
        periodName: p.periodName,
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak: isBreakPeriodCode(p.periodCode),
        displayOrder: p.displayOrder,
        timeLabel,
        rangeLabel: `${formatTimeLabel(p.startTime)} – ${formatTimeLabel(p.endTime)}`,
      });
    }
  };

  const classIds = [...new Set(entries.map((e) => e.classId).filter(Boolean))];
  for (const classId of classIds) {
    const gradeId = classGradeMap[classId || ""];
    const periods = gradeId ? gradePeriodsByGrade[gradeId] || [] : [];
    periods.forEach(addPeriod);
  }

  if (rowMap.size === 0) {
    const seen = new Set<string>();
    entries.forEach((e) => {
      if (!seen.has(e.time)) {
        seen.add(e.time);
        rowMap.set(e.time, {
          key: e.time,
          periodCode: "",
          periodName: e.time,
          startTime: toApiTime(e.time),
          endTime: "",
          isBreak: false,
          displayOrder: rowMap.size + 1,
          timeLabel: e.time,
          rangeLabel: e.time,
        });
      }
    });
  }

  return [...rowMap.values()].sort((a, b) => {
    const am = parseTimeMinutes(a.startTime);
    const bm = parseTimeMinutes(b.startTime);
    return am - bm || a.displayOrder - b.displayOrder;
  });
}

function parseTimeMinutes(time: string): number {
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function slotLabelFromRow(row: TimetableRow): string {
  return row.timeLabel;
}
