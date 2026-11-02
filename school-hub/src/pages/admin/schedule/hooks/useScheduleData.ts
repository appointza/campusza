import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff.service";
import { classService } from "@/services/class.service";
import { referenceValueService } from "@/services/reference-value.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { staffLeaveService } from "@/services/staff-leave.service";
import { staffReplacementService } from "@/services/staff-replacement.service";
import { gradePeriodService } from "@/services/grade-period.service";
import { schoolRoomApi } from "@/services/school-room.service";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import type { Staff, StaffMember, StaffLeave, StaffReplacement, ScheduleEntry } from "@/models/staff.model";
import type { Class } from "@/models/class.model";
import type { GradePeriod } from "@/models/grade-period.model";
import { buildWeekRange } from "../utils/schedule-week";
import type { WeekRange } from "../types";
import { mapScheduleToEntry } from "../utils/schedule-mapper";
import { mergeScheduleForWeek } from "../utils/weekly-overrides";
import { buildReplacementsForWeek } from "../utils/schedule-replacements";
import type { EffectiveScheduleEntry } from "../types";

export function useScheduleData(weekRange: WeekRange, overrideVersion = 0) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [regularSchedule, setRegularSchedule] = useState<ScheduleEntry[]>([]);
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [replacements, setReplacements] = useState<StaffReplacement[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [classDetails, setClassDetails] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [gradePeriodsByGrade, setGradePeriodsByGrade] = useState<Record<string, GradePeriod[]>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [staff, classes, subjectRefs, periodRefs, schedules, leaveItems, replacementItems, allGradePeriods, schoolRooms] =
        await Promise.all([
          staffService.getAll(),
          classService.getAll(),
          referenceValueService.getByCategory(ReferenceValueCategory.SUBJECT),
          referenceValueService.getByCategory(ReferenceValueCategory.PERIOD),
          staffScheduleService.getAll(),
          staffLeaveService.getAll(),
          staffReplacementService.getAll(),
          gradePeriodService.getAll(),
          schoolRoomApi.select(true),
        ]);

      const roomRefs = schoolRooms
        .filter((r) => r.isActive !== false)
        .map(
          (r) =>
            ({
              id: r.id,
              name: r.name,
              code: r.name,
              category: ReferenceValueCategory.ROOM_NUMBER,
              displayorder: 0,
              status: "active",
            }) as ReferenceValue
        );

      const subjectRefList = getReferenceValuesByCategory(subjectRefs, ReferenceValueCategory.SUBJECT);
      const resolveSubjectName = (value?: string) =>
        resolveReferenceValueName(subjectRefList, ReferenceValueCategory.SUBJECT, value);

      const staffList: StaffMember[] = staff
        .filter((s: Staff) => s.status !== "inactive")
        .map((s: Staff) => ({
          id: s.id,
          name: s.fullName || `${s.firstName} ${s.lastName}`.trim(),
          department: s.department,
          email: s.email,
          phone: s.phone,
          subjects: (s.subjects || []).map((value) => resolveSubjectName(value)).filter(Boolean),
          status: s.status === "on_leave" ? "on_leave" : s.status === "inactive" ? "inactive" : "active",
        }));

      const classList = classes.map((c) => ({ id: c.id, name: c.name }));
      const byGrade: Record<string, GradePeriod[]> = {};
      for (const p of allGradePeriods) {
        if (!byGrade[p.gradeId]) byGrade[p.gradeId] = [];
        byGrade[p.gradeId].push(p);
      }
      Object.keys(byGrade).forEach((g) => {
        byGrade[g].sort((a, b) => a.displayOrder - b.displayOrder);
      });

      setStaffMembers(staffList);
      setClassOptions(classList);
      setClassDetails(classes);
      setReferenceValues([...subjectRefs, ...roomRefs, ...periodRefs]);
      const roomLookup = roomRefs.map((r) => ({ id: r.id, name: r.name }));
      setRegularSchedule(schedules.map((s, index) => mapScheduleToEntry(s, index, roomLookup)));
      setLeaves(leaveItems);
      setReplacements(replacementItems);
      setGradePeriodsByGrade(byGrade);
    } catch {
      toast({
        title: "Unable to load timetable",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const replacementsForWeek = useMemo(
    () => buildReplacementsForWeek(replacements, weekRange),
    [replacements, weekRange]
  );

  const replacementUiMap = useMemo(() => {
    const map = new Map<string, { replacementTeacher?: string; replacementTeacherId?: string }>();
    replacementsForWeek.forEach((rep, key) => {
      map.set(key, {
        replacementTeacher: rep.replacementTeacherName,
        replacementTeacherId: rep.replacementTeacherId,
      });
    });
    return map;
  }, [replacementsForWeek]);

  const effectiveSchedule: EffectiveScheduleEntry[] = useMemo(
    () => mergeScheduleForWeek(regularSchedule, weekRange.key, weekRange, replacementUiMap),
    [regularSchedule, weekRange, replacementUiMap, overrideVersion]
  );

  const classGradeMap = useMemo(() => {
    const map: Record<string, string> = {};
    classDetails.forEach((c) => {
      if (c.id && c.grade) map[c.id] = c.grade;
    });
    return map;
  }, [classDetails]);

  return {
    loading,
    reload,
    regularSchedule,
    setRegularSchedule,
    effectiveSchedule,
    leaves,
    setLeaves,
    replacements,
    setReplacements,
    staffMembers,
    classOptions,
    classDetails,
    referenceValues,
    gradePeriodsByGrade,
    classGradeMap,
    replacementsForWeek,
  };
}

export function useWeekNavigation(initial = new Date()) {
  const [anchorDate, setAnchorDate] = useState(initial);
  const weekRange = useMemo(() => buildWeekRange(anchorDate), [anchorDate]);
  const goPrev = () => setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  const goNext = () => setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  const goThisWeek = () => setAnchorDate(new Date());
  return { weekRange, goPrev, goNext, goThisWeek };
}
