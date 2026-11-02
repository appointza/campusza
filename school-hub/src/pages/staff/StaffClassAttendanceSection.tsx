import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Clock, ChevronLeft, ChevronRight, Save, CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  attendanceService,
  type StaffAttendancePage,
  type StudentWithAttendanceItem,
} from "@/services/attendance.service";
import { describeApiError } from "@/utils/api-error";
import { isPastDateYmd, localDateYmd } from "@/utils/date";
import { cn } from "@/lib/utils";

type AttendanceStatusValue = "present" | "absent" | "late";

const emptyPage = (): StaffAttendancePage => ({
  staffid: "",
  date: "",
  selectedclassid: "",
  selectedclassname: "",
  classes: [],
  students: [],
  summary: { present: 0, absent: 0, late: 0, total: 0 },
});

type Props = {
  selectedClassId?: string;
  onClassIdChange?: (classId: string) => void;
  /** When set by parent (e.g. Classes page), sync date across attendance & homework */
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  /** Hide date row when parent provides shared date controls */
  hideDateControls?: boolean;
  /** Sidebar picks class — hide duplicate title & class dropdown */
  embedded?: boolean;
};

export function StaffClassAttendanceSection({
  selectedClassId,
  onClassIdChange,
  selectedDate: controlledDate,
  onDateChange,
  hideDateControls,
  embedded,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<StaffAttendancePage>(emptyPage);
  const [internalClassId, setInternalClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const effectiveClassId = selectedClassId || internalClassId || page.selectedclassid;
  const activeDate = controlledDate || selectedDate || page.date;

  const loadPage = useCallback(
    async (classId: string, date: string) => {
      setLoading(true);
      try {
        const data = await attendanceService.getStaffAttendancePage(classId, date);
        setPage(data);
        setInternalClassId(data.selectedclassid);
        setSelectedDate(data.date);
        onDateChange?.(data.date);
        onClassIdChange?.(data.selectedclassid);
      } catch (error) {
        console.error("Failed to load attendance page:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance data.",
          variant: "destructive",
        });
        setPage(emptyPage());
      } finally {
        setLoading(false);
      }
    },
    [toast, onClassIdChange, onDateChange]
  );

  useEffect(() => {
    const date = controlledDate || localDateYmd();
    loadPage(selectedClassId ?? "", date);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    const date = controlledDate || selectedDate || page.date || localDateYmd();
    if (
      selectedClassId === page.selectedclassid &&
      date === page.date &&
      page.students.length > 0
    )
      return;
    loadPage(selectedClassId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when parent picks class/date
  }, [selectedClassId, controlledDate]);

  useEffect(() => {
    if (controlledDate && controlledDate !== selectedDate) {
      setSelectedDate(controlledDate);
      if (effectiveClassId) loadPage(effectiveClassId, controlledDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parent date sync
  }, [controlledDate]);

  const handleClassChange = (classId: string) => {
    setInternalClassId(classId);
    onClassIdChange?.(classId);
    loadPage(classId, selectedDate || page.date);
  };

  const changeDate = (delta: number) => {
    const base = controlledDate || selectedDate || page.date;
    if (!base) return;
    const d = new Date(base + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const nextDate = localDateYmd(d);
    setSelectedDate(nextDate);
    onDateChange?.(nextDate);
    loadPage(effectiveClassId, nextDate);
  };

  const isPastDate = activeDate ? isPastDateYmd(activeDate) : false;

  const updateStudentStatus = (studentId: string, status: AttendanceStatusValue) => {
    if (isPastDate) {
      toast({
        title: "Past date",
        description: "Attendance cannot be edited for previous days.",
        variant: "destructive",
      });
      return;
    }
    setPage((prev) => {
      const students = prev.students.map((student) => {
        if (student.id !== studentId) return student;
        const nextStatus = student.attendancestatus === status ? "" : status;
        return { ...student, attendancestatus: nextStatus };
      });
      return {
        ...prev,
        students,
        summary: {
          total: students.length,
          present: students.filter((s) => s.attendancestatus === "present").length,
          absent: students.filter((s) => s.attendancestatus === "absent").length,
          late: students.filter((s) => s.attendancestatus === "late").length,
        },
      };
    });
  };

  const handleMarkAllPresent = () => {
    if (isPastDate) {
      toast({
        title: "Past date",
        description: "Attendance cannot be edited for previous days.",
        variant: "destructive",
      });
      return;
    }
    setPage((prev) => {
      const students = prev.students.map((student) => ({
        ...student,
        attendancestatus: "present",
      }));
      return {
        ...prev,
        students,
        summary: {
          total: students.length,
          present: students.length,
          absent: 0,
          late: 0,
        },
      };
    });
  };

  const handleSave = async () => {
    const classId = effectiveClassId;
    const date = activeDate;
    if (date && isPastDateYmd(date)) {
      toast({
        title: "Past date",
        description: "Attendance cannot be edited for previous days.",
        variant: "destructive",
      });
      return;
    }
    const items = page.students
      .filter(
        (s) =>
          s.attendancestatus === "present" ||
          s.attendancestatus === "absent" ||
          s.attendancestatus === "late"
      )
      .map((s) => ({ studentid: s.id, status: s.attendancestatus }));

    if (!classId || !date) {
      toast({ title: "Error", description: "Select a class and date.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({
        title: "No attendance to save",
        description: "Mark at least one student's attendance.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const data = await attendanceService.saveBulk(classId, date, items);
      setPage(data);
      setInternalClassId(data.selectedclassid);
      setSelectedDate(data.date);
      onDateChange?.(data.date);
      onClassIdChange?.(data.selectedclassid);
      toast({
        title: "Attendance saved",
        description: "Attendance has been recorded successfully.",
      });
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast({
        title: "Error",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const displayDate = activeDate
    ? new Date(activeDate + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const hasMarkedStudents = page.students.some(
    (s) =>
      s.attendancestatus === "present" ||
      s.attendancestatus === "absent" ||
      s.attendancestatus === "late"
  );

  const markedCount =
    page.summary.present + page.summary.absent + page.summary.late;

  return (
    <Card className="shadow-lg border-border/50 overflow-hidden" id="staff-attendance-section">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      <CardHeader className="pb-3 space-y-4">
        {!embedded ? (
          <div>
            <CardTitle className="font-display text-xl">Mark attendance</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Record daily attendance for your classes
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!hideDateControls ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => changeDate(-1)} disabled={loading}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 min-w-0 flex-1 sm:flex-initial">
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{displayDate || "Date"}</span>
              </div>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => changeDate(1)} disabled={loading}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 sm:justify-end sm:ml-auto">
            {!embedded ? (
              <Select
                value={effectiveClassId}
                onValueChange={handleClassChange}
                disabled={loading || page.classes.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {page.classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              disabled={loading || page.students.length === 0 || isPastDate}
            >
              All present
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={handleSave}
              disabled={
                saving ||
                loading ||
                page.students.length === 0 ||
                !hasMarkedStudents ||
                isPastDate
              }
            >
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {isPastDate ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Past date — view only.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <SummaryPill label="Present" value={page.summary.present} tone="green" />
          <SummaryPill label="Absent" value={page.summary.absent} tone="red" />
          <SummaryPill label="Late" value={page.summary.late} tone="amber" />
          <SummaryPill
            label="Marked"
            value={`${markedCount}/${page.summary.total || page.students.length}`}
            tone="muted"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : page.students.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {page.selectedclassid ? "No students in this class." : "Select a class to begin."}
          </div>
        ) : (
          <div className="space-y-2 max-h-[min(520px,60vh)] overflow-y-auto pr-1">
            {page.students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onStatusChange={updateStudentStatus}
                readOnly={isPastDate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "green" | "red" | "amber" | "muted";
}) {
  const styles = {
    green: "bg-green-50 text-green-800 border-green-200",
    red: "bg-red-50 text-red-800 border-red-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    muted: "bg-muted/50 text-foreground border-border",
  };
  return (
    <div className={cn("rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-1.5", styles[tone])}>
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function StudentRow({
  student,
  onStatusChange,
  readOnly,
}: {
  student: StudentWithAttendanceItem;
  onStatusChange: (studentId: string, status: AttendanceStatusValue) => void;
  readOnly?: boolean;
}) {
  const status = student.attendancestatus;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card",
        "hover:bg-muted/30 transition-colors"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
          {student.rollnumber || "—"}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">{student.fullname || "—"}</div>
          <div className="text-xs text-muted-foreground truncate">{student.studentid || student.id}</div>
        </div>
        {status === "present" ? (
          <Badge variant="outline" className="hidden sm:inline-flex border-green-300 text-green-700 bg-green-50 shrink-0">
            Present
          </Badge>
        ) : null}
        {status === "absent" ? (
          <Badge variant="outline" className="hidden sm:inline-flex border-red-300 text-red-700 bg-red-50 shrink-0">
            Absent
          </Badge>
        ) : null}
        {status === "late" ? (
          <Badge variant="outline" className="hidden sm:inline-flex border-amber-300 text-amber-800 bg-amber-50 shrink-0">
            Late
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant={status === "present" ? "default" : "outline"}
          size="icon"
          className={cn("h-8 w-8", status === "present" && "bg-green-600 hover:bg-green-700")}
          disabled={readOnly}
          onClick={() => onStatusChange(student.id, "present")}
          title="Present"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          variant={status === "absent" ? "default" : "outline"}
          size="icon"
          className={cn("h-8 w-8", status === "absent" && "bg-red-600 hover:bg-red-700")}
          disabled={readOnly}
          onClick={() => onStatusChange(student.id, "absent")}
          title="Absent"
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          variant={status === "late" ? "default" : "outline"}
          size="icon"
          className={cn("h-8 w-8", status === "late" && "bg-yellow-600 hover:bg-yellow-700")}
          disabled={readOnly}
          onClick={() => onStatusChange(student.id, "late")}
          title="Late"
        >
          <Clock className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
