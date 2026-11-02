export function localDateYmd(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalize API / ISO values for `<input type="date">` without UTC day-shift
 * (e.g. `2026-08-01T00:00:00` must stay 2026-08-01, not 2026-07-31 in IST).
 */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return localDateYmd(date);
}

/** True when the calendar day is strictly before today (local timezone). */
export function isPastDateYmd(ymd: string, todayYmd = localDateYmd()): boolean {
  return ymd.slice(0, 10) < todayYmd.slice(0, 10);
}

export function minTodayYmd(candidateYmd: string, todayYmd = localDateYmd()): string {
  const c = candidateYmd.slice(0, 10);
  const t = todayYmd.slice(0, 10);
  return c < t ? t : c;
}

export function parseYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftYmd(ymd: string, days: number): string {
  const date = parseYmd(ymd);
  date.setDate(date.getDate() + days);
  return localDateYmd(date);
}

/** Every calendar day from start through end (inclusive), as YYYY-MM-DD. */
export function eachYmdInRange(startYmd: string, endYmd: string): string[] {
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  if (start > end) return [];
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = shiftYmd(cur, 1);
  }
  return out;
}

/** First day of each month that overlaps [start, end]. */
export function monthsSpanningRange(startYmd: string, endYmd: string): Date[] {
  const start = parseYmd(startYmd.slice(0, 10));
  const end = parseYmd(endYmd.slice(0, 10));
  const months: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function isDateInRange(ymd: string, startYmd: string, endYmd: string): boolean {
  const date = ymd.slice(0, 10);
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  return date >= start && date <= end;
}

const SHORT_DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** e.g. 21 Sep 2026 (en-GB, matches admin schedule week labels). */
export function formatShortDate(ymd: string): string {
  const key = ymd.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return ymd;
  return parseYmd(key).toLocaleDateString("en-GB", SHORT_DATE_OPTS);
}

/** One date if same day; otherwise `start – end` with en-GB short dates. */
export function formatDateRange(startYmd: string, endYmd: string): string {
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  if (!start || !end) return "";
  if (start === end) return formatShortDate(start);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function formatDisplayDate(ymd: string): string {
  return parseYmd(ymd.slice(0, 10)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function localWeekdayName(date = new Date()): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function resolveWeekdayKey(days: string[], preferred = ""): string {
  const target = (preferred || localWeekdayName()).toLowerCase();
  const match = days.find((day) => day.toLowerCase() === target);
  return match ?? preferred ?? localWeekdayName();
}
