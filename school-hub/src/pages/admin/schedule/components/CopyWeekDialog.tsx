import { useState } from "react";
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
import type { WeekRange } from "../types";
import { buildWeekRange, shiftWeek } from "../utils/schedule-week";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentWeek: WeekRange;
  onCopy: (opts: {
    fromWeek: string;
    toWeek: string;
    copyAssignments: boolean;
    copyRooms: boolean;
    copyReplacements: boolean;
  }) => void;
  busy?: boolean;
};

export function CopyWeekDialog({ open, onOpenChange, currentWeek, onCopy, busy }: Props) {
  const fromWeek = buildWeekRange(shiftWeek(currentWeek.start, -1));
  const [copyAssignments, setCopyAssignments] = useState(true);
  const [copyRooms, setCopyRooms] = useState(true);
  const [copyReplacements, setCopyReplacements] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Copy Previous Week</DialogTitle>
          <DialogDescription>Copy weekly schedule pattern to the current week.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm">
          <div>
            <Label className="text-muted-foreground">From</Label>
            <p className="font-medium">{fromWeek.label}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">To</Label>
            <p className="font-medium">{currentWeek.label}</p>
          </div>
          <label className="flex items-center gap-2">
            <Checkbox checked={copyAssignments} onCheckedChange={(c) => setCopyAssignments(!!c)} />
            Copy class schedules
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={copyRooms} onCheckedChange={(c) => setCopyRooms(!!c)} />
            Copy rooms
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={copyReplacements} onCheckedChange={(c) => setCopyReplacements(!!c)} />
            Copy replacements
          </label>
          <p className="text-xs text-muted-foreground">
            Leave and replacements are not copied by default. Regular timetable is unchanged; this copies weekly
            overrides.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="hero"
            disabled={busy}
            onClick={() => {
              onCopy({
                fromWeek: fromWeek.key,
                toWeek: currentWeek.key,
                copyAssignments,
                copyRooms,
                copyReplacements,
              });
              onOpenChange(false);
            }}
          >
            Copy Week
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
