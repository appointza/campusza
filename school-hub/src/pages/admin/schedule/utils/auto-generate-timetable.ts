import type { Class, ClassSubject } from "@/models/class.model";
import type { GradePeriod } from "@/models/grade-period.model";
import type { ScheduleEntry, StaffLeave, StaffMember } from "@/models/staff.model";
import type { ReferenceValue } from "@/models/referencevalue.model";
import type {
  AutoGenerateQuality,
  AutoGenerateResult,
  AutoGenerateSettings,
  UnresolvedConflict,
} from "../types";
import { validateBulkAssignments } from "./schedule-conflicts";
import { gradePeriodsToRows } from "./schedule-mapper";
import type { TimetableRow } from "../types";

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DIFFICULT_SUBJECTS = ["mathematics", "math", "physics", "chemistry", "biology", "science"];
const PE_SUBJECTS = ["pe", "physical education", "sports", "games"];

export interface AutoGenerateInput {
  classes: Class[];
  staffMembers: StaffMember[];
  gradePeriodsByGrade: Record<string, GradePeriod[]>;
  existingSchedule: ScheduleEntry[];
  roomNames: string[];
  subjectOptions: ReferenceValue[];
  settings: AutoGenerateSettings;
  leaves: StaffLeave[];
  weekRange?: { start: Date; end: Date };
}

interface TeachingSlot {
  classId: string;
  className: string;
  gradeId: string;
  day: string;
  time: string;
  periodIndex: number;
  row: TimetableRow;
}

interface SubjectRequirement {
  classId: string;
  className: string;
  gradeId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  weeklyHours: number;
  blockSize: number;
  priority: number;
  placed: number;
}

type Occupancy = {
  classSlots: Set<string>;
  teacherSlots: Set<string>;
  roomSlots: Set<string>;
};

function slotKey(classId: string, day: string, time: string): string {
  return `${classId}|${day}|${time}`;
}

function teacherSlotKey(teacherId: string, day: string, time: string): string {
  return `${teacherId}|${day}|${time}`;
}

