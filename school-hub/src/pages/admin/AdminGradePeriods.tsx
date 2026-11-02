import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { referenceValueService } from "@/services/reference-value.service";
import { gradePeriodService } from "@/services/grade-period.service";
import { classService } from "@/services/class.service";
import { staffService } from "@/services/staff.service";
import type { Class, ClassSubject } from "@/models/class.model";
import type { Staff } from "@/models/staff.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import type { GradePeriod } from "@/models/grade-period.model";
import { formatTimeLabel, toApiTime } from "@/models/grade-period.model";
import {
  generateBellSchedule,
  inferQuickSetupFromPeriods,
  newBreakRule,
  type BellBreakRule,
  type GeneratedBellSlot,
} from "@/utils/generate-bell-schedule";
import {
  autoAssignTeachersForGrade,
  staffOptionsForSubject,
} from "@/utils/auto-assign-class-staff";

const AdminGradePeriods = () => {
  const { toast } = useToast();
  const [grades, setGrades] = useState<ReferenceValue[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [periods, setPeriods] = useState<GradePeriod[]>([]);
  const [allPeriods, setAllPeriods] = useState<GradePeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Quick setup
  const [schoolStart, setSchoolStart] = useState("08:00");
  const [numberOfPeriods, setNumberOfPeriods] = useState(8);
  const [periodDuration, setPeriodDuration] = useState(40);
  const [breaks, setBreaks] = useState<BellBreakRule[]>([]);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  // Class subjects for selected grade
  const [subjectOptions, setSubjectOptions] = useState<ReferenceValue[]>([]);
  const [classesForGrade, setClassesForGrade] = useState<Class[]>([]);
  const [gradeSubjectIds, setGradeSubjectIds] = useState<string[]>([]);
  const [classStaffMap, setClassStaffMap] = useState<
    Record<string, Record<string, { teacherId: string; teacherName: string }>>
  >({});
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyToGradeId, setCopyToGradeId] = useState("");
  const [form, setForm] = useState({
    id: "",
    periodCode: "",
    periodName: "",
    startTime: "08:00",
    endTime: "08:40",
    displayOrder: 1,
  });

  const selectedGrade = useMemo(
    () => grades.find((g) => g.id === selectedGradeId),
    [grades, selectedGradeId]
  );

  const activeStaff = useMemo(
    () => staffMembers.filter((s) => s.status === "active" && s.isActive),
    [staffMembers]
  );

  const gradeSubjects = useMemo(
    () =>
      gradeSubjectIds
        .map((id) => subjectOptions.find((s) => s.id === id))
        .filter((s): s is ReferenceValue => Boolean(s)),
    [gradeSubjectIds, subjectOptions]
  );

  const savedGradeSubjectKey = useMemo(() => {
    const meta = (selectedGrade?.metadata as { subjectIds?: string[] } | undefined)?.subjectIds ?? [];
    return [...meta].sort().join("|");
  }, [selectedGrade]);

  const currentGradeSubjectKey = useMemo(
    () => [...gradeSubjectIds].sort().join("|"),
    [gradeSubjectIds]
  );

  /** Step 2 unlocks only after grade subjects are saved (metadata matches current selection). */
  const subjectsSavedForGrade =
    gradeSubjectIds.length > 0 && savedGradeSubjectKey === currentGradeSubjectKey;

  const staffChoicesForSubject = (subjectId: string, subjectName: string) =>
    staffOptionsForSubject(activeStaff, subjectOptions, subjectId, subjectName);

  /** Dropdown list: subject-matched staff, plus current selection so the control always shows a name. */
  const staffSelectOptions = (subjectId: string, subjectName: string, selectedTeacherId?: string) => {
    const base = staffChoicesForSubject(subjectId, subjectName);
    if (!selectedTeacherId?.trim() || base.some((s) => s.id === selectedTeacherId)) {
      return base;
    }
    const current = activeStaff.find((s) => s.id === selectedTeacherId);
    return current ? [current, ...base] : base;
  };

  const gradesWithSchedule = useMemo(() => {
    const ids = new Set(allPeriods.map((p) => p.gradeId));
    return grades.filter((g) => ids.has(g.id));
  }, [grades, allPeriods]);

  const previewSlots = useMemo(
    () =>
      generateBellSchedule(
        {
          schoolStart,
          numberOfPeriods: Math.max(1, numberOfPeriods),
          periodDurationMinutes: Math.max(1, periodDuration),
        },
        breaks
      ),
    [schoolStart, numberOfPeriods, periodDuration, breaks]
  );

  const reload = async (gradeId?: string) => {
    setLoading(true);
    try {
      const [gradeRefs, subjectRefs, all, staffList] = await Promise.all([
        referenceValueService.getByCategory(ReferenceValueCategory.GRADE),
        referenceValueService.getByCategory(ReferenceValueCategory.SUBJECT),
        gradePeriodService.getAll(),
        staffService.getAll(),
      ]);
      setStaffMembers(staffList);
      const gradeList = getReferenceValuesByCategory(gradeRefs, ReferenceValueCategory.GRADE);
      setSubjectOptions(getReferenceValuesByCategory(subjectRefs, ReferenceValueCategory.SUBJECT));
      setGrades(gradeList);
      setAllPeriods(all);
      const gid = gradeId || selectedGradeId || gradeList[0]?.id || "";
      if (!selectedGradeId && gradeList[0]?.id) setSelectedGradeId(gradeList[0].id);
      if (gid) {
        const rows = await gradePeriodService.getByGrade(gid);
        setPeriods(rows);
        if (gradeId) setSelectedGradeId(gradeId);
      } else {
        setPeriods([]);
      }
    } catch {
      toast({
        title: "Failed to load bell schedules",
        description: "Ensure the grade_periods table exists and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedGradeId) {
      setPeriods([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await gradePeriodService.getByGrade(selectedGradeId);
        if (!cancelled) {
          setPeriods(rows);
        }
      } catch {
        if (!cancelled) setPeriods([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGradeId]);

  useEffect(() => {
    if (!selectedGradeId) {
      setClassesForGrade([]);
      return;
    }
    if (grades.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await classService.getByGrade(selectedGradeId, undefined, grades);
        if (cancelled) return;
        setClassesForGrade(list);
      } catch {
        if (!cancelled) setClassesForGrade([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGradeId, grades]);

  useEffect(() => {
    if (!selectedGradeId) {
      setGradeSubjectIds([]);
      return;
    }
    const grade = grades.find((g) => g.id === selectedGradeId);
    const fromMeta = (grade?.metadata as { subjectIds?: string[] } | undefined)?.subjectIds;
    if (fromMeta?.length) {
      setGradeSubjectIds(fromMeta);
      return;
    }
    const union = [
      ...new Set(
        classesForGrade.flatMap((c) =>
          (c.subjects || []).map((s) => s.subjectId).filter(Boolean)
        )
      ),
    ];
    setGradeSubjectIds(union);
  }, [selectedGradeId, grades, classesForGrade]);

  useEffect(() => {
    setClassStaffMap((prev) => {
      const next: Record<string, Record<string, { teacherId: string; teacherName: string }>> = {};
      classesForGrade.forEach((cls) => {
        const fromClass: Record<string, { teacherId: string; teacherName: string }> = {};
        gradeSubjectIds.forEach((subjectId) => {
          const existing = cls.subjects?.find((s) => s.subjectId === subjectId);
          fromClass[subjectId] = {
            teacherId: existing?.teacherId || "",
            teacherName: existing?.teacherName || "",
          };
        });
        const kept = prev[cls.id] || {};
        next[cls.id] = { ...fromClass };
        gradeSubjectIds.forEach((subjectId) => {
          if (kept[subjectId]?.teacherId) {
            next[cls.id][subjectId] = kept[subjectId];
          }
        });
      });
      return next;
    });
  }, [classesForGrade, gradeSubjectIds]);

  /** Fill empty subject slots from staff profiles (class homeroom preferred when they teach the subject). */
  useEffect(() => {
    if (!subjectsSavedForGrade || gradeSubjectIds.length === 0 || classesForGrade.length === 0) return;
    setClassStaffMap((prev) => {
      const needsFill = classesForGrade.some((cls) =>
        gradeSubjectIds.some((subjectId) => !prev[cls.id]?.[subjectId]?.teacherId)
      );
      if (!needsFill) return prev;
      return autoAssignTeachersForGrade({
        classes: classesForGrade,
        gradeSubjectIds,
        subjectOptions,
        activeStaff,
        existing: prev,
        replaceAll: false,
      });
    });
  }, [
    subjectsSavedForGrade,
    classesForGrade,
    gradeSubjectIds,
    activeStaff,
    subjectOptions,
  ]);

  /** When a grade schedule is loaded, hydrate quick-setup (including breaks) from saved rows. */
  useEffect(() => {
    if (periods.length === 0) {
      setBreaks([]);
      return;
    }
    const inferred = inferQuickSetupFromPeriods(periods);
    if (!inferred) return;
    setSchoolStart(inferred.schoolStart);
    setNumberOfPeriods(inferred.numberOfPeriods);
    setPeriodDuration(inferred.periodDuration);
    setBreaks(inferred.breaks);
  }, [periods]);

  const persistSlots = async (slots: GeneratedBellSlot[]) => {
    if (!selectedGradeId || !selectedGrade) {
      toast({ title: "Select a grade first", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await gradePeriodService.replaceSchedule(
        selectedGradeId,
        selectedGrade.name,
        slots.map((slot) => ({
          periodCode: slot.periodCode,
          periodName: slot.periodName,
          startTime: slot.startTime,
          endTime: slot.endTime,
          displayOrder: slot.displayOrder,
        }))
      );
      await reload(selectedGradeId);
      toast({
        title: "Bell schedule saved",
        description: `${slots.length} slot(s) saved for ${selectedGrade.name}.`,
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Check inputs and that grade_periods table exists.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setConfirmReplaceOpen(false);
    }
  };

  const handleQuickSave = () => {
    if (previewSlots.length === 0) {
      toast({ title: "Nothing to save", variant: "destructive" });
      return;
    }
    if (periods.length > 0) {
      setConfirmReplaceOpen(true);
      return;
    }
    void persistSlots(previewSlots);
  };

  const openEdit = (p: GradePeriod) => {
    setForm({
      id: p.id,
      periodCode: p.periodCode,
      periodName: p.periodName,
      startTime: p.startTime.slice(0, 5),
      endTime: p.endTime.slice(0, 5),
      displayOrder: p.displayOrder,
    });
    setEditOpen(true);
  };

  const savePeriodForm = async () => {
    if (!selectedGradeId || !selectedGrade) return;
    if (!form.periodName || !form.startTime || !form.endTime) {
      toast({ title: "Name, start, and end time are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await gradePeriodService.save({
        id: form.id || undefined,
        gradeId: selectedGradeId,
        gradeName: selectedGrade.name,
        periodCode: form.periodCode || `P${form.displayOrder}`,
        periodName: form.periodName,
        startTime: toApiTime(form.startTime),
        endTime: toApiTime(form.endTime),
        displayOrder: form.displayOrder,
      });
      setEditOpen(false);
      await reload(selectedGradeId);
      toast({ title: "Period saved" });
    } catch {
      toast({ title: "Could not save period", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removePeriod = async (id: string) => {
    setBusy(true);
    try {
      await gradePeriodService.delete(id);
      await reload(selectedGradeId);
      toast({ title: "Period removed" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copySchedule = async () => {
    if (!selectedGradeId || !copyToGradeId) return;
    const target = grades.find((g) => g.id === copyToGradeId);
    if (!target) return;
    setBusy(true);
    try {
      await gradePeriodService.copyToGrade(selectedGradeId, copyToGradeId, target.name);
      setCopyOpen(false);
      await reload(copyToGradeId);
      toast({
        title: "Schedule copied",
        description: `Copied from ${selectedGrade?.name} to ${target.name}.`,
      });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const addBreakRow = () => {
    setBreaks((prev) => [...prev, newBreakRule(Math.min(numberOfPeriods, 4))]);
  };

  const updateBreak = (id: string, patch: Partial<BellBreakRule>) => {
    setBreaks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeBreak = (id: string) => {
    setBreaks((prev) => prev.filter((b) => b.id !== id));
  };

  const openEditFromPreview = (slot: GeneratedBellSlot) => {
    const saved = periods.find(
      (p) => p.periodCode === slot.periodCode && p.displayOrder === slot.displayOrder
    );
    if (saved) {
      openEdit(saved);
      return;
    }
    setForm({
      id: "",
      periodCode: slot.periodCode,
      periodName: slot.periodName,
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      displayOrder: slot.displayOrder,
    });
    setEditOpen(true);
  };

  const removePreviewSlot = (slot: GeneratedBellSlot) => {
    const saved = periods.find(
      (p) => p.periodCode === slot.periodCode && p.displayOrder === slot.displayOrder
    );
    if (saved) {
      void removePeriod(saved.id);
      return;
    }
    if (slot.isBreak) {
      const match = breaks.find((b) => {
        const code =
          b.name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/^_|_$/g, "") || "BREAK";
        return slot.periodCode === code || slot.periodName === b.name.trim();
      });
      if (match) {
        removeBreak(match.id);
        return;
      }
    }
    toast({
      title: "Can't remove this slot",
      description: "Adjust period count or breaks above, or use the edit icon after saving.",
    });
  };

  const toggleGradeSubject = (subjectId: string, checked: boolean) => {
    setGradeSubjectIds((prev) =>
      checked ? [...new Set([...prev, subjectId])] : prev.filter((id) => id !== subjectId)
    );
  };

  const setClassSubjectTeacher = (classId: string, subjectId: string, teacherId: string) => {
    const staff = activeStaff.find((s) => s.id === teacherId);
    setClassStaffMap((prev) => ({
      ...prev,
      [classId]: {
        ...(prev[classId] || {}),
        [subjectId]: {
          teacherId,
          teacherName: staff?.fullName || staff?.firstName || "",
        },
      },
    }));
  };

  const buildClassSubjects = (
    cls: Class,
    subjectIds: string[],
    teachers: Record<string, { teacherId: string; teacherName: string }>
  ): ClassSubject[] =>
    subjectIds.map((subjectId) => {
      const ref = subjectOptions.find((s) => s.id === subjectId);
      const existing = cls.subjects?.find((s) => s.subjectId === subjectId);
      const teacher = teachers[subjectId];
      return {
        id: existing?.id || crypto.randomUUID(),
        subjectId,
        subjectName: ref?.name || existing?.subjectName || subjectId,
        teacherId: teacher?.teacherId ?? existing?.teacherId ?? "",
        teacherName: teacher?.teacherName ?? existing?.teacherName ?? "",
        weeklyHours: existing?.weeklyHours || 0,
        isOptional: existing?.isOptional || false,
        organizationId: cls.organizationId,
        isActive: true,
      };
    });

  const saveGradeSubjects = async () => {
    if (!selectedGrade) {
      toast({ title: "Select a grade first", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const updatedGrade = await referenceValueService.update({
        ...selectedGrade,
        metadata: { ...(selectedGrade.metadata || {}), subjectIds: gradeSubjectIds },
      });
      setGrades((prev) => prev.map((g) => (g.id === updatedGrade.id ? updatedGrade : g)));

      const updatedClasses: Class[] = [];
      for (const cls of classesForGrade) {
        const teachersForClass: Record<string, { teacherId: string; teacherName: string }> = {};
        gradeSubjectIds.forEach((subjectId) => {
          const existing = cls.subjects?.find((s) => s.subjectId === subjectId);
          teachersForClass[subjectId] = {
            teacherId: existing?.teacherId || "",
            teacherName: existing?.teacherName || "",
          };
        });
        const subjects = buildClassSubjects(cls, gradeSubjectIds, teachersForClass);
        updatedClasses.push(await classService.update({ ...cls, subjects }));
      }
      if (updatedClasses.length > 0) {
        setClassesForGrade(updatedClasses);
        setClassStaffMap((prev) =>
          autoAssignTeachersForGrade({
            classes: updatedClasses,
            gradeSubjectIds,
            subjectOptions,
            activeStaff,
            existing: prev,
            replaceAll: false,
          })
        );
      }

      toast({
        title: "Grade subjects saved",
        description: `${gradeSubjectIds.length} subject(s) set for ${selectedGrade.name}. Assign staff per class below.`,
      });
      requestAnimationFrame(() => {
        document.getElementById("staff-by-class")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      toast({ title: "Could not save grade subjects", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const saveAllClassStaff = async () => {
    if (!subjectsSavedForGrade) {
      toast({
        title: "Save grade subjects first",
        description: "Choose subjects for the grade and click Save grade subjects, then assign staff per class.",
        variant: "destructive",
      });
      return;
    }
    if (classesForGrade.length === 0) return;
    setBusy(true);
    try {
      const updated: Class[] = [];
      for (const cls of classesForGrade) {
        const teachers = classStaffMap[cls.id] || {};
        const subjects = buildClassSubjects(cls, gradeSubjectIds, teachers);
        updated.push(await classService.update({ ...cls, subjects }));
      }
      setClassesForGrade(updated);
      toast({
        title: "Staff saved",
        description: `Staff assignments saved for ${updated.length} class(es) in ${selectedGrade?.name}.`,
      });
    } catch {
      toast({ title: "Could not save staff", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const saveClassStaff = async (classId: string) => {
    const cls = classesForGrade.find((c) => c.id === classId);
    if (!cls) return;
    if (!subjectsSavedForGrade) {
      toast({
        title: "Save grade subjects first",
        description: "Subjects must be saved before staff can be assigned per class.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const teachers = classStaffMap[classId] || {};
      const subjects = buildClassSubjects(cls, gradeSubjectIds, teachers);
      const updated = await classService.update({ ...cls, subjects });
      setClassesForGrade((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast({
        title: "Staff saved",
        description: `Staff assignments saved for ${cls.name}.`,
      });
    } catch {
      toast({ title: "Could not save staff", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Bell schedule by grade</h1>
          <p className="text-muted-foreground mt-1">
            Step 1: subjects for the grade. Step 2: staff per class for those subjects. Step 3: bell times.
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2 min-w-[220px]">
                <Label>Grade</Label>
                <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                        {gradesWithSchedule.some((x) => x.id === g.id) ? " · set" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {periods.length > 0 && (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => setCopyOpen(true)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy to another grade
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
            ) : !selectedGradeId ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Add grades in Settings first, then configure bells here.
              </p>
            ) : (
              <>
              <Card className="mb-6 border-dashed bg-muted/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">Step 1</Badge>
                    <CardTitle className="text-base font-display">Subjects for this grade</CardTitle>
                  </div>
                  <CardDescription>
                    Select subjects once for {selectedGrade?.name}, then click <strong>Save grade subjects</strong>.
                    Every class in this grade uses this list in step 2.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subjectOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Add subjects in{" "}
                      <Link to="/admin/settings" className="underline font-medium">
                        Settings
                      </Link>{" "}
                      first.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {subjectOptions.map((subject) => (
                          <label
                            key={subject.id}
                            className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={gradeSubjectIds.includes(subject.id)}
                              onCheckedChange={(checked) =>
                                toggleGradeSubject(subject.id, checked === true)
                              }
                            />
                            <span>{subject.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="hero"
                          size="sm"
                          disabled={busy || subjectOptions.length === 0}
                          onClick={() => void saveGradeSubjects()}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save grade subjects
                        </Button>
                        {gradeSubjectIds.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {gradeSubjectIds.length} subject
                            {gradeSubjectIds.length === 1 ? "" : "s"} selected
                            {subjectsSavedForGrade ? " · saved" : " · save to unlock staff assignment"}.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div id="staff-by-class" className="mb-6 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={subjectsSavedForGrade ? "secondary" : "outline"}>Step 2</Badge>
                      <h2 className="text-base font-display font-semibold">Staff by class</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      For each class in {selectedGrade?.name}, pick who teaches each saved subject.
                    </p>
                  </div>
                  {subjectsSavedForGrade && classesForGrade.length > 0 && (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void saveAllClassStaff()}>
                      <Save className="h-4 w-4 mr-2" />
                      Save all classes
                    </Button>
                  )}
                </div>
                {classesForGrade.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No classes linked to grade <strong>{selectedGrade?.name}</strong> yet.{" "}
                    <Link to="/admin/classes" className="underline font-medium text-foreground">
                      Create or edit a class
                    </Link>{" "}
                    and set its <strong>Grade</strong> to {selectedGrade?.name} (same as in Settings), then return
                    here to assign staff.
                  </p>
                ) : gradeSubjectIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Select subjects in step 1, then save grade subjects.
                  </p>
                ) : !subjectsSavedForGrade ? (
                  <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
                    You have unsaved subject changes. Click <strong>Save grade subjects</strong> in step 1, then assign
                    staff for each class below.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {classesForGrade.map((cls) => (
                        <Card key={cls.id} className="border-border/60 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-display">{cls.name}</CardTitle>
                            {cls.section ? (
                              <CardDescription>Section {cls.section}</CardDescription>
                            ) : null}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {gradeSubjects.map((subject) => {
                              const teacherId = classStaffMap[cls.id]?.[subject.id]?.teacherId;
                              const staffChoices = staffSelectOptions(subject.id, subject.name, teacherId);
                              return (
                                <div key={subject.id} className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{subject.name}</Label>
                                  <Select
                                    value={teacherId || undefined}
                                    onValueChange={(v) => setClassSubjectTeacher(cls.id, subject.id, v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select staff" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {staffChoices.length === 0 ? (
                                        <SelectItem value="__none" disabled>
                                          No active staff
                                        </SelectItem>
                                      ) : (
                                        staffChoices.map((staff) => (
                                          <SelectItem key={staff.id} value={staff.id}>
                                            {staff.fullName || `${staff.firstName} ${staff.lastName}`}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })}
                            <Button
                              variant="hero"
                              size="sm"
                              className="w-full"
                              disabled={busy}
                              onClick={() => void saveClassStaff(cls.id)}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save {cls.name}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {activeStaff.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Add staff in{" "}
                        <Link to="/admin/staff" className="underline font-medium">
                          Staff
                        </Link>{" "}
                        to assign teachers.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-6 mt-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>School start time</Label>
                      <Input
                        type="time"
                        value={schoolStart}
                        onChange={(e) => setSchoolStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of teaching periods</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={numberOfPeriods}
                        onChange={(e) =>
                          setNumberOfPeriods(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period duration (minutes)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        value={periodDuration}
                        onChange={(e) =>
                          setPeriodDuration(Math.max(1, parseInt(e.target.value, 10) || 40))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Breaks & lunch (optional)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addBreakRow}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add break
                      </Button>
                    </div>
                    {breaks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No breaks yet. Example: Lunch after period 4 for 40 minutes.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {breaks.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 p-3"
                          >
                            <div className="space-y-1 min-w-[140px]">
                              <Label className="text-xs">After period</Label>
                              <Select
                                value={String(b.afterPeriod)}
                                onValueChange={(v) =>
                                  updateBreak(b.id, { afterPeriod: parseInt(v, 10) })
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: numberOfPeriods }, (_, i) => i + 1).map(
                                    (n) => (
                                      <SelectItem key={n} value={String(n)}>
                                        After P{n}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 flex-1 min-w-[120px]">
                              <Label className="text-xs">Name</Label>
                              <Input
                                className="h-9"
                                value={b.name}
                                onChange={(e) => updateBreak(b.id, { name: e.target.value })}
                                placeholder="Lunch"
                              />
                            </div>
                            <div className="space-y-1 w-[100px]">
                              <Label className="text-xs">Duration (min)</Label>
                              <Input
                                className="h-9"
                                type="number"
                                min={1}
                                value={b.durationMinutes}
                                onChange={(e) =>
                                  updateBreak(b.id, {
                                    durationMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                                  })
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => removeBreak(b.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Card className="bg-muted/30 border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-display">Generated preview</CardTitle>
                      <CardDescription>
                        Review before saving. Use the edit icon on a row to adjust a slot.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewSlots.map((slot) => (
                            <TableRow key={`${slot.periodCode}-${slot.displayOrder}`}>
                              <TableCell>
                                <span className="font-medium">{slot.periodName}</span>
                                <span className="ml-2 font-mono text-xs text-muted-foreground">
                                  {slot.periodCode}
                                </span>
                                {slot.isBreak ? (
                                  <Badge variant="secondary" className="ml-2 text-[10px]">
                                    Break
                                  </Badge>
                                ) : null}
                              </TableCell>
                              <TableCell>{formatTimeLabel(slot.startTime)}</TableCell>
                              <TableCell>{formatTimeLabel(slot.endTime)}</TableCell>
                              <TableCell>
                                {slot.durationMinutes} min
                                <button
                                  type="button"
                                  className="ml-2 inline-flex align-middle text-muted-foreground hover:text-foreground disabled:opacity-50"
                                  disabled={busy}
                                  onClick={() => openEditFromPreview(slot)}
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="ml-1 inline-flex align-middle text-muted-foreground hover:text-destructive disabled:opacity-50"
                                  disabled={busy}
                                  onClick={() => removePreviewSlot(slot)}
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="hero" disabled={busy} onClick={handleQuickSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save schedule
                    </Button>
                    {periods.length > 0 && (
                      <p className="text-xs text-muted-foreground self-center">
                        Saving will replace the existing {periods.length} slot(s) for this grade.
                      </p>
                    )}
                  </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing bell schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              Grade {selectedGrade?.name} already has {periods.length} saved slot(s). Saving will
              remove them and create {previewSlots.length} new slot(s) from your quick setup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => void persistSlots(previewSlots)}
            >
              Replace & save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit period — {selectedGrade?.name}</DialogTitle>
            <DialogDescription>Adjust start and end times for this slot.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.periodCode}
                  onChange={(e) => setForm({ ...form, periodCode: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.periodName}
                onChange={(e) => setForm({ ...form, periodName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" disabled={busy} onClick={() => void savePeriodForm()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy bell schedule</DialogTitle>
            <DialogDescription>Copy from {selectedGrade?.name} to another grade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Target grade</Label>
            <Select value={copyToGradeId} onValueChange={setCopyToGradeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades
                  .filter((g) => g.id !== selectedGradeId)
                  .map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" disabled={busy || !copyToGradeId} onClick={() => void copySchedule()}>
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminGradePeriods;
