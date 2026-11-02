import type { ExamSession } from "@/models/exam.model";
import type { ReferenceValue } from "@/models/referencevalue.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
} from "@/models/referencevalue.model";

export type GradePlannerRow = {
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  sessionId?: string;
};

/** Normalize HTML time input (HH:MM) to API time (HH:MM:SS). */
export function toApiTime(t: string, fallback = "09:00:00"): string {
  const raw = (t || "").trim();
  if (!raw) return fallback;
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
  return fallback;
}

export function timeInputValue(t: string | undefined, fallback = "09:00"): string {
  if (!t) return fallback;
  const s = t.trim();
  if (s.length >= 5) return s.slice(0, 5);
  return fallback;
}

export function getGradeSubjectIds(grade: ReferenceValue | undefined): string[] {
  if (!grade?.metadata) return [];
  const raw = grade.metadata.subjectIds ?? grade.metadata.subjectids;
  if (!Array.isArray(raw)) return [];
  return raw.map((id) => String(id)).filter(Boolean);
}

export function classMatchesGrade(
  classGradeRefId: string,
  classGradeLabel: string,
  grade: ReferenceValue
): boolean {
  const gId = grade.id;
  const gCode = grade.code ?? "";
  const gName = grade.name ?? "";
  const raw = classGradeRefId.trim();
  const label = classGradeLabel.trim();
  if (!raw && !label) return false;
  return (
    (raw && (raw === gId || raw === gCode || raw === gName)) ||
    (label && (label === gName || label === gCode || label === gId))
  );
}

export function sameClassIdSet(a: string[], b: string[]): boolean {
  const sa = [...a].sort().join("\0");
  const sb = [...b].sort().join("\0");
  return sa === sb;
}

export function findSessionForGradeSubject(
  sessions: ExamSession[],
  subjectId: string,
  classIds: string[]
): ExamSession | undefined {
  return sessions.find(
    (s) =>
      s.subjectId === subjectId &&
      sameClassIdSet(s.classIds || [], classIds) &&
      (s.status === "Draft" || s.status === "Scheduled" || !s.status)
  );
}

export function buildGradePlannerRows(
  grade: ReferenceValue,
  referenceValues: ReferenceValue[],
  classIds: string[],
  sessions: ExamSession[]
): GradePlannerRow[] {
  const subjects = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.SUBJECT);
  const subjectIds = getGradeSubjectIds(grade);
  const orderedIds =
    subjectIds.length > 0
      ? subjectIds
      : subjects.map((s) => s.id);

  const byId = new Map(subjects.map((s) => [s.id, s]));

  return orderedIds.map((subjectId) => {
    const ref = byId.get(subjectId);
    const subjectName =
      ref?.name ??
      resolveReferenceValueName(referenceValues, ReferenceValueCategory.SUBJECT, subjectId) ??
      subjectId;
    const existing = findSessionForGradeSubject(sessions, subjectId, classIds);
    return {
      subjectId,
      subjectName,
      examDate: existing?.examDate?.slice(0, 10) ?? "",
      startTime: timeInputValue(existing?.startTime, "09:00"),
      endTime: timeInputValue(existing?.endTime, "10:00"),
      sessionId: existing?.id,
    };
  });
}

export function dateWithinSeries(dateYmd: string, startDate: string, endDate: string): boolean {
  if (!dateYmd) return false;
  const d = dateYmd.slice(0, 10);
  const start = startDate.slice(0, 10);
  const end = endDate.slice(0, 10);
  return d >= start && d <= end;
}