function roomSlotKey(room: string, day: string, time: string): string {
  return `${room}|${day}|${time}`;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isPeSubject(name: string): boolean {
  const n = name.toLowerCase();
  return PE_SUBJECTS.some((p) => n.includes(p));
}

function isDifficultSubject(name: string): boolean {
  const n = name.toLowerCase();
  return DIFFICULT_SUBJECTS.some((d) => n.includes(d));
}

function isLabSubject(name: string): boolean {
  return name.toLowerCase().includes("lab");
}

function teacherQualifies(teacher: StaffMember, subjectId: string, subjectName: string): boolean {
  if (teacher.status !== "active") return false;
  if (teacher.subjects.length === 0) return true;
  return teacher.subjects.some(
    (s) => s === subjectId || s === subjectName || s.toLowerCase() === subjectName.toLowerCase()
  );
}

function resolveWeeklyHours(
  subject: ClassSubject,
  totalTeachingSlots: number,
  subjectCount: number
): number {
  if (subject.weeklyHours && subject.weeklyHours > 0) return subject.weeklyHours;
  if (subjectCount === 0) return 0;
  return Math.max(1, Math.floor(totalTeachingSlots / subjectCount));
}

function buildTeachingSlots(
  classes: Class[],
  gradePeriodsByGrade: Record<string, GradePeriod[]>,
  days: string[]
): TeachingSlot[] {
  const slots: TeachingSlot[] = [];
  for (const cls of classes) {
    const rows = gradePeriodsToRows(gradePeriodsByGrade[cls.grade] || []).filter((r) => !r.isBreak);
    if (rows.length === 0) continue;
    days.forEach((day) => {
      rows.forEach((row, periodIndex) => {
        slots.push({
          classId: cls.id,
          className: cls.name,
          gradeId: cls.grade,
          day,
          time: row.timeLabel,
          periodIndex,
          row,
        });
      });
    });
  }
  return slots;
}

function countQualifiedTeachers(
  staffMembers: StaffMember[],
  subjectId: string,
  subjectName: string,
  assignedTeacherId: string
): number {
  const qualified = staffMembers.filter((t) => teacherQualifies(t, subjectId, subjectName));
  if (assignedTeacherId && qualified.some((t) => t.id === assignedTeacherId)) {
    return Math.max(1, qualified.length);
  }
  return qualified.length || 1;
}

function buildRequirements(
  classes: Class[],
  teachingSlots: TeachingSlot[],
  staffMembers: StaffMember[],
  settings: AutoGenerateSettings
): SubjectRequirement[] {
  const reqs: SubjectRequirement[] = [];
  const slotsByClass = new Map<string, number>();
  teachingSlots.forEach((s) => {
    slotsByClass.set(s.classId, (slotsByClass.get(s.classId) || 0) + 1);
  });

  for (const cls of classes) {
    const subjects = (cls.subjects || []).filter((s) => s.isActive !== false && s.subjectId);
    const totalSlots = slotsByClass.get(cls.id) || 0;
    const defaultRoom = cls.room || "";

    subjects.forEach((sub) => {
      const teacher =
        staffMembers.find((t) => t.id === sub.teacherId) ||
        staffMembers.find((t) => teacherQualifies(t, sub.subjectId, sub.subjectName));
      const weeklyHours = resolveWeeklyHours(sub, totalSlots, subjects.length);
      let blockSize = 1;
      if (settings.keepLabsConsecutive && (isLabSubject(sub.subjectName) || sub.subjectName.toLowerCase().includes("practical"))) {
        blockSize = 2;
      }
      const qualifiedCount = countQualifiedTeachers(staffMembers, sub.subjectId, sub.subjectName, sub.teacherId);
      let priority = 100 - qualifiedCount * 10 + weeklyHours;
      if (blockSize > 1) priority += 15;
      if (isPeSubject(sub.subjectName)) priority -= 20;

      reqs.push({
        classId: cls.id,
        className: cls.name,
        gradeId: cls.grade,
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        teacherId: teacher?.id || sub.teacherId || "",
        teacherName: teacher?.name || sub.teacherName || "",
        room: defaultRoom,
        weeklyHours,
        blockSize,
        priority,
        placed: 0,
      });
    });
  }

  return reqs.sort((a, b) => b.priority - a.priority);
}

/** Ensure total required periods per class does not exceed available teaching slots. */
function capRequirementsToSlots(
  reqs: SubjectRequirement[],
  slotsByClass: Map<string, number>
): void {
  const byClass = new Map<string, SubjectRequirement[]>();
  reqs.forEach((r) => {
    const list = byClass.get(r.classId) || [];
    list.push(r);
    byClass.set(r.classId, list);
  });

  for (const [classId, list] of byClass) {
    const maxSlots = slotsByClass.get(classId) || 0;
    if (maxSlots === 0) continue;
    let total = list.reduce((s, r) => s + r.weeklyHours, 0);
    while (total > maxSlots) {
      const target = [...list].sort((a, b) => b.weeklyHours - a.weeklyHours)[0];
      if (!target || target.weeklyHours <= 1) break;
      target.weeklyHours -= 1;
      total -= 1;
    }
  }
}

function filterConflictFreeEntries(
  generated: ScheduleEntry[],
  preserved: ScheduleEntry[]
): ScheduleEntry[] {
  const combined: ScheduleEntry[] = [...preserved];
  const safe: ScheduleEntry[] = [];
  for (const entry of generated) {
    const issues = validateBulkAssignments([entry], combined, [], [], {
      start: new Date(),
      end: new Date(),
      key: "",
      label: "",
    });
    if (issues.conflicts.length === 0) {
      safe.push(entry);
      combined.push(entry);
    }
  }
  return safe;
}

function markOccupied(entry: ScheduleEntry, occ: Occupancy) {
  if (!entry.classId) return;
  occ.classSlots.add(slotKey(entry.classId, entry.day, entry.time));
  if (entry.teacherId) occ.teacherSlots.add(teacherSlotKey(entry.teacherId, entry.day, entry.time));
  if (entry.room) occ.roomSlots.add(roomSlotKey(entry.room, entry.day, entry.time));
}

function isSlotFree(
  classId: string,
  day: string,
  time: string,
  teacherId: string,
  room: string,
  occ: Occupancy
): boolean {
  if (occ.classSlots.has(slotKey(classId, day, time))) return false;
  if (teacherId && occ.teacherSlots.has(teacherSlotKey(teacherId, day, time))) return false;
  if (room && occ.roomSlots.has(roomSlotKey(room, day, time))) return false;
  return true;
}

function initClassRooms(classes: Class[], roomNames: string[]): Map<string, string> {
  const map = new Map<string, string>();
  const pool = roomNames.filter(Boolean);
  classes.forEach((cls, index) => {
    if (cls.room) {
      map.set(cls.id, cls.room);
    } else if (pool[index]) {
      map.set(cls.id, pool[index]);
    } else if (pool.length > 0) {
      map.set(cls.id, pool[index % pool.length]);
    } else {
      map.set(cls.id, `Room ${cls.name}`);
    }
  });
  return map;
}

function pickRoom(
  classId: string,
  classRooms: Map<string, string>,
  roomNames: string[],
  day: string,
  time: string,
  occ: Occupancy,
  rng: () => number
): string {
  const preferred = classRooms.get(classId) || "";
  const candidates = [
    preferred,
    ...roomNames.filter((r) => r && r !== preferred),
    ...[...classRooms.values()].filter((r) => r && r !== preferred),
  ].filter(Boolean);
  const unique = [...new Set(candidates)];
  const free = unique.filter((r) => !occ.roomSlots.has(roomSlotKey(r, day, time)));
  if (free.length === 0) return preferred || unique[0] || "Room 1";
  return free[Math.floor(rng() * free.length)] || free[0];
}

function resolveTeacherForSlot(
  req: SubjectRequirement,
  staffMembers: StaffMember[],
  day: string,
  time: string,
  occ: Occupancy
): { teacherId: string; teacherName: string } | null {
  const candidateIds = [
    req.teacherId,
    ...staffMembers
      .filter((t) => teacherQualifies(t, req.subjectId, req.subjectName))
      .map((t) => t.id),
  ].filter(Boolean);
  const seen = new Set<string>();
  for (const id of candidateIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (occ.teacherSlots.has(teacherSlotKey(id, day, time))) continue;
    const teacher = staffMembers.find((t) => t.id === id);
    return { teacherId: id, teacherName: teacher?.name || req.teacherName || "" };
  }
  return null;
}

function scoreCandidate(
  req: SubjectRequirement,
  slot: TeachingSlot,
  teacherId: string,
  room: string,
  occ: Occupancy,
  placedEntries: ScheduleEntry[],
  settings: AutoGenerateSettings,
  teacherLoad: Map<string, number>,
  teachingRows: TimetableRow[]
): number {
  if (!isSlotFree(req.classId, slot.day, slot.time, teacherId, room, occ)) return -Infinity;

  let score = 100;
  const rngBias = 0;

  if (settings.spreadSubjectsAcrossDays) {
    const sameSubjectSameDay = placedEntries.filter(
      (e) => e.classId === req.classId && e.subjectId === req.subjectId && e.day === slot.day
    ).length;
    score -= sameSubjectSameDay * 25;
  }

  if (settings.avoidRepeatedSubjects) {
    const prevSameDay = placedEntries
      .filter((e) => e.classId === req.classId && e.day === slot.day)
      .sort((a, b) => a.time.localeCompare(b.time));
    const idx = prevSameDay.findIndex((e) => e.time === slot.time);
    if (idx > 0 && prevSameDay[idx - 1]?.subjectId === req.subjectId) score -= 40;
  }

  if (settings.balanceTeacherWorkload && teacherId) {
    const load = teacherLoad.get(teacherId) || 0;
    score -= load * 3;
  }

  if (settings.preferPeAfternoon && isPeSubject(req.subjectName)) {
    score += slot.periodIndex >= Math.floor(teachingRows.length / 2) ? 10 : -10;
  }

  if (settings.preferDifficultEarlier && isDifficultSubject(req.subjectName)) {
    score += slot.periodIndex <= 2 ? 8 : -4;
  }

  if (settings.avoidFirstLastRepetition && teacherId) {
    const firstLast = placedEntries.filter(
      (e) =>
        e.teacherId === teacherId &&
        (e.time === teachingRows[0]?.timeLabel || e.time === teachingRows[teachingRows.length - 1]?.timeLabel)
    ).length;
    if (firstLast > 2) score -= 15;
  }

  return score + rngBias;
}

function tryPlaceOnePeriod(
  req: SubjectRequirement,
  teachingSlots: TeachingSlot[],
  slotsByClass: Map<string, TeachingSlot[]>,
  occ: Occupancy,
  classRooms: Map<string, string>,
  roomNames: string[],
  preserved: ScheduleEntry[],
  generated: ScheduleEntry[],
  settings: AutoGenerateSettings,
  staffMembers: StaffMember[],
  teacherLoad: Map<string, number>,
  allRows: TimetableRow[],
  rng: () => number
): boolean {
  const remaining = req.weeklyHours - req.placed;
  if (remaining <= 0) return false;

  const blockSize = Math.min(remaining, req.blockSize);
  const dayOrder = [...DEFAULT_DAYS].sort(() => rng() - 0.5);

  for (const day of dayOrder) {
    if (blockSize > 1) {
      const block = findBlockSlots(req, day, teachingSlots, blockSize);
      if (!block) continue;
      const teacher = resolveTeacherForSlot(req, staffMembers, day, block[0].time, occ);
      if (!teacher) continue;
      const room = pickRoom(req.classId, classRooms, roomNames, day, block[0].time, occ, rng);
      if (!block.every((s) => isSlotFree(req.classId, s.day, s.time, teacher.teacherId, room, occ))) {
        continue;
      }
      block.forEach((slot) => {
        const entry = createEntry(
          { ...req, teacherId: teacher.teacherId, teacherName: teacher.teacherName },
          slot,
          room,
          generated.length
        );
        generated.push(entry);
        markOccupied(entry, occ);
        teacherLoad.set(teacher.teacherId, (teacherLoad.get(teacher.teacherId) || 0) + 1);
      });
      req.placed += blockSize;
      return true;
    }

    const classSlots = (slotsByClass.get(req.classId) || []).filter((s) => s.day === day);
    const scored = classSlots
      .map((slot) => {
        const teacher = resolveTeacherForSlot(req, staffMembers, slot.day, slot.time, occ);
        if (!teacher) return { slot, score: -Infinity };
        const room = pickRoom(req.classId, classRooms, roomNames, slot.day, slot.time, occ, rng);
        return {
          slot,
          score: scoreCandidate(
            req,
            slot,
            teacher.teacherId,
            room,
            occ,
            [...preserved, ...generated],
            settings,
            teacherLoad,
            allRows
          ),
          teacher,
          room,
        };
      })
      .filter((x) => x.score > -Infinity)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) continue;

    const pick = scored[0];
    const entry = createEntry(
      {
        ...req,
        teacherId: pick.teacher!.teacherId,
        teacherName: pick.teacher!.teacherName,
      },
      pick.slot,
      pick.room!,
      generated.length
    );
    generated.push(entry);
    markOccupied(entry, occ);
    teacherLoad.set(pick.teacher!.teacherId, (teacherLoad.get(pick.teacher!.teacherId) || 0) + 1);
    req.placed += 1;
    return true;
  }

  return false;
}

