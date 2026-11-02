import type { WeekRange } from "../types";
import { isPastDateYmd, localDateYmd } from "@/utils/date";

export const WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function startOfWeek(date: Date, weekStartsOnMonday = true): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = weekStartsOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatWeekKey(date: Date): string {
  return startOfWeek(date).toISOString().slice(0, 10);
}

export function buildWeekRange(date: Date): WeekRange {
  const start = startOfWeek(date);
  const end = endOfWeek(start);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const year = start.getFullYear();
  const label = `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)} ${year}`;
  return { start, end, key: formatWeekKey(start), label };
}

export function shiftWeek(date: Date, deltaWeeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return d;
}

export function isDateInWeek(date: Date, week: WeekRange): boolean {
  const t = date.getTime();
  return t >= week.start.getTime() && t <= week.end.getTime();
}

export function datesForDayInWeek(dayName: string, week: WeekRange): Date | null {
  const idx = WORKING_DAYS.indexOf(dayName as (typeof WORKING_DAYS)[number]);
  if (idx < 0) return null;
  const d = new Date(week.start);
  d.setDate(d.getDate() + idx);
  return d;
}

export function dateYmdForDayInWeek(dayName: string, week: WeekRange): string | null {
  const d = datesForDayInWeek(dayName, week);
  return d ? localDateYmd(d) : null;
}

/** False when that weekday in the selected week is before today (date-specific edits). */
export function isWeekDayEditable(dayName: string, week: WeekRange, todayYmd = localDateYmd()): boolean {
  const ymd = dateYmdForDayInWeek(dayName, week);
  if (!ymd) return true;
  return !isPastDateYmd(ymd, todayYmd);
}
