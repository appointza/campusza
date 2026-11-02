import type { ScheduleEntry } from "@/models/staff.model";

export type SubjectWeekSummary = {
  subject: string;
  totalPerWeek: number;
  daysWithClass: number;
  byDay: Record<string, number>;
};

/** Count teaching slots per subject for a class timetable (one entry = one period). */
export function summarizeSubjectsByWeek(entries: ScheduleEntry[]): SubjectWeekSummary[] {
  const map = new Map<string, Record<string, number>>();

  for (const entry of entries) {
    const subject = (entry.subject || "").trim();
    if (!subject) continue;
    const byDay = map.get(subject) ?? {};
    byDay[entry.day] = (byDay[entry.day] ?? 0) + 1;
    map.set(subject, byDay);
  }

  return Array.from(map.entries())
    .map(([subject, byDay]) => {
      const totalPerWeek = Object.values(byDay).reduce((sum, n) => sum + n, 0);
      return {
        subject,
        totalPerWeek,
        daysWithClass: Object.keys(byDay).length,
        byDay,
      };
    })
    .sort((a, b) => b.totalPerWeek - a.totalPerWeek || a.subject.localeCompare(b.subject));
}

const WEEK_DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function formatSubjectDayBreakdown(
  byDay: Record<string, number>,
  dayShort: Record<string, string>
): string {
  return WEEK_DAY_ORDER
    .filter((day) => (byDay[day] ?? 0) > 0)
    .map((day) => `${dayShort[day] ?? day} ×${byDay[day]}`)
    .join(", ");
}
