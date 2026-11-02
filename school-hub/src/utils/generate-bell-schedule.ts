/** One break inserted after a teaching period (1-based index). */
export type BellBreakRule = {
  id: string;
  afterPeriod: number;
  name: string;
  durationMinutes: number;
};

export type GenerateBellInput = {
  schoolStart: string; // "08:00" from time input
  numberOfPeriods: number;
  periodDurationMinutes: number;
};

export type GeneratedBellSlot = {
  periodCode: string;
  periodName: string;
  startTime: string;
  endTime: string;
  displayOrder: number;
  durationMinutes: number;
  isBreak: boolean;
};

function parseTimeToMinutes(time: string): number {
  const part = time.trim().split(":").map((x) => parseInt(x, 10));
  const h = part[0] ?? 0;
  const m = part[1] ?? 0;
  return h * 60 + m;
}

export function minutesToApiTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export function slotDurationMinutes(startTime: string, endTime: string): number {
  return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
}

/**
 * Build teaching periods + optional breaks from simple inputs.
 * Breaks are inserted immediately after the given teaching period number.
 */
export function generateBellSchedule(
  input: GenerateBellInput,
  breaks: BellBreakRule[]
): GeneratedBellSlot[] {
  const breaksByAfter = new Map(
    breaks
      .filter((b) => b.afterPeriod >= 1 && b.afterPeriod <= input.numberOfPeriods)
      .map((b) => [b.afterPeriod, b])
  );

  let cursor = parseTimeToMinutes(input.schoolStart);
  const slots: GeneratedBellSlot[] = [];
  let order = 1;

  for (let i = 1; i <= input.numberOfPeriods; i++) {
    const start = cursor;
    const end = start + input.periodDurationMinutes;
    slots.push({
      periodCode: `P${i}`,
      periodName: `Period ${i}`,
      startTime: minutesToApiTime(start),
      endTime: minutesToApiTime(end),
      displayOrder: order++,
      durationMinutes: input.periodDurationMinutes,
      isBreak: false,
    });
    cursor = end;

    const br = breaksByAfter.get(i);
    if (br && br.durationMinutes > 0) {
      const code =
        br.name
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_")
          .replace(/^_|_$/g, "") || "BREAK";
      const bStart = cursor;
      const bEnd = bStart + br.durationMinutes;
      slots.push({
        periodCode: code,
        periodName: br.name.trim() || "Break",
        startTime: minutesToApiTime(bStart),
        endTime: minutesToApiTime(bEnd),
        displayOrder: order++,
        durationMinutes: br.durationMinutes,
        isBreak: true,
      });
      cursor = bEnd;
    }
  }

  return slots;
}

export function newBreakRule(afterPeriod = 4): BellBreakRule {
  return {
    id: crypto.randomUUID(),
    afterPeriod,
    name: "Lunch",
    durationMinutes: 40,
  };
}

export function isTeachingPeriodCode(code: string): boolean {
  return /^P\d+$/i.test(code.trim());
}

export function isBreakPeriodCode(code: string): boolean {
  return !isTeachingPeriodCode(code);
}

function toTimeInputValue(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "08:00";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** Rebuild quick-setup fields from saved grade_periods (includes lunch/break rows). */
export function inferQuickSetupFromPeriods(
  periods: Array<{
    periodCode: string;
    periodName: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
  }>
): {
  schoolStart: string;
  numberOfPeriods: number;
  periodDuration: number;
  breaks: BellBreakRule[];
} | null {
  if (periods.length === 0) return null;

  const sorted = [...periods].sort((a, b) => a.displayOrder - b.displayOrder);
  const teaching = sorted.filter((p) => isTeachingPeriodCode(p.periodCode));
  if (teaching.length === 0) return null;

  const breakSlots = sorted.filter((p) => isBreakPeriodCode(p.periodCode));
  const schoolStart = toTimeInputValue(sorted[0].startTime);
  const periodDuration = Math.max(1, slotDurationMinutes(teaching[0].startTime, teaching[0].endTime));

  const breaks: BellBreakRule[] = breakSlots.map((slot) => {
    const teachingBefore = teaching.filter((t) => t.displayOrder < slot.displayOrder);
    const afterPeriod =
      teachingBefore.length > 0
        ? Math.max(...teachingBefore.map((t) => parseInt(t.periodCode.replace(/^P/i, ""), 10)))
        : 1;
    return {
      id: crypto.randomUUID(),
      afterPeriod,
      name: slot.periodName,
      durationMinutes: Math.max(1, slotDurationMinutes(slot.startTime, slot.endTime)),
    };
  });

  return {
    schoolStart,
    numberOfPeriods: teaching.length,
    periodDuration,
    breaks,
  };
}
