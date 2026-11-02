import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Calendar, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { staffLeaveService } from "@/services/staff-leave.service";
import { staffReplacementService } from "@/services/staff-replacement.service";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
} from "@/models/referencevalue.model";
import {
  getSubjectRefsForStaffMember,
  staffTeachesSubject,
} from "./utils/schedule-replacements";
import type { ScheduleEntry, StaffLeave, StaffSchedule } from "@/models/staff.model";
import { useScheduleData, useWeekNavigation } from "./hooks/useScheduleData";
import { WeekSelectorBar } from "./components/WeekSelectorBar";
import { ViewSwitcher } from "./components/ViewSwitcher";
import { TeacherSidebar } from "./components/TeacherSidebar";
import { TeacherSummaryPanel } from "./components/TeacherSummaryPanel";
import { ScheduleTimetableGrid } from "./components/ScheduleTimetableGrid";
import {
  AddEditScheduleDialog,
  type ScheduleFormState,
} from "./components/AddEditScheduleDialog";
import { ApplyTimetableDialog } from "./components/ApplyTimetableDialog";
import { CopyWeekDialog } from "./components/CopyWeekDialog";
import { LeaveReplacementsPanel } from "./components/LeaveReplacementsPanel";
import type { ApplyTimetableDraft, EffectiveScheduleEntry, ScheduleViewMode, TimetableRow } from "./types";
import {
  buildTeacherSlotRows,
  gradePeriodsToRows,
  mapScheduleToEntry,
  toApiDay,
  toApiTime,
} from "./utils/schedule-mapper";
import { validateAssignment, breakTimeSet } from "./utils/schedule-conflicts";
import {
  copyWeekOverrides,
  createOverrideFromEntry,
  getOverridesForWeek,
  setOverridesForWeek,
} from "./utils/weekly-overrides";
import { WORKING_DAYS } from "./utils/schedule-week";
import {
  getAffectedSchedulesForWeek,
  isReplacementTeacherBusy,
} from "./utils/schedule-replacements";
import { describeApiError } from "@/utils/api-error";
import { formatDateRange } from "@/utils/date";
import { findOverlappingLeave } from "./utils/leave-overlap";
import { isPastDateYmd } from "@/utils/date";
import { resolvePeriodTimes } from "./utils/resolve-period-times";

