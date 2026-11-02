import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, UserX, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffLeaveService } from "@/services/staff-leave.service";
import { termService } from "@/services/term.service";
import type { StaffLeave } from "@/models/staff.model";
import type { Term } from "@/models/term.model";
import { getLeaveTypeLabel } from "@/models/staff.model";
import {
  getClosedDaysInMonth,
  getDatesWithStaffLeaveInMonth,
  getOpenDaysInMonth,
  getSchoolDayLabel,
  getSchoolDayType,
  getStaffLeavesForDate,
} from "@/utils/calendar-days";
import { formatDisplayDate, localDateYmd, parseYmd } from "@/utils/date";

type AttendanceSchoolCalendarDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onSelectDate: (ymd: string) => void;
};

export function AttendanceSchoolCalendarDialog({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
}: AttendanceSchoolCalendarDialogProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => parseYmd(selectedDate));
  const [pickerDate, setPickerDate] = useState<Date | undefined>(() => parseYmd(selectedDate));
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPickerDate(parseYmd(selectedDate));
    setVisibleMonth(parseYmd(selectedDate));
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([staffLeaveService.getAll(), termService.getAll()])
      .then(([leaveItems, termItems]) => {
        if (cancelled) return;
        setLeaves(leaveItems.filter((leave) => leave.isActive));
        setTerms(termItems.filter((term) => term.isActive));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const pickerYmd = pickerDate ? localDateYmd(pickerDate) : selectedDate;
  const schoolDayType = getSchoolDayType(pickerYmd, terms);
  const staffOnLeave = useMemo(
    () => getStaffLeavesForDate(pickerYmd, leaves),
    [pickerYmd, leaves]
  );

  const openDays = useMemo(
    () => getOpenDaysInMonth(visibleMonth, terms),
    [visibleMonth, terms]
  );
  const closedDays = useMemo(
    () => getClosedDaysInMonth(visibleMonth, terms),
    [visibleMonth, terms]
  );
  const staffLeaveDays = useMemo(
    () => getDatesWithStaffLeaveInMonth(visibleMonth, leaves),
    [visibleMonth, leaves]
  );

  const monthStats = useMemo(() => {
    const openCount = openDays.length;
    const closedCount = closedDays.length;
    const leaveDayCount = staffLeaveDays.length;
    return { openCount, closedCount, leaveDayCount };
  }, [openDays, closedDays, staffLeaveDays]);

  const handleApplyDate = () => {
    if (!pickerDate) return;
    onSelectDate(localDateYmd(pickerDate));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            School Calendar
          </DialogTitle>
          <DialogDescription>
            View school open days, weekly offs, and staff on approved leave.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={pickerDate}
              onSelect={setPickerDate}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              modifiers={{
                openDay: openDays,
                closedDay: closedDays,
                staffLeaveDay: staffLeaveDays,
              }}
              modifiersClassNames={{
                openDay: "bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
                closedDay: "bg-muted text-muted-foreground",
                staffLeaveDay:
                  "relative after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-amber-500",
              }}
              className="rounded-md border"
            />

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-200" />
                Open day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-muted border" />
                Weekly off / outside term
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border relative after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-amber-500" />
                Staff on leave
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg border bg-emerald-50/60 p-3">
                <div className="font-semibold text-emerald-700">{monthStats.openCount}</div>
                <div className="text-xs text-muted-foreground">Open days</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-semibold">{monthStats.closedCount}</div>
                <div className="text-xs text-muted-foreground">Closed days</div>
              </div>
              <div className="rounded-lg border bg-amber-50/60 p-3">
                <div className="font-semibold text-amber-700">{monthStats.leaveDayCount}</div>
                <div className="text-xs text-muted-foreground">Leave days</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Selected date</p>
                <p className="font-medium">{formatDisplayDate(pickerYmd)}</p>
              </div>

              <div className="flex items-center gap-2">
                {schoolDayType === "open" ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {getSchoolDayLabel(schoolDayType)}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    {getSchoolDayLabel(schoolDayType)}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {schoolDayType === "open"
                  ? "Attendance can be recorded for this day."
                  : "School is not scheduled to operate on this day."}
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3 min-h-[220px]">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <UserX className="h-4 w-4 text-amber-600" />
                  Staff on Leave
                </h3>
                <Badge variant="outline">{staffOnLeave.length}</Badge>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading leave records...</p>
              ) : staffOnLeave.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No approved staff leave for this date.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {staffOnLeave.map((leave) => (
                    <div key={leave.id} className="rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{leave.staffName}</p>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          {getLeaveTypeLabel(leave.leaveType)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {leave.startDate.slice(0, 10)} to {leave.endDate.slice(0, 10)}
                      </p>
                      {leave.reason ? (
                        <p className="text-sm mt-2 text-muted-foreground">{leave.reason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleApplyDate} disabled={!pickerDate}>
            Use This Date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
