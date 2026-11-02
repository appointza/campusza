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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReferenceValue } from "@/models/referencevalue.model";
import type { StaffMember } from "@/models/staff.model";
import type { TimetableRow } from "../types";
import { WORKING_DAYS } from "../utils/schedule-week";

export type ScheduleFormState = {
  classId: string;
  day: string;
  time: string;
  periodLabel: string;
  subject: string;
  teacherId: string;
  room: string;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "add" | "edit";
  form: ScheduleFormState;
  onChange: (patch: Partial<ScheduleFormState>) => void;
  onSave: () => void;
  onDelete?: () => void;
  busy?: boolean;
  classOptions: Array<{ id: string; name: string }>;
  subjectOptions: ReferenceValue[];
  teacherOptions: StaffMember[];
  roomOptions: ReferenceValue[];
  teachingRows: TimetableRow[];
  fixedDay?: string;
  fixedTime?: string;
};

export function AddEditScheduleDialog({
  open,
  onOpenChange,
  mode,
  form,
  onChange,
  onSave,
  onDelete,
  busy,
  classOptions,
  subjectOptions,
  teacherOptions,
  roomOptions,
  teachingRows,
  fixedDay,
  fixedTime,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Schedule" : "Edit Schedule"}</DialogTitle>
          <DialogDescription>Period times come from the grade bell schedule.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={form.classId} onValueChange={(v) => onChange({ classId: v })} disabled={mode === "edit"}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={form.day}
                onValueChange={(v) => onChange({ day: v })}
                disabled={!!fixedDay}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {WORKING_DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={form.time}
                onValueChange={(v) => {
                  const row = teachingRows.find((r) => r.timeLabel === v);
                  onChange({
                    time: v,
                    periodLabel: row ? `${row.periodName} — ${row.rangeLabel}` : v,
                  });
                }}
                disabled={!!fixedTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  {teachingRows.map((r) => (
                    <SelectItem key={r.key} value={r.timeLabel}>
                      {r.periodName} — {r.rangeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.periodLabel && (
            <p className="text-xs text-muted-foreground">{form.periodLabel}</p>
          )}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={form.subject} onValueChange={(v) => onChange({ subject: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={form.teacherId} onValueChange={(v) => onChange({ teacherId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Teacher" />
              </SelectTrigger>
              <SelectContent>
                {teacherOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={form.room} onValueChange={(v) => onChange({ room: v })}>
              <SelectTrigger>
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
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {mode === "edit" && onDelete && (
            <Button variant="destructive" disabled={busy} onClick={onDelete} className="mr-auto">
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="hero" disabled={busy} onClick={onSave}>
            {mode === "add" ? "Save Schedule" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