export default function AdminSchedulePage() {
  const { toast } = useToast();
  const { weekRange, goPrev, goNext, goThisWeek } = useWeekNavigation();
  const [overrideVersion, setOverrideVersion] = useState(0);
  const bumpOverrides = () => setOverrideVersion((v) => v + 1);

  const {
    loading,
    reload,
    regularSchedule,
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
  } = useScheduleData(weekRange, overrideVersion);

  const [viewMode, setViewMode] = useState<ScheduleViewMode>("teacher");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [showLeavePanel, setShowLeavePanel] = useState(false);
  const [busy, setBusy] = useState(false);

  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EffectiveScheduleEntry | null>(null);
  const [form, setForm] = useState<ScheduleFormState>({
    classId: "",
    day: "",
    time: "",
    periodLabel: "",
    subject: "",
    teacherId: "",
    room: "",
  });

  const [applyOpen, setApplyOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  const subjectOptions = useMemo(() => {
    const refs = getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.SUBJECT);
    return refs;
  }, [referenceValues]);

  const roomOptions = useMemo(() => {
    return getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ROOM_NUMBER);
  }, [referenceValues]);

  const getRefName = (id: string, list: typeof subjectOptions) =>
    list.find((x) => x.id === id)?.name || id;

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase();
    return staffMembers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q))
    );
  }, [staffMembers, teacherSearch]);

  const periodCountByTeacher = useMemo(() => {
    const map: Record<string, number> = {};
    effectiveSchedule.forEach((s) => {
      map[s.teacherId] = (map[s.teacherId] || 0) + 1;
    });
    return map;
  }, [effectiveSchedule]);

  const daysByTeacher = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    effectiveSchedule.forEach((s) => {
      if (!map[s.teacherId]) map[s.teacherId] = new Set();
      map[s.teacherId].add(s.day);
    });
    const out: Record<string, number> = {};
    Object.entries(map).forEach(([k, v]) => {
      out[k] = v.size;
    });
    return out;
  }, [effectiveSchedule]);

  const selectedTeacher = staffMembers.find((t) => t.id === selectedTeacherId) || null;

  const teacherEntries = useMemo(
    () => effectiveSchedule.filter((s) => s.teacherId === selectedTeacherId),
    [effectiveSchedule, selectedTeacherId]
  );

  const classEntries = useMemo(
    () => effectiveSchedule.filter((s) => s.classId === selectedClassId),
    [effectiveSchedule, selectedClassId]
  );

  const roomEntries = useMemo(() => {
    if (!selectedRoomId) return [];
    return effectiveSchedule.filter(
      (s) => s.roomId === selectedRoomId || s.room === roomOptions.find((r) => r.id === selectedRoomId)?.name
    );
  }, [effectiveSchedule, selectedRoomId, roomOptions]);

  const teacherRows = useMemo(
    () => buildTeacherSlotRows(teacherEntries, gradePeriodsByGrade, classGradeMap),
    [teacherEntries, gradePeriodsByGrade, classGradeMap]
  );

  const classRows = useMemo(() => {
    const gradeId = classGradeMap[selectedClassId];
    const periods = gradeId ? gradePeriodsByGrade[gradeId] || [] : [];
    return gradePeriodsToRows(periods);
  }, [selectedClassId, classGradeMap, gradePeriodsByGrade]);

  const roomRows = useMemo(() => buildTeacherSlotRows(roomEntries, gradePeriodsByGrade, classGradeMap), [
    roomEntries,
    gradePeriodsByGrade,
    classGradeMap,
  ]);

  const teachingRowsForClass = useMemo(() => classRows.filter((r) => !r.isBreak), [classRows]);

  const teacherClassCount = useMemo(
    () => new Set(teacherEntries.map((e) => e.classId)).size,
    [teacherEntries]
  );

  const totalTeachingSlots = teacherRows.filter((r) => !r.isBreak).length * WORKING_DAYS.length;
  const freePeriods = Math.max(0, totalTeachingSlots - teacherEntries.length);

  const leavesForTeacherWeek = useMemo(() => {
    if (!selectedTeacherId) return [];
    return leaves.filter((l) => {
      if (l.staffId !== selectedTeacherId || l.status !== "approved") return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return end >= weekRange.start && start <= weekRange.end;
    });
  }, [leaves, selectedTeacherId, weekRange]);

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;

  const getAffectedSchedules = () =>
    getAffectedSchedulesForWeek(effectiveSchedule, leaves, weekRange, replacements);

  const getFreeReplacementTeachers = (
    excludeId: string,
    scheduleId: string,
    dateYmd: string
  ) =>
    staffMembers.filter(
      (s) =>
        s.id !== excludeId &&
        s.status === "active" &&
        !isReplacementTeacherBusy(regularSchedule, replacements, scheduleId, s.id, dateYmd)
    );

  const getTeacherSubjectOptions = (teacherId: string) => {
    const teacher = staffMembers.find((s) => s.id === teacherId);
    return getSubjectRefsForStaffMember(teacher, referenceValues).map((r) => ({
      id: r.id,
      name: r.name,
    }));
  };

  const openAdd = (day: string, row: TimetableRow, classId?: string) => {
    setEditEntry(null);
    setForm({
      classId: classId || selectedClassId || classOptions[0]?.id || "",
      day,
      time: row.timeLabel,
      periodLabel: `${row.periodName} — ${row.rangeLabel}`,
      subject: "",
      teacherId: selectedTeacherId || "",
      room: "",
    });
    setAddEditOpen(true);
  };

  const openEdit = (entry: EffectiveScheduleEntry) => {
    setEditEntry(entry);
    setForm({
      classId: entry.classId || "",
      day: entry.day,
      time: entry.time,
      periodLabel: entry.time,
      subject: entry.subjectId || entry.subject,
      teacherId: entry.teacherId,
      room: entry.roomId || roomOptions.find((r) => r.name === entry.room)?.id || entry.room,
    });
    setAddEditOpen(true);
  };

  const resolveTimesForForm = (timeLabel: string, classId: string) => {
    const gradeId = classGradeMap[classId];
    const periods = gradeId ? gradePeriodsByGrade[gradeId] || [] : [];
    return resolvePeriodTimes(timeLabel, periods);
  };

  const handleSaveSchedule = async () => {
    const subjectName = getRefName(form.subject, subjectOptions);
    const roomName = getRefName(form.room, roomOptions);
    const teacher = staffMembers.find((t) => t.id === form.teacherId);
    const className = classOptions.find((c) => c.id === form.classId)?.name || "";
    const rows = gradePeriodsToRows(gradePeriodsByGrade[classGradeMap[form.classId]] || []);
    const issues = validateAssignment(
      {
        day: form.day,
        time: form.time,
        teacherId: form.teacherId,
        classId: form.classId,
        room: form.room,
        roomId: form.room,
        subject: subjectName,
      },
      effectiveSchedule,
      staffMembers,
      leaves,
      weekRange,
      editEntry?.id,
      breakTimeSet(rows)
    );
    const blocking = issues.filter((i) => i.severity === "error");
    if (blocking.length > 0) {
      toast({ title: "Conflict detected", description: blocking[0].message, variant: "destructive" });
      return;
    }

    const times = resolveTimesForForm(form.time, form.classId);
    setBusy(true);
    try {
      if (editEntry?.isWeeklyOverride || (editEntry && weekRange.key !== "regular")) {
        const ov = createOverrideFromEntry(weekRange.key, editEntry, {
          day: form.day,
          time: form.time,
          subject: subjectName,
          subjectId: form.subject,
          teacherId: form.teacherId,
          teacher: teacher?.name,
          classId: form.classId,
          class: className,
          room: roomName,
          roomId: form.room,
        });
        const existing = getOverridesForWeek(weekRange.key);
        setOverridesForWeek(weekRange.key, [
          ...existing.filter((e) => e.id !== ov.id && e.regularScheduleId !== editEntry.regularScheduleId),
          ov,
        ]);
        bumpOverrides();
        toast({ title: "Schedule saved successfully" });
      } else {
        const payload: Partial<StaffSchedule> = {
          id: editEntry?.regularScheduleId || editEntry?.id,
          staffId: form.teacherId,
          staffName: teacher?.name || "",
          day: toApiDay(form.day),
          startTime: times.startTime,
          endTime: times.endTime,
          subject: subjectName,
          subjectId: form.subject,
          classId: form.classId,
          className,
          room: form.room,
          organizationId: classDetails.find((c) => c.id === form.classId)?.organizationId || "",
        };
        if (editEntry?.id) await staffScheduleService.update(payload);
        else await staffScheduleService.create(payload);
        toast({ title: "Schedule saved successfully" });
        await reload();
      }
      setAddEditOpen(false);
      setEditEntry(null);
    } catch {
      toast({
        title: "Unable to save schedule",
        description: "The timetable may have been changed by another user.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!editEntry) return;
    setBusy(true);
    try {
      if (editEntry.isWeeklyOverride) {
        const existing = getOverridesForWeek(weekRange.key);
        setOverridesForWeek(
          weekRange.key,
          existing.filter((e) => e.id !== editEntry.id)
        );
        bumpOverrides();
      } else {
        await staffScheduleService.delete(editEntry.regularScheduleId || editEntry.id);
        await reload();
      }
      toast({ title: "Schedule removed" });
      setAddEditOpen(false);
      setEditEntry(null);
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleApplyTimetable = async (
    draft: ApplyTimetableDraft,
    assignments: Partial<ScheduleEntry>[]
  ) => {
    setBusy(true);
    try {
      if (draft.targetMode === "regular") {
        for (const a of assignments) {
          const times = resolveTimesForForm(a.time!, a.classId!);
          const teacher = staffMembers.find((t) => t.id === a.teacherId);
          await staffScheduleService.create({
            staffId: a.teacherId!,
            staffName: teacher?.name || a.teacher!,
            day: toApiDay(a.day!),
            startTime: times.startTime,
            endTime: times.endTime,
            subject: a.subject!,
            subjectId: a.subjectId,
            classId: a.classId!,
            className: a.class!,
            room: a.room!,
            organizationId: classDetails.find((c) => c.id === a.classId)?.organizationId || "",
          });
        }
        await reload();
      } else {
        const overrides = assignments.map((a) => ({
          id: crypto.randomUUID(),
          weekStart: weekRange.key,
          staffId: a.teacherId!,
          staffName: a.teacher!,
          day: a.day!,
          time: a.time!,
          startTime: "",
          endTime: "",
          subject: a.subject!,
          subjectId: a.subjectId,
          classId: a.classId!,
          className: a.class!,
          room: a.room!,
          isWeeklyOverride: true as const,
        }));
        setOverridesForWeek(weekRange.key, overrides);
        bumpOverrides();
      }
      toast({ title: "Timetable applied successfully" });
      setApplyOpen(false);
    } catch {
      toast({
        title: "Schedule could not be applied because conflicts were detected.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCopyWeek = (opts: {
    fromWeek: string;
    toWeek: string;
    copyAssignments: boolean;
    copyRooms: boolean;
  }) => {
    const ok = copyWeekOverrides(opts.fromWeek, opts.toWeek, {
      copyAssignments: opts.copyAssignments,
      copyRooms: opts.copyRooms,
    });
    if (ok) {
      bumpOverrides();
      toast({ title: "Week copied successfully" });
    }
    else
      toast({
        title: "Nothing to copy",
        description: "No weekly overrides found in the previous week. Regular timetable unchanged.",
      });
  };

  useEffect(() => {
    if (!selectedTeacherId && filteredTeachers.length > 0) {
      setSelectedTeacherId(filteredTeachers[0].id);
    }
  }, [filteredTeachers, selectedTeacherId]);

  useEffect(() => {
    if (!selectedClassId && classOptions.length > 0) {
      setSelectedClassId(classOptions[0].id);
    }
  }, [classOptions, selectedClassId]);

  useEffect(() => {
    if (!selectedRoomId && roomOptions.length > 0) {
      setSelectedRoomId(roomOptions[0].id);
    }
  }, [roomOptions, selectedRoomId]);

  const replacementNeeded = getAffectedSchedules().length;

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Staff Schedule</h1>
            <p className="text-muted-foreground text-sm">
              Manage teacher timetables, weekly schedules and replacements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLeavePanel((v) => !v)}>
              Record Leave
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
              <Copy className="w-4 h-4 mr-1" />
              Copy Previous Week
            </Button>
            <Button variant="hero" size="sm" onClick={() => setApplyOpen(true)}>
              Apply Timetable
            </Button>
          </div>
        </div>

        {(pendingLeaves > 0 || replacementNeeded > 0) && (
          <div className="flex flex-wrap gap-2">
            {pendingLeaves > 0 && (
              <Badge variant="outline" className="border-amber-400 text-amber-900 bg-amber-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {pendingLeaves} pending leave request{pendingLeaves === 1 ? "" : "s"}
              </Badge>
            )}
            {replacementNeeded > 0 && (
              <Badge variant="outline" className="border-amber-400 text-amber-900 bg-amber-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {replacementNeeded} class{replacementNeeded === 1 ? "" : "es"} need replacement
              </Badge>
            )}
          </div>
        )}

        <Card>
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <WeekSelectorBar weekRange={weekRange} onPrev={goPrev} onNext={goNext} onThisWeek={goThisWeek} />
            <ViewSwitcher value={viewMode} onChange={setViewMode} />
          </CardContent>
        </Card>

        {showLeavePanel && (
          <LeaveReplacementsPanel
            leaves={leaves}
            replacements={replacements}
            staffMembers={staffMembers}
            schedule={effectiveSchedule}
            pendingCount={pendingLeaves}
            onApproveLeave={async (id) => {
              const leave = leaves.find((l) => l.id === id);
              if (!leave) return;
              const updated = await staffLeaveService.update({
                ...leave,
                status: "approved",
                approvedBy: "Admin",
                approvedDate: new Date().toISOString().split("T")[0],
              });
              setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)));
              toast({ title: "Leave approved" });
            }}
            onRejectLeave={async (id) => {
              const leave = leaves.find((l) => l.id === id);
              if (!leave) return;
              const updated = await staffLeaveService.update({ ...leave, status: "rejected" });
              setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)));
            }}
            onRecordLeave={async (data) => {
              const staff = staffMembers.find((s) => s.id === data.staffId);
              if (data.endDate.slice(0, 10) < data.startDate.slice(0, 10)) {
                toast({
                  title: "Invalid dates",
                  description: "End date must be on or after start date.",
                  variant: "destructive",
                });
                throw new Error("invalid dates");
              }
              const overlap = findOverlappingLeave(data.staffId, data.startDate, data.endDate, leaves);
              if (overlap) {
                toast({
                  title: "Leave already recorded",
                  description: `${staff?.name || "This staff member"} already has leave (${formatDateRange(overlap.startDate, overlap.endDate)}).`,
                  variant: "destructive",
                });
                throw new Error("overlapping leave");
              }
              try {
                const created = await staffLeaveService.create({
                  ...data,
                  staffName: staff?.name || "",
                  status: "pending",
                  appliedDate: new Date().toISOString().split("T")[0],
                });
                setLeaves((prev) => [...prev, created]);
                toast({ title: "Leave recorded successfully" });
              } catch (error) {
                toast({
                  title: "Failed to add leave",
                  description: describeApiError(error, "Please try again."),
                  variant: "destructive",
                });
                throw error;
              }
            }}
            onAssignReplacement={async (data) => {
              if (isPastDateYmd(data.date)) {
                toast({
                  title: "Past date",
                  description: "Replacements cannot be assigned for previous days.",
                  variant: "destructive",
                });
                throw new Error("past date");
              }
              if (
                isReplacementTeacherBusy(
                  regularSchedule,
                  replacements,
                  data.scheduleId,
                  data.replacementTeacherId,
                  data.date
                )
              ) {
                toast({
                  title: "Schedule conflict",
                  description:
                    "This teacher already has a class or substitute duty at this time. One person cannot be in two classes at once.",
                  variant: "destructive",
                });
                throw new Error("schedule conflict");
              }
              const subjectName = resolveReferenceValueName(
                referenceValues,
                ReferenceValueCategory.SUBJECT,
                data.subjectId
              );
              const rep = staffMembers.find((s) => s.id === data.replacementTeacherId);
              if (!data.subjectId || !subjectName) {
                toast({
                  title: "Missing subject",
                  description: "Choose which subject this substitute will cover.",
                  variant: "destructive",
                });
                throw new Error("missing subject");
              }
              if (rep && !staffTeachesSubject(rep, data.subjectId, subjectName, referenceValues)) {
                toast({
                  title: "Subject mismatch",
                  description: `${rep.name} is not assigned to teach ${subjectName}.`,
                  variant: "destructive",
                });
                throw new Error("subject mismatch");
              }
              try {
                const orig = staffMembers.find((s) => s.id === data.originalTeacherId);
                const created = await staffReplacementService.create({
                  scheduleId: data.scheduleId,
                  originalTeacherId: data.originalTeacherId,
                  replacementTeacherId: data.replacementTeacherId,
                  date: data.date,
                  reason: data.reason,
                  originalTeacherName: orig?.name || "",
                  replacementTeacherName: rep?.name || "",
                  subjectId: data.subjectId,
                  subject: subjectName,
                  assignedBy: "Admin",
                  assignedDate: new Date().toISOString().split("T")[0],
                  status: "active",
                });
                setReplacements((prev) => [...prev, created]);
                toast({ title: "Replacement teacher assigned" });
                await reload();
              } catch (error) {
                toast({
                  title: "Failed to assign replacement",
                  description: describeApiError(error),
                  variant: "destructive",
                });
                throw error;
              }
            }}
            getAffectedSchedules={getAffectedSchedules}
            getFreeReplacementTeachers={getFreeReplacementTeachers}
            getTeacherSubjectOptions={getTeacherSubjectOptions}
            subjectOptions={subjectOptions}
          />
        )}

        {viewMode === "teacher" && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[500px]">
            <Card className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] overflow-hidden">
              <CardContent className="pt-4 pb-4">
                <TeacherSidebar
                  teachers={filteredTeachers}
                  selectedId={selectedTeacherId}
                  onSelect={setSelectedTeacherId}
                  search={teacherSearch}
                  onSearchChange={setTeacherSearch}
                  periodCountByTeacher={periodCountByTeacher}
                  daysByTeacher={daysByTeacher}
                  loading={loading}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Timetable
                </CardTitle>
                <CardDescription>Week: {weekRange.label}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TeacherSummaryPanel
                  teacher={selectedTeacher}
                  periods={teacherEntries.length}
                  workingDays={daysByTeacher[selectedTeacherId] || 0}
                  classCount={teacherClassCount}
                  freePeriods={freePeriods}
                  totalSlots={totalTeachingSlots}
                  leavesInWeek={leavesForTeacherWeek}
                  replacementNeeded={
                    getAffectedSchedules().filter((x) => x.schedule.teacherId === selectedTeacherId).length
                  }
                  onManageReplacements={() => setShowLeavePanel(true)}
                />
                {teacherEntries.length === 0 && !loading && selectedTeacher ? (
                  <p className="text-sm text-muted-foreground">
                    No timetable assigned for {selectedTeacher.name} this week.
                  </p>
                ) : null}
                <ScheduleTimetableGrid
                  rows={teacherRows}
                  loading={loading}
                  getEntries={(day, time) =>
                    teacherEntries.filter((e) => e.day === day && e.time === time)
                  }
                  onAdd={(day, row) => openAdd(day, row)}
                  onEdit={openEdit}
                  onDelete={(e) => {
                    setEditEntry(e);
                    void handleDeleteSchedule();
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "class" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>
                    {classOptions.find((c) => c.id === selectedClassId)?.name || "Class"} Timetable
                  </CardTitle>
                  <CardDescription>Weekly schedule by class</CardDescription>
                </div>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {classRows.length === 0 && !loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground space-y-2">
                  <p>Bell schedule not configured for this grade.</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/admin/bell-schedule">Configure Bell Schedule</a>
                  </Button>
                </div>
              ) : (
                <ScheduleTimetableGrid
                  rows={classRows}
                  loading={loading}
                  getEntries={(day, time) => classEntries.filter((e) => e.day === day && e.time === time)}
                  onAdd={(day, row) => openAdd(day, row, selectedClassId)}
                  onEdit={openEdit}
                  onDelete={(e) => {
                    setEditEntry(e);
                    void handleDeleteSchedule();
                  }}
                />
              )}
            </CardContent>
          </Card>
        )}

        {viewMode === "room" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Room Utilization</CardTitle>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Room" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomOptions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScheduleTimetableGrid
                rows={roomRows}
                loading={loading}
                readOnly={false}
                getEntries={(day, time) => {
                  return roomEntries.filter(
                    (e) => e.day === day && e.time === time && e.roomId === selectedRoomId
                  );
                }}
                onEdit={openEdit}
              />
            </CardContent>
          </Card>
        )}

        <AddEditScheduleDialog
          open={addEditOpen}
          onOpenChange={setAddEditOpen}
          mode={editEntry ? "edit" : "add"}
          form={form}
          onChange={(p) => setForm((f) => ({ ...f, ...p }))}
          onSave={() => void handleSaveSchedule()}
          onDelete={editEntry ? () => void handleDeleteSchedule() : undefined}
          busy={busy}
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          teacherOptions={staffMembers.filter((s) => s.status === "active")}
          roomOptions={roomOptions}
          teachingRows={
            form.classId
              ? gradePeriodsToRows(gradePeriodsByGrade[classGradeMap[form.classId]] || []).filter(
                  (r) => !r.isBreak
                )
              : teachingRowsForClass
          }
        />

        <ApplyTimetableDialog
          open={applyOpen}
          onOpenChange={setApplyOpen}
          classOptions={classOptions}
          staffMembers={staffMembers}
          sourceSchedule={regularSchedule}
          existingSchedule={effectiveSchedule}
          leaves={leaves}
          weekRange={weekRange}
          teachingRows={teachingRowsForClass}
          onApply={handleApplyTimetable}
          busy={busy}
        />

        <CopyWeekDialog open={copyOpen} onOpenChange={setCopyOpen} currentWeek={weekRange} onCopy={handleCopyWeek} busy={busy} />
      </div>
    </DashboardLayout>
  );
}
