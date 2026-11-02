import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ApplyTimetableDraft, ValidationSummary } from "../types";
import type { ScheduleEntry, StaffMember } from "@/models/staff.model";
import { validateBulkAssignments, breakTimeSet } from "../utils/schedule-conflicts";
import type { StaffLeave } from "@/models/staff.model";
import type { WeekRange, TimetableRow } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  classOptions: Array<{ id: string; name: string }>;
  staffMembers: StaffMember[];
  sourceSchedule: ScheduleEntry[];
  existingSchedule: ScheduleEntry[];
  leaves: StaffLeave[];
  weekRange: WeekRange;
  teachingRows: TimetableRow[];
  onApply: (draft: ApplyTimetableDraft, assignments: Partial<ScheduleEntry>[]) => Promise<void>;
  busy?: boolean;
};

const STEPS = ["Source", "Targets", "Teachers", "Validate", "Preview"];

export function ApplyTimetableDialog({
  open,
  onOpenChange,
  classOptions,
  staffMembers,
  sourceSchedule,
  existingSchedule,
  leaves,
  weekRange,
  teachingRows,
  onApply,
  busy,
}: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ApplyTimetableDraft>({
    sourceType: "class",
    sourceClassId: classOptions[0]?.id || "",
    targetClassIds: [],
    targetMode: "regular",
    teacherMapping: {},
    roomMode: "keep",
    roomMapping: {},
    autoMatchTeachers: true,
  });

  const sourceEntries = useMemo(
    () => sourceSchedule.filter((s) => s.classId === draft.sourceClassId),
    [sourceSchedule, draft.sourceClassId]
  );

  const proposedAssignments = useMemo(() => {
    const list: Partial<ScheduleEntry>[] = [];
    for (const targetClassId of draft.targetClassIds) {
      const targetName = classOptions.find((c) => c.id === targetClassId)?.name || "";
      for (const src of sourceEntries) {
        const subjectKey = src.subjectId || src.subject;
        const teacherId =
          draft.teacherMapping[subjectKey] ||
          (draft.autoMatchTeachers
            ? staffMembers.find((t) => t.subjects.includes(src.subject))?.id
            : undefined) ||
          src.teacherId;
        const teacher = staffMembers.find((t) => t.id === teacherId);
        list.push({
          day: src.day,
          time: src.time,
          subject: src.subject,
          subjectId: src.subjectId,
          classId: targetClassId,
          class: targetName,
          teacherId,
          teacher: teacher?.name || src.teacher,
          room:
            draft.roomMode === "manual"
              ? draft.roomMapping[src.subject] || src.room
              : draft.roomMode === "keep"
                ? src.room
                : src.room,
        });
      }
    }
    return list;
  }, [draft, sourceEntries, classOptions, staffMembers]);

  const validation: ValidationSummary = useMemo(
    () =>
      validateBulkAssignments(
        proposedAssignments,
        existingSchedule,
        staffMembers,
        leaves,
        weekRange,
        breakTimeSet(teachingRows)
      ),
    [proposedAssignments, existingSchedule, staffMembers, leaves, weekRange, teachingRows]
  );

  const subjectsInSource = useMemo(() => {
    const map = new Map<string, string>();
    sourceEntries.forEach((s) => map.set(s.subjectId || s.subject, s.subject));
    return [...map.entries()];
  }, [sourceEntries]);

  const reset = () => {
    setStep(0);
    setDraft({
      sourceType: "class",
      sourceClassId: classOptions[0]?.id || "",
      targetClassIds: [],
      targetMode: "regular",
      teacherMapping: {},
      roomMode: "keep",
      roomMapping: {},
      autoMatchTeachers: true,
    });
  };

  const toggleTarget = (id: string) => {
    setDraft((d) => ({
      ...d,
      targetClassIds: d.targetClassIds.includes(id)
        ? d.targetClassIds.filter((x) => x !== id)
        : [...d.targetClassIds, id],
    }));
  };

  const canNext =
    step === 0
      ? !!draft.sourceClassId
      : step === 1
        ? draft.targetClassIds.length > 0
        : true;

  const blocking = validation.conflicts.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="bg-card max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply Timetable</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Copy from class</Label>
              <Select
                value={draft.sourceClassId}
                onValueChange={(v) => setDraft((d) => ({ ...d, sourceClassId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Source class" />
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
            <p className="text-xs text-muted-foreground">
              {sourceEntries.length} regular assignment(s) in source class.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 py-2">
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {classOptions
                .filter((c) => c.id !== draft.sourceClassId)
                .map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={draft.targetClassIds.includes(c.id)}
                      onCheckedChange={() => toggleTarget(c.id)}
                    />
                    {c.name}
                  </label>
                ))}
            </div>
            <div className="space-y-2">
              <Label>Apply to</Label>
              <Select
                value={draft.targetMode}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, targetMode: v as ApplyTimetableDraft["targetMode"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Timetable</SelectItem>
                  <SelectItem value="current_week">Current Week Only</SelectItem>
                  <SelectItem value="specific_week">Specific Week (override)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.autoMatchTeachers}
                onCheckedChange={(c) => setDraft((d) => ({ ...d, autoMatchTeachers: !!c }))}
              />
              Auto match teachers by subject
            </label>
            {!draft.autoMatchTeachers && (
              <div className="space-y-2">
                {subjectsInSource.map(([key, name]) => (
                  <div key={key} className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">{name}</span>
                    <Select
                      value={draft.teacherMapping[key] || ""}
                      onValueChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          teacherMapping: { ...d.teacherMapping, [key]: v },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">✓ {validation.valid} valid</Badge>
              {validation.conflicts.length > 0 && (
                <Badge variant="destructive">⚠ {validation.conflicts.length} conflicts</Badge>
              )}
              {validation.warnings.length > 0 && (
                <Badge variant="outline">⚠ {validation.warnings.length} warnings</Badge>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto text-sm space-y-1">
              {[...validation.conflicts, ...validation.warnings].map((c, i) => (
                <p key={i} className={c.severity === "error" ? "text-destructive" : "text-amber-700"}>
                  {c.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2 py-2 text-sm">
            <p>
              <span className="text-muted-foreground">Week:</span> {weekRange.label}
            </p>
            <p>
              <span className="text-muted-foreground">Classes:</span>{" "}
              {draft.targetClassIds.map((id) => classOptions.find((c) => c.id === id)?.name).join(", ")}
            </p>
            <p>
              <span className="text-muted-foreground">Assignments:</span> {proposedAssignments.length}
            </p>
            <p>
              <span className="text-muted-foreground">Target:</span>{" "}
              {draft.targetMode === "regular" ? "Regular timetable" : "Weekly schedule"}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="hero" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button
              variant="hero"
              disabled={busy || blocking > 0 || proposedAssignments.length === 0}
              onClick={() => void onApply(draft, proposedAssignments).then(() => reset())}
            >
              Apply Timetable
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
