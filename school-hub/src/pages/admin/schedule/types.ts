import type { ScheduleEntry } from "@/models/staff.model";

export type ScheduleViewMode = "teacher" | "class" | "room";

export interface WeekRange {
  start: Date;
  end: Date;
  key: string;
  label: string;
}

export interface TimetableRow {
  key: string;
  periodCode: string;
  periodName: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  displayOrder: number;
  timeLabel: string;
  rangeLabel: string;
}

export interface EffectiveScheduleEntry extends ScheduleEntry {
  regularScheduleId?: string;
  isWeeklyOverride?: boolean;
  weekStart?: string;
  isLocked?: boolean;
}

export interface WeeklyOverrideEntry {
  staffId: string;
  day: string;
  time: string;
  subject: string;
  subjectId?: string;
  classId: string;
  className: string;
  room: string;
  teacherId: string;
  teacherName: string;
  weekStart: string;
}

export interface ScheduleConflict {
  type: "break" | "class" | "teacher" | "room" | "subject" | "unavailable" | "requirement";
  severity: "error" | "warning";
  message: string;
  day: string;
  time: string;
}

export interface ValidationSummary {
  valid: number;
  conflicts: ScheduleConflict[];
  warnings: ScheduleConflict[];
}

export interface ApplyTimetableDraft {
  sourceType: "class";
  sourceClassId: string;
  targetClassIds: string[];
  targetMode: "regular" | "week";
  teacherMapping: Record<string, string>;
  roomMode: "keep" | "manual" | "auto";
  roomMapping: Record<string, string>;
  autoMatchTeachers: boolean;
}

export type AutoGenerateScope = "regular" | "week";

export interface AutoGenerateSettings {
  scope: AutoGenerateScope;
  selectedGradeIds: string[];
  selectedClassIds: string[];
  workloadMode: "balanced" | "priority";
  subjectDistribution: "spread" | "compact";
  balanceTeacherWorkload: boolean;
  balanceFreePeriods: boolean;
  spreadSubjectsAcrossDays: boolean;
  avoidRepeatedSubjects: boolean;
  preserveLockedSchedules: boolean;
  avoidFirstLastRepetition: boolean;
  keepLabsConsecutive: boolean;
  preferPeAfternoon: boolean;
  preferDifficultEarlier: boolean;
  seed?: number;
}

export interface UnresolvedConflict {
  message: string;
  classId?: string;
  subjectName?: string;
}

export interface AutoGenerateQuality {
  overall: number;
  teacherBalance: number;
  subjectDistribution: number;
  roomUtilization: number;
  freePeriodBalance: number;
  requirementSatisfaction: number;
}

export interface AutoGenerateClassStat {
  classId: string;
  className: string;
  periodsGenerated: number;
}

export interface AutoGenerateStats {
  classes: number;
  classesGenerated: number;
  teachers: number;
  periodsGenerated: number;
  /** Hard validation errors (teacher/class/room double-booking) */
  conflicts: number;
  /** Subject hours that could not be fully placed */
  unresolved: number;
  perClass: AutoGenerateClassStat[];
}

export interface AutoGenerateResult {
  entries: ScheduleEntry[];
  preserved: ScheduleEntry[];
  unresolved: UnresolvedConflict[];
  quality: AutoGenerateQuality;
  validation: ValidationSummary;
  stats: AutoGenerateStats;
  checks: Array<{ label: string; ok: boolean }>;
  teacherWorkload: Array<{ teacherId: string; name: string; periods: number }>;
}
