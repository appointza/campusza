import type { WeeklyOverrideEntry, EffectiveScheduleEntry, WeekRange } from "../types";
import type { ScheduleEntry } from "@/models/staff.model";
import { mapScheduleToEntry } from "./schedule-mapper";
import { getScheduleDateForWeek, replacementMapKey } from "./schedule-replacements";

const STORAGE_KEY = "campusza_weekly_schedule_overrides";

function loadAll(): Record<string, WeeklyOverrideEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, WeeklyOverrideEntry[]>;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, WeeklyOverrideEntry[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getOverridesForWeek(weekStart: string): WeeklyOverrideEntry[] {
  return loadAll()[weekStart] || [];
}

export function setOverridesForWeek(weekStart: string, entries: WeeklyOverrideEntry[]) {
  const all = loadAll();
  all[weekStart] = entries;
  saveAll(all);
}

export function mergeScheduleForWeek(
  regular: ScheduleEntry[],
  weekStart: string,
  week: WeekRange,
  weekReplacements: Map<string, { replacementTeacher?: string; replacementTeacherId?: string }>
): EffectiveScheduleEntry[] {
  const overrides = getOverridesForWeek(weekStart);
  const overrideByRegularId = new Map(
    overrides.filter((o) => o.regularScheduleId).map((o) => [o.regularScheduleId!, o])
  );
  const overrideBySlot = new Map(
    overrides
      .filter((o) => !o.regularScheduleId)
      .map((o) => [`${o.day}|${o.time}|${o.classId}`, o])
  );

  const result: EffectiveScheduleEntry[] = [];

  for (const entry of regular) {
    const ov =
      overrideByRegularId.get(entry.id) ||
      overrideBySlot.get(`${entry.day}|${entry.time}|${entry.classId}`);
    if (ov) {
      result.push({
        ...entry,
        id: ov.id,
        regularScheduleId: entry.id,
        teacherId: ov.staffId,
        teacher: ov.staffName,
        subject: ov.subject,
        subjectId: ov.subjectId,
        room: ov.room,
        roomId: ov.roomId,
        isWeeklyOverride: true,
        weekStart,
      });
    } else {
      result.push({ ...entry, regularScheduleId: entry.id });
    }

    const dateYmd = getScheduleDateForWeek(entry.day, week);
    const rep = dateYmd ? weekReplacements.get(replacementMapKey(entry.id, dateYmd)) : undefined;
    if (rep?.replacementTeacher) {
      const last = result[result.length - 1];
      last.replacementTeacher = rep.replacementTeacher;
      last.replacementTeacherId = rep.replacementTeacherId;
      last.isReplacement = true;
    }
  }

  const regularKeys = new Set(regular.map((e) => `${e.day}|${e.time}|${e.classId}`));
  for (const ov of overrides) {
    const key = `${ov.day}|${ov.time}|${ov.classId}`;
    if (!regularKeys.has(key) && !ov.regularScheduleId) {
      result.push({
        id: ov.id,
        day: ov.day,
        time: ov.time,
        subject: ov.subject,
        subjectId: ov.subjectId,
        teacher: ov.staffName,
        teacherId: ov.staffId,
        class: ov.className,
        classId: ov.classId,
        room: ov.room,
        roomId: ov.roomId,
        color: "bg-muted/40 text-foreground",
        isWeeklyOverride: true,
        weekStart,
      });
    }
  }

  return result;
}

export function copyWeekOverrides(fromWeek: string, toWeek: string, options: {
  copyAssignments: boolean;
  copyRooms: boolean;
}) {
  const source = getOverridesForWeek(fromWeek);
  if (source.length === 0) return false;
  const copied = source.map((o) => ({
    ...o,
    id: crypto.randomUUID(),
    weekStart: toWeek,
    room: options.copyRooms ? o.room : "",
  }));
  if (!options.copyAssignments) return false;
  setOverridesForWeek(toWeek, copied);
  return true;
}

export function createOverrideFromEntry(
  weekStart: string,
  entry: ScheduleEntry,
  patch: Partial<ScheduleEntry>
): WeeklyOverrideEntry {
  return {
    id: crypto.randomUUID(),
    weekStart,
    regularScheduleId: entry.regularScheduleId || entry.id,
    staffId: patch.teacherId || entry.teacherId,
    staffName: patch.teacher || entry.teacher,
    day: patch.day || entry.day,
    time: patch.time || entry.time,
    startTime: "",
    endTime: "",
    subject: patch.subject || entry.subject,
    subjectId: patch.subjectId || entry.subjectId,
    classId: patch.classId || entry.classId || "",
    className: patch.class || entry.class,
    room: patch.room || entry.room,
    roomId: patch.roomId || entry.roomId,
    isWeeklyOverride: true,
  };
}