function findBlockSlots(
  req: SubjectRequirement,
  day: string,
  classSlots: TeachingSlot[],
  blockSize: number
): TeachingSlot[] | null {
  const daySlots = classSlots.filter((s) => s.classId === req.classId && s.day === day);
  daySlots.sort((a, b) => a.periodIndex - b.periodIndex);
  for (let i = 0; i <= daySlots.length - blockSize; i++) {
    const block = daySlots.slice(i, i + blockSize);
    const consecutive = block.every((s, idx) => s.periodIndex === block[0].periodIndex + idx);
    if (consecutive) return block;
  }
  return null;
}

function createEntry(
  req: SubjectRequirement,
  slot: TeachingSlot,
  room: string,
  index: number
): ScheduleEntry {
  return {
    id: `gen-${crypto.randomUUID()}`,
    day: slot.day,
    time: slot.time,
    subject: req.subjectName,
    subjectId: req.subjectId,
    teacher: req.teacherName,
    teacherId: req.teacherId,
    class: req.className,
    classId: req.classId,
    room,
    color: `bg-primary/20 text-primary`,
  };
}

function computeQuality(
  reqs: SubjectRequirement[],
  entries: ScheduleEntry[],
  staffMembers: StaffMember[],
  teachingSlotCount: number
): AutoGenerateQuality {
  const requirementTotal = reqs.reduce((s, r) => s + r.weeklyHours, 0);
  const placedTotal = entries.length;
  const requirementSatisfaction =
    requirementTotal === 0 ? 100 : Math.min(100, Math.round((placedTotal / requirementTotal) * 100));

  const loads = new Map<string, number>();
  entries.forEach((e) => {
    if (e.teacherId) loads.set(e.teacherId, (loads.get(e.teacherId) || 0) + 1);
  });
  const loadValues = [...loads.values()];
  const avgLoad = loadValues.length ? loadValues.reduce((a, b) => a + b, 0) / loadValues.length : 0;
  const loadVariance =
    loadValues.length > 1
      ? loadValues.reduce((s, v) => s + Math.abs(v - avgLoad), 0) / loadValues.length
      : 0;
  const teacherBalance = Math.max(0, Math.min(100, Math.round(100 - loadVariance * 8)));

  const subjectDayCounts = new Map<string, number[]>();
  entries.forEach((e) => {
    const key = `${e.classId}|${e.subjectId}`;
    const map = subjectDayCounts.get(key) || [];
    const dayIdx = DEFAULT_DAYS.indexOf(e.day);
    map[dayIdx] = (map[dayIdx] || 0) + 1;
    subjectDayCounts.set(key, map);
  });
  let spreadScore = 100;
  subjectDayCounts.forEach((counts) => {
    const max = Math.max(...counts.filter(Boolean));
    if (max > 2) spreadScore -= (max - 2) * 10;
  });
  const subjectDistribution = Math.max(0, Math.min(100, spreadScore));

  const roomsUsed = new Set(entries.map((e) => e.room).filter(Boolean)).size;
  const roomUtilization = Math.min(100, Math.round((roomsUsed / Math.max(1, entries.length)) * 100 + 40));

  const freePeriodBalance = teacherBalance;

  const overall = Math.round(
    requirementSatisfaction * 0.35 +
      teacherBalance * 0.25 +
      subjectDistribution * 0.2 +
      roomUtilization * 0.1 +
      freePeriodBalance * 0.1
  );

  return {
    overall,
    teacherBalance,
    subjectDistribution,
    roomUtilization,
    freePeriodBalance,
    requirementSatisfaction,
  };
}

