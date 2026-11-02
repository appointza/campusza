import type { Term } from "@/models/term.model";

export type SchoolCalendarDayType = "open" | "closed" | "half_day" | "outside_term";

export type SchoolCalendarWeeklyRule = {
  id: string;
  termId: string;
  weekday: number;
  dayType: "closed" | "half_day";
  reason: string;
};

export type SchoolCalendarDayOverride = {
  id: string;
  termId: string;
  calendarDate: string;
  dayType: "closed" | "half_day" | "open";
  reason: string;
};

export type SchoolCalendarPage = {
  term: Term;
  weeklyRules: SchoolCalendarWeeklyRule[];
  dayOverrides: SchoolCalendarDayOverride[];
};

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function schoolCalendarDayTypeLabel(type: SchoolCalendarDayType): string {
  switch (type) {
    case "open":
      return "School open";
    case "closed":
      return "Leave / holiday";
    case "half_day":
      return "Half day";
    case "outside_term":
      return "Outside term";
  }
}
