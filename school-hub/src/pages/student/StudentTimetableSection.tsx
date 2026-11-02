import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, RefreshCw, User, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pageService } from "@/services/page.service";
import { formatDisplayDate, localDateYmd, localWeekdayName, resolveWeekdayKey, shiftYmd } from "@/utils/date";

const defaultWeekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

type TimetableSlot = {
  scheduleId: string;
  subject: string;
  teacher: string;
  room: string;
  time: string;
  itemType: "regular" | "on_leave" | "covered";
  replacementTeacherName: string;
  originalTeacherName: string;
  note: string;
};

type TodayPeriod = TimetableSlot & {
  timeSlot: string;
  leaveType: string;
  status: string;
};

function mapItemType(value: string): TimetableSlot["itemType"] {
  const v = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (v === "on_leave") return "on_leave";
  if (v === "covered") return "covered";
  return "regular";
}

const slotTone: Record<TimetableSlot["itemType"], string> = {
  regular: "bg-primary/10 text-primary border border-primary/20",
  covered: "bg-amber-50 border border-amber-200 text-amber-950",
  on_leave: "bg-red-50 border border-red-200 text-red-950",
};

export function StudentTimetableSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(localDateYmd());
  const [classLabel, setClassLabel] = useState("");
  const [hasSchedule, setHasSchedule] = useState(false);
  const [weekDays, setWeekDays] = useState(defaultWeekDays);
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [viewDay, setViewDay] = useState("");
  const [scheduleData, setScheduleData] = useState<Record<string, Record<string, TimetableSlot | null>>>({});
  const [todayItems, setTodayItems] = useState<TodayPeriod[]>([]);

  const resolvedViewDay = useMemo(
    () => resolveWeekdayKey(weekDays, viewDay || localWeekdayName()),
    [weekDays, viewDay]
  );

  const viewColumnIndex = useMemo(
    () => weekDays.findIndex((day) => day.toLowerCase() === resolvedViewDay.toLowerCase()),
    [weekDays, resolvedViewDay]
  );

  const isSelectedToday = selectedDate === localDateYmd();

  const loadTimetable = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const page = await pageService.getStudentTimetablePage(date);
        const days = Array.isArray(page.weekdays) ? page.weekdays.map((d) => String(d)) : defaultWeekDays;
        const slots = Array.isArray(page.timeslots) ? page.timeslots.map((t) => String(t)) : DEFAULT_TIME_SLOTS;
        const cells = Array.isArray(page.cells) ? page.cells : [];
        const todayRows = Array.isArray(page.todayitems) ? page.todayitems : [];

        const label = [page.classname, page.grade, page.section].filter(Boolean).join(" · ");
        setClassLabel(String(label));
        setWeekDays(days);
        setTimeSlots(slots);
        setViewDay(String(page.todayday ?? "") || localWeekdayName());
        setHasSchedule(cells.length > 0 || todayRows.length > 0);
        setSelectedDate(String(page.date ?? date));

        const apiTodayItems: TodayPeriod[] = todayRows.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            scheduleId: String(item.scheduleid ?? ""),
            subject: String(item.subject ?? "Lesson"),
            teacher: String(item.staffname ?? ""),
            room: String(item.room ?? "N/A"),
            time: String(item.time ?? item.timeslot ?? ""),
            timeSlot: String(item.timeslot ?? ""),
            itemType: mapItemType(String(item.itemtype ?? "regular")),
            replacementTeacherName: String(item.replacementteachername ?? ""),
            originalTeacherName: String(item.originalteachername ?? ""),
            note: String(item.note ?? ""),
            leaveType: String(item.leavetype ?? ""),
            status: String(item.status ?? "scheduled"),
          };
        });
        setTodayItems(apiTodayItems);

        const data: Record<string, Record<string, TimetableSlot | null>> = {};
        days.forEach((day) => {
          data[day] = {};
          slots.forEach((time) => {
            data[day][time] = null;
          });
        });

        cells.forEach((row) => {
          const cell = row as Record<string, unknown>;
          const day = String(cell.day ?? "");
          const timeslot = String(cell.timeslot ?? "");
          if (!data[day] || data[day][timeslot] === undefined) return;
          data[day][timeslot] = {
            scheduleId: String(cell.scheduleid ?? ""),
            subject: String(cell.subject ?? "Lesson"),
            teacher: String(cell.staffname ?? ""),
            room: String(cell.room ?? "N/A"),
            time: String(cell.time ?? timeslot),
            itemType: mapItemType(String(cell.itemtype ?? "regular")),
            replacementTeacherName: String(cell.replacementteachername ?? ""),
            originalTeacherName: String(cell.originalteachername ?? ""),
            note: String(cell.note ?? ""),
          };
        });

        setScheduleData(data);
      } catch (error) {
        console.error("Failed to load student timetable:", error);
        toast({
          title: "Could not load timetable",
          description: "Please try again.",
          variant: "destructive",
        });
        setHasSchedule(false);
        setTodayItems([]);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadTimetable(localDateYmd());
  }, [loadTimetable]);

  const renderPeriodBadge = (item: TodayPeriod) => {
    if (item.itemType === "covered") {
      return (
        <Badge className="bg-amber-100 text-amber-900 border border-amber-300">
          <RefreshCw className="w-3 h-3 mr-1" />
          Substitute
        </Badge>
      );
    }
    if (item.itemType === "on_leave") {
      return (
        <Badge className="bg-red-100 text-red-700">
          <UserX className="w-3 h-3 mr-1" />
          On leave{item.leaveType ? ` (${item.leaveType})` : ""}
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading timetable…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold">Class timetable</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {classLabel ? `${classLabel} · ` : ""}
            Weekly schedule with date-wise substitute changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const next = shiftYmd(selectedDate, -1);
              setSelectedDate(next);
              loadTimetable(next);
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (!e.target.value) return;
              setSelectedDate(e.target.value);
              loadTimetable(e.target.value);
            }}
            className="w-[160px]"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const next = shiftYmd(selectedDate, 1);
              setSelectedDate(next);
              loadTimetable(next);
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isSelectedToday && (
            <Button variant="outline" size="sm" onClick={() => loadTimetable(localDateYmd())}>
              Today
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            {isSelectedToday ? "Today's periods" : "Periods for selected date"}
          </CardTitle>
          <CardDescription>
            {formatDisplayDate(selectedDate)} ({resolvedViewDay}) · {todayItems.length} period
            {todayItems.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No periods scheduled for {resolvedViewDay} on this date.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-left">
                    <th className="px-3 py-2 font-medium w-16">#</th>
                    <th className="px-3 py-2 font-medium hidden sm:table-cell">Time</th>
                    <th className="px-3 py-2 font-medium">Subject</th>
                    <th className="px-3 py-2 font-medium hidden md:table-cell">Teacher</th>
                    <th className="px-3 py-2 font-medium hidden lg:table-cell">Room</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayItems.map((item, index) => (
                    <tr
                      key={`${item.scheduleId}-${item.time}`}
                      className={
                        item.itemType === "covered"
                          ? "bg-amber-50/70"
                          : item.itemType === "on_leave"
                            ? "bg-red-50/70"
                            : "bg-background"
                      }
                    >
                      <td className="px-3 py-3 font-semibold text-muted-foreground">P{index + 1}</td>
                      <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{item.time}</td>
                      <td className="px-3 py-3 font-medium">{item.subject}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {item.teacher || "—"}
                        </span>
                        {item.itemType === "covered" && item.originalTeacherName ? (
                          <p className="text-xs text-amber-800 mt-0.5">Usually {item.originalTeacherName}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">{item.room}</td>
                      <td className="px-3 py-3">{renderPeriodBadge(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!hasSchedule ? (
        <Card className="border-border/50 shadow-lg">
          <CardContent className="py-12 text-center text-muted-foreground">
            No weekly timetable published for your class yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-border/50 overflow-x-auto">
          <CardHeader>
            <CardTitle>Weekly timetable</CardTitle>
            <CardDescription>Regular class schedule — highlighted column is the selected date</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 min-w-[720px]">
            <div className="grid grid-cols-8 gap-1 text-xs">
              <div className="p-2 font-semibold text-muted-foreground">Time</div>
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={`p-2 font-semibold text-center rounded-lg ${
                    index === viewColumnIndex
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "text-foreground bg-muted/50"
                  }`}
                >
                  {day.slice(0, 3)}
                </div>
              ))}

              {timeSlots.map((time) => (
                <Fragment key={time}>
                  <div className="p-2 text-muted-foreground border-t border-border/50 whitespace-nowrap">{time}</div>
                  {weekDays.map((day, index) => {
                    const slot = scheduleData[day]?.[time];
                    const isViewColumn = index === viewColumnIndex;
                    return (
                      <div
                        key={`${day}-${time}`}
                        className={`p-1 border-t border-border/50 min-h-[52px] ${isViewColumn ? "bg-primary/5" : ""}`}
                      >
                        {slot ? (
                          <div className={`p-1.5 rounded-lg text-[11px] leading-tight ${slotTone[slot.itemType]}`}>
                            <div className="font-semibold truncate">{slot.subject}</div>
                            <div className="truncate opacity-90">{slot.teacher || "Teacher"}</div>
                            <div className="flex items-center gap-1 mt-0.5 opacity-80">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{slot.room}</span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