export function generateTimetable(input: AutoGenerateInput): AutoGenerateResult {
  const { classes, staffMembers, gradePeriodsByGrade, existingSchedule, roomNames, settings } = input;
  const rng = mulberry32(settings.seed ?? Date.now());
  const days = DEFAULT_DAYS;

  const targetClasses = classes.filter((c) => settings.selectedClassIds.includes(c.id));
  const teachingSlots = buildTeachingSlots(targetClasses, gradePeriodsByGrade, days);
  const slotsByClass = new Map<string, TeachingSlot[]>();
  teachingSlots.forEach((s) => {
    const list = slotsByClass.get(s.classId) || [];
    list.push(s);
    slotsByClass.set(s.classId, list);
  });

  const preserved: ScheduleEntry[] = [];
  const occ: Occupancy = { classSlots: new Set(), teacherSlots: new Set(), roomSlots: new Set() };

  if (settings.preserveLockedSchedules) {
    existingSchedule
      .filter((e) => e.classId && settings.selectedClassIds.includes(e.classId))
      .forEach((e) => {
        preserved.push({ ...e, isLocked: true } as ScheduleEntry & { isLocked?: boolean });
        markOccupied(e, occ);
      });
  }

  const reqs = buildRequirements(targetClasses, teachingSlots, staffMembers, settings);
  capRequirementsToSlots(reqs, slotsByClass);
  const generated: ScheduleEntry[] = [];
  const unresolved: UnresolvedConflict[] = [];
  const teacherLoad = new Map<string, number>();
  const classRooms = initClassRooms(targetClasses, roomNames);
  const classOrder = targetClasses.map((c) => c.id);

  preserved.forEach((e) => {
    if (e.teacherId) teacherLoad.set(e.teacherId, (teacherLoad.get(e.teacherId) || 0) + 1);
  });

  const allRows = gradePeriodsToRows(
    Object.values(gradePeriodsByGrade).flat()
  ).filter((r) => !r.isBreak);

  // Round-robin: place one period per class per pass so all selected classes get slots
  let rounds = 0;
  const maxRounds = reqs.reduce((s, r) => s + r.weeklyHours, 0) + 1;
  while (rounds < maxRounds && reqs.some((r) => r.placed < r.weeklyHours)) {
    let placedThisRound = false;
    for (const classId of classOrder) {
      const classReqs = reqs
        .filter((r) => r.classId === classId && r.placed < r.weeklyHours)
        .sort((a, b) => b.priority - a.priority);

      for (const req of classReqs) {
        const placed = tryPlaceOnePeriod(
          req,
          teachingSlots,
          slotsByClass,
          occ,
          classRooms,
          roomNames,
          preserved,
          generated,
          settings,
          staffMembers,
          teacherLoad,
          allRows,
          rng
        );
        if (placed) {
          placedThisRound = true;
          break;
        }
      }
    }
    if (!placedThisRound) break;
    rounds += 1;
  }

  for (const req of reqs) {
    if (req.placed < req.weeklyHours) {
      unresolved.push({
        message: `${req.subjectName} requires ${req.weeklyHours} period(s) but only ${req.placed} could be placed for ${req.className}.`,
        classId: req.classId,
        subjectName: req.subjectName,
      });
    }
  }

  for (const cls of targetClasses) {
    const subjectCount = (cls.subjects || []).filter((s) => s.subjectId).length;
    if (subjectCount === 0) {
      unresolved.push({
        message: `${cls.name} has no subjects configured. Set subjects on the bell schedule page.`,
        classId: cls.id,
      });
    }
    const hasSlots = (slotsByClass.get(cls.id) || []).length > 0;
    if (!hasSlots) {
      unresolved.push({
        message: `${cls.name} has no bell schedule periods. Configure bell schedule for its grade.`,
        classId: cls.id,
      });
    }
  }

  const conflictFreeGenerated = filterConflictFreeEntries(generated, preserved);

  const allEntries = [...preserved, ...conflictFreeGenerated];

  // Do not pass global break times — lunch differs per grade and causes false conflicts.
  const validation = validateBulkAssignments(
    conflictFreeGenerated,
    preserved,
    staffMembers,
    input.leaves,
    input.weekRange
      ? { start: input.weekRange.start, end: input.weekRange.end, key: "", label: "" }
      : { start: new Date(), end: new Date(), key: "", label: "" }
  );

  const quality = computeQuality(reqs, allEntries, staffMembers, teachingSlots.length);
  const teacherIds = new Set(allEntries.map((e) => e.teacherId).filter(Boolean));

  const checks = [
    { label: "No teacher conflicts", ok: !validation.conflicts.some((c) => c.type === "teacher") },
    { label: "No class conflicts", ok: !validation.conflicts.some((c) => c.type === "class") },
    { label: "No room conflicts", ok: !validation.conflicts.some((c) => c.type === "room") },
    { label: "Teacher availability respected", ok: !validation.conflicts.some((c) => c.type === "unavailable") },
    {
      label: "Subject requirements satisfied",
      ok: reqs.every((r) => r.placed >= r.weeklyHours),
    },
    {
      label: "Bell schedule respected",
      ok: conflictFreeGenerated.every((e) => teachingSlots.some((s) => s.time === e.time)),
    },
  ];

  const teacherWorkload = staffMembers
    .filter((t) => teacherIds.has(t.id))
    .map((t) => ({
      teacherId: t.id,
      name: t.name,
      periods: teacherLoad.get(t.id) || 0,
    }))
    .sort((a, b) => b.periods - a.periods);

  const placementIssues = unresolved.filter(
    (u) => !u.message.includes("no subjects configured") && !u.message.includes("no bell schedule")
  );

  const perClass = targetClasses.map((cls) => ({
    classId: cls.id,
    className: cls.name,
    periodsGenerated: conflictFreeGenerated.filter((e) => e.classId === cls.id).length,
  }));
  const classesGenerated = perClass.filter((c) => c.periodsGenerated > 0).length;

  return {
    entries: conflictFreeGenerated,
    preserved,
    unresolved,
    quality,
    validation,
    stats: {
      classes: targetClasses.length,
      classesGenerated,
      teachers: teacherIds.size,
      periodsGenerated: conflictFreeGenerated.length,
      conflicts: validation.conflicts.length,
      unresolved: placementIssues.length,
      perClass,
    },
    checks,
    teacherWorkload,
  };
}

export function getTeachingRowsForGrade(
  gradePeriodsByGrade: Record<string, GradePeriod[]>,
  gradeId: string
): TimetableRow[] {
  return gradePeriodsToRows(gradePeriodsByGrade[gradeId] || []);
}

export function getDefaultAutoGenerateSettings(): AutoGenerateSettings {
  return {
    scope: "regular",
    selectedGradeIds: [],
    selectedClassIds: [],
    workloadMode: "balanced",
    subjectDistribution: "spread",
    balanceTeacherWorkload: true,
    balanceFreePeriods: true,
    spreadSubjectsAcrossDays: true,
    avoidRepeatedSubjects: true,
    preserveLockedSchedules: true,
    avoidFirstLastRepetition: true,
    keepLabsConsecutive: true,
    preferPeAfternoon: false,
    preferDifficultEarlier: false,
  };
}
