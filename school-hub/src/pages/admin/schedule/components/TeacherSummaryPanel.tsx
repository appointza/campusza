import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { StaffMember, StaffLeave } from "@/models/staff.model";
import { getStaffMemberStatusColor } from "@/models/staff.model";
import { formatDateRange } from "@/utils/date";

type Props = {
  teacher: StaffMember | null;
  periods: number;
  workingDays: number;
  classCount: number;
  freePeriods: number;
  totalSlots: number;
  leavesInWeek: StaffLeave[];
  replacementNeeded: number;
  onManageReplacements?: () => void;
};

export function TeacherSummaryPanel({
  teacher,
  periods,
  workingDays,
  classCount,
  freePeriods,
  totalSlots,
  leavesInWeek,
  replacementNeeded,
  onManageReplacements,
}: Props) {
  if (!teacher) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Select a teacher to view their weekly timetable.
      </div>
    );
  }

  const loadPct = totalSlots > 0 ? Math.round((periods / totalSlots) * 100) : 0;
  const primary = teacher.subjects[0] || teacher.department;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold">{teacher.name}</h2>
          <p className="text-sm text-muted-foreground">{primary} Teacher</p>
        </div>
        <Badge className={getStaffMemberStatusColor(teacher.status)}>{teacher.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Assigned:</span>{" "}
          <span className="font-medium">{periods} periods</span>
        </div>
        <div>
          <span className="text-muted-foreground">Free:</span>{" "}
          <span className="font-medium">{freePeriods}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Working days:</span>{" "}
          <span className="font-medium">{workingDays}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Classes:</span>{" "}
          <span className="font-medium">{classCount}</span>
        </div>
      </div>

      {totalSlots > 0 && (
        <div className="space-y-1 max-w-xs">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Teaching load</span>
            <span>{loadPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(loadPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {leavesInWeek.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{teacher.name} is on approved leave</p>
              <p className="text-xs mt-0.5">
                {formatDateRange(
                  leavesInWeek[0].startDate,
                  leavesInWeek[leavesInWeek.length - 1].endDate
                )}
              </p>
              {replacementNeeded > 0 && (
                <p className="text-xs mt-1">{replacementNeeded} slot(s) require replacement.</p>
              )}
              {onManageReplacements && (
                <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={onManageReplacements}>
                  Manage Replacements
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
