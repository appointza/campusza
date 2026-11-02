import type { GradePeriod } from "@/models/grade-period.model";
import { formatTimeLabel } from "@/models/grade-period.model";
import { toApiTime } from "./schedule-mapper";

export function resolvePeriodTimes(
  slotLabel: string,
  gradePeriods: GradePeriod[]
): { startTime: string; endTime: string } {
  const match = gradePeriods.find((p) => formatTimeLabel(p.startTime) === slotLabel);
  if (match) {
    const start = match.startTime.includes(":") && match.startTime.length <= 8 ? match.startTime : match.startTime;
    const end = match.endTime.includes(":") && match.endTime.length <= 8 ? match.endTime : match.endTime;
    return {
      startTime: start.length === 5 ? `${start}:00` : start,
      endTime: end.length === 5 ? `${end}:00` : end,
    };
  }
  return { startTime: toApiTime(slotLabel), endTime: toApiTime(slotLabel) };
}
