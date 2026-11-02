export interface GradePeriod {
  id: string;
  organizationId: string;
  gradeId: string;
  gradeName: string;
  periodCode: string;
  periodName: string;
  /** "HH:mm:ss" or "HH:mm" */
  startTime: string;
  endTime: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Display label for timetable grid (e.g. "8:00 AM – 8:40 AM"). */
export function formatGradePeriodSlot(p: GradePeriod): string {
  return `${formatTimeLabel(p.startTime)} – ${formatTimeLabel(p.endTime)}`;
}

export function formatTimeLabel(time: string): string {
  if (!time) return "";
  const raw = String(time);
  // TimeSpan JSON may be "08:00:00" or "8:00:00"
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return raw;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

/** Convert "8:00 AM" or "08:00" / "08:00:00" to "HH:mm:ss" for API. */
export function toApiTime(value: string): string {
  if (!value) return "";
  const upper = value.trim().toUpperCase();
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
  if (hms) {
    return `${hms[1].padStart(2, "0")}:${hms[2]}:${hms[3] || "00"}`;
  }
  return value;
}
