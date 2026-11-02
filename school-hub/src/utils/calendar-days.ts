import type { StaffLeave } from "@/models/staff.model";
import type { Term } from "@/models/term.model";
import { isDateInRange, localDateYmd, parseYmd } from "@/utils/date";

export type SchoolDayType = "open" | "weekend" | "outside_term";

export function getSchoolDayType(ymd: string, terms: Term[]): SchoolDayType {
  const activeTerms = terms.filter((term) => term.isActive && term.status === "active");
  if (activeTerms.length === 0) return "open";

  const inTerm = activeTerms.some((term) =>
    isDateInRange(ymd, term.startDate, term.endDate)
  );
  return inTerm ? "open" : "outside_term";
}

export function getSchoolDayLabel(type: SchoolDayType): string {
  switch (type) {
    case "open":
      return "School Open";
    case "weekend":
      return "Weekly Off";
    case "outside_term":
      return "Outside Term";
  }
}

export function getStaffLeavesForDate(ymd: string, leaves: StaffLeave[]): StaffLeave[] {
  return leaves.filter((leave) => {
    if (leave.status !== "approved" || !leave.isActive) return false;
    return isDateInRange(ymd, leave.startDate, leave.endDate);
  });
}

export function getDatesWithStaffLeaveInMonth(
  month: Date,
  leaves: StaffLeave[]
): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dates: Date[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const ymd = localDateYmd(new Date(year, monthIndex, day));
    if (getStaffLeavesForDate(ymd, leaves).length > 0) {
      dates.push(new Date(year, monthIndex, day));
    }
  }

  return dates;
}

export function getOpenDaysInMonth(month: Date, terms: Term[]): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dates: Date[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const ymd = localDateYmd(new Date(year, monthIndex, day));
    if (getSchoolDayType(ymd, terms) === "open") {
      dates.push(new Date(year, monthIndex, day));
    }
  }

  return dates;
}

export function getClosedDaysInMonth(month: Date, terms: Term[]): Date[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dates: Date[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const ymd = localDateYmd(new Date(year, monthIndex, day));
    if (getSchoolDayType(ymd, terms) !== "open") {
      dates.push(new Date(year, monthIndex, day));
    }
  }

  return dates;
}
