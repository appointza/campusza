import type {
  SchoolCalendarDayOverride,
  SchoolCalendarDayType,
  SchoolCalendarWeeklyRule,
} from "@/models/school-calendar.model";
import type { Term } from "@/models/term.model";
import { eachYmdInRange, isDateInRange, parseYmd } from "@/utils/date";

export type ResolvedSchoolDay = {
  type: SchoolCalendarDayType;
  reason?: string;
  source?: "default" | "weekly" | "override";
};

export function resolveSchoolCalendarDay(
  ymd: string,
  term: Term | null | undefined,
  weeklyRules: SchoolCalendarWeeklyRule[],
  dayOverrides: SchoolCalendarDayOverride[]
): ResolvedSchoolDay {
  if (!term || !term.startDate || !term.endDate) {
    return { type: "outside_term", source: "default" };
  }
  if (!isDateInRange(ymd, term.startDate, term.endDate)) {
    return { type: "outside_term", source: "default" };
  }

  const dateKey = ymd.slice(0, 10);
  const override = dayOverrides.find((o) => o.calendarDate.slice(0, 10) === dateKey);
  if (override) {
    if (override.dayType === "open") {
      return { type: "open", reason: override.reason, source: "override" };
    }
    return {
      type: override.dayType === "half_day" ? "half_day" : "closed",
      reason: override.reason,
      source: "override",
    };
  }

  const weekday = parseYmd(ymd).getDay();
  const rule = weeklyRules.find((r) => r.weekday === weekday);
  if (rule) {
    return {
      type: rule.dayType === "half_day" ? "half_day" : "closed",
      reason: rule.reason,
      source: "weekly",
    };
  }

  return { type: "open", source: "default" };
}

export type TermCalendarSummary = {
  totalDays: number;
  workingDays: number;
  leaveDays: number;
  halfDays: number;
};

export function computeTermCalendarSummary(
  term: Term,
  weeklyRules: SchoolCalendarWeeklyRule[],
  dayOverrides: SchoolCalendarDayOverride[]
): TermCalendarSummary {
  const start = term.startDate?.slice(0, 10) ?? "";
  const end = term.endDate?.slice(0, 10) ?? "";
  let workingDays = 0;
  let leaveDays = 0;
  let halfDays = 0;

  for (const ymd of eachYmdInRange(start, end)) {
    const resolved = resolveSchoolCalendarDay(ymd, term, weeklyRules, dayOverrides);
    if (resolved.type === "half_day") halfDays += 1;
    else if (resolved.type === "closed") leaveDays += 1;
    else if (resolved.type === "open") workingDays += 1;
  }

  return {
    totalDays: workingDays + leaveDays + halfDays,
    workingDays,
    leaveDays,
    halfDays,
  };
}
