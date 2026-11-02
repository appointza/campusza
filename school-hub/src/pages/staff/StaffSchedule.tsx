import { Fragment, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, RefreshCw, UserX, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { pageService } from "@/services/page.service";
import { formatDisplayDate, localDateYmd, localWeekdayName, resolveWeekdayKey, shiftYmd } from "@/utils/date";

const defaultWeekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

type ScheduleSlot = {
  scheduleId: string;
  class: string;
  subject: string;
  room: string;
  color: string;
  isToday: boolean;
  itemType: "regular" | "on_leave" | "covered" | "substitute";
  replacementTeacherName: string;
  originalTeacherName: string;
  note: string;
};

type TodayItem = {
  scheduleId: string;
  subject: string;
  className: string;
  room: string;
  time: string;
  timeSlot: string;
  color: string;
  itemType: "regular" | "on_leave" | "covered" | "substitute";
  replacementTeacherName: string;
  originalTeacherName: string;
  leaveType: string;
  note: string;
  status: string;
};

const colorClasses: Record<string, string> = {
  primary: "gradient-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  purple: "bg-purple text-white",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  ongoing: "bg-primary/10 text-primary",
  upcoming: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
};

const itemTypeLabels: Record<TodayItem["itemType"], string> = {
  regular: "Regular",
  on_leave: "On Leave",
  covered: "Substitute Assigned",
  substitute: "Substitute Duty",
};

function mapItemType(value: string): TodayItem["itemType"] {
  const v = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (v === "on_leave") return "on_leave";
  if (v === "covered") return "covered";
  if (v === "substitute") return "substitute";
  return "regular";
}

function resolveTimeSlotKey(item: { time: string; timeSlot: string }, slots: string[]): string {
  const raw = item.timeSlot.trim();
  if (raw && slots.includes(raw)) return raw;
  const start = item.time.split(" - ")[0]?.trim() ?? item.time.trim();
  const byStart = slots.find((s) => s.toLowerCase() === start.toLowerCase());
  if (byStart) return byStart;
  return slots.find((s) => item.time.includes(s)) ?? raw ?? start;
}

function isSubstituteRelated(itemType: TodayItem["itemType"]): boolean {
  return itemType === "substitute" || itemType === "covered";
}

function mapTodayItemFromSlot(time: string, slot: ScheduleSlot): TodayItem {
  return {
    scheduleId: slot.scheduleId,
    subject: slot.subject,
    className: slot.class,
    room: slot.room,
    time,
    timeSlot: "",
    color: slot.color,
    itemType: slot.itemType,
    replacementTeacherName: slot.replacementTeacherName,
    originalTeacherName: slot.originalTeacherName,
    leaveType: "",
    note: slot.note,
    status: "upcoming",
  };
}

function buildTodayItemsFromGrid(
  dayKey: string,
  slots: string[],
  data: Record<string, Record<string, ScheduleSlot | null>>
): TodayItem[] {
  return slots
    .map((time) => {
      const slot = data[dayKey]?.[time];
      return slot ? mapTodayItemFromSlot(time, slot) : null;
    })
    .filter((item): item is TodayItem => item !== null);
}

const StaffSchedule = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [weekDays, setWeekDays] = useState(defaultWeekDays);
  const [scheduleData, setScheduleData] = useState<Record<string, Record<string, ScheduleSlot | null>>>({});
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [selectedDate, setSelectedDate] = useState(() => localDateYmd());
  const [viewDay, setViewDay] = useState("");
  const [onLeaveToday, setOnLeaveToday] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);

  const resolvedViewDay = useMemo(
    () => resolveWeekdayKey(weekDays, viewDay || localWeekdayName()),
    [weekDays, viewDay]
  );

  const viewColumnIndex = useMemo(
    () => weekDays.findIndex((day) => day.toLowerCase() === resolvedViewDay.toLowerCase()),
    [weekDays, resolvedViewDay]
  );

  const isSelectedToday = selectedDate === localDateYmd();

  const displayDateItems = useMemo(() => {
    if (todayItems.length > 0) return todayItems;
    return buildTodayItemsFromGrid(resolvedViewDay, timeSlots, scheduleData);
  }, [todayItems, resolvedViewDay, timeSlots, scheduleData]);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const page = await pageService.getStaffSchedulePage("", selectedDate);
        const days = Array.isArray(page.weekdays)
          ? page.weekdays.map((d) => String(d))
          : defaultWeekDays;
        const slots = Array.isArray(page.timeslots)
          ? page.timeslots.map((t) => String(t))
          : DEFAULT_TIME_SLOTS;
        const cells = Array.isArray(page.cells) ? page.cells : [];
        const todayRows = Array.isArray(page.todayitems) ? page.todayitems : [];

        setWeekDays(days);
        setTimeSlots(slots);
        setViewDay(String(page.todayday ?? "") || localWeekdayName());
        setOnLeaveToday(Boolean(page.onleavetoday));
        setLeaveType(String(page.leavetype ?? ""));
        setHasSchedule(cells.length > 0 || todayRows.length > 0);

        const apiTodayItems: TodayItem[] = todayRows.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            scheduleId: String(item.scheduleid ?? ""),
            subject: String(item.subject ?? "Lesson"),
            className: String(item.classname ?? "N/A"),
            room: String(item.room ?? "N/A"),
            time: String(item.time ?? item.timeslot ?? ""),
            timeSlot: String(item.timeslot ?? ""),
            color: String(item.color ?? "primary"),
            itemType: mapItemType(String(item.itemtype ?? "regular")),
            replacementTeacherName: String(item.replacementteachername ?? ""),
            originalTeacherName: String(item.originalteachername ?? ""),
            leaveType: String(item.leavetype ?? ""),
            note: String(item.note ?? ""),
            status: String(item.status ?? "upcoming"),
          };
        });

        const data: Record<string, Record<string, ScheduleSlot | null>> = {};
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
            class: String(cell.classname ?? "N/A"),
            subject: String(cell.subject ?? "Lesson"),
            room: String(cell.room ?? "N/A"),
            color: String(cell.color ?? "primary"),
            isToday: Boolean(cell.istoday),
            itemType: mapItemType(String(cell.itemtype ?? "regular")),
            replacementTeacherName: String(cell.replacementteachername ?? ""),
            originalTeacherName: String(cell.originalteachername ?? ""),
            note: String(cell.note ?? ""),
          };
        });

        const dayKey = resolveWeekdayKey(days, String(page.todayday ?? "") || localWeekdayName());
        apiTodayItems.forEach((item) => {
          const slotKey = resolveTimeSlotKey(item, slots);
          if (!slotKey || !data[dayKey] || data[dayKey][slotKey] === undefined) return;

          const existing = data[dayKey][slotKey];
          if (item.itemType === "substitute") {
            if (!existing || existing.scheduleId !== item.scheduleId) {
              data[dayKey][slotKey] = {
                scheduleId: item.scheduleId,
                class: item.className,
                subject: item.subject,
                room: item.room,
                color: item.color,
                isToday: true,
                itemType: item.itemType,
                replacementTeacherName: item.replacementTeacherName,
                originalTeacherName: item.originalTeacherName,
                note: item.note,
              };
            }
            return;
          }

          if (existing && existing.scheduleId === item.scheduleId) {
            existing.itemType = item.itemType;
            existing.replacementTeacherName = item.replacementTeacherName;
            existing.originalTeacherName = item.originalTeacherName;
            existing.note = item.note;
            existing.subject = item.subject;
            if (item.itemType !== "regular") existing.color = item.color;
          }
        });

        setScheduleData(data);
        setTodayItems(apiTodayItems.length > 0 ? apiTodayItems : buildTodayItemsFromGrid(dayKey, slots, data));
      } catch (error) {
        console.error("Failed to load schedule:", error);
        toast({
          title: "Error",
          description: "Failed to load schedule. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [toast, selectedDate]);

  const slotCardClass = (slot: ScheduleSlot) => {
    if (slot.itemType === "substitute" || slot.itemType === "covered") {
      return "bg-amber-50 border border-amber-200 text-amber-950";
    }
    if (slot.itemType === "on_leave") {
      return "bg-red-50 border border-red-200 text-red-950";
    }
    return colorClasses[slot.color] ?? colorClasses.primary;
  };

  const renderSubstituteCornerBadge = () => (
    <span className="absolute -top-1 -right-1 rounded px-1 py-0 text-[9px] font-bold uppercase tracking-wide bg-amber-500 text-white shadow-sm">
      Sub
    </span>
  );

  const renderItemBadge = (item: TodayItem) => {
    if (item.itemType === "substitute") {
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-500 font-semibold">
          <RefreshCw className="w-3 h-3 mr-1" />
          Substitute
        </Badge>
      );
    }
    if (item.itemType === "covered") {
      return (
        <Badge className="bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-100 font-semibold">
          <RefreshCw className="w-3 h-3 mr-1" />
          Substitute
        </Badge>
      );
    }
    if (item.itemType === "on_leave") {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <UserX className="w-3 h-3 mr-1" />
          On leave{item.leaveType ? ` (${item.leaveType})` : ""}
        </Badge>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading schedule...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Default weekly template plus date-wise changes (leave &amp; substitutes)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(shiftYmd(selectedDate, -1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="w-[160px]"
            />
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(shiftYmd(selectedDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isSelectedToday && (
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(localDateYmd())}>
                Today
              </Button>
            )}
          </div>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {isSelectedToday ? "Today's Timetable" : "Date Timetable"}
            </CardTitle>
            <CardDescription>
              {formatDisplayDate(selectedDate)} ({resolvedViewDay}) · {displayDateItems.length} period
              {displayDateItems.length === 1 ? "" : "s"} · includes leave &amp; substitute changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onLeaveToday && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm flex items-center gap-2">
                <UserX className="w-4 h-4 text-amber-700" />
                You are on approved {leaveType || "leave"} on this date. Your classes show substitute coverage below.
              </div>
            )}

            {displayDateItems.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[88px_120px_1fr] gap-px bg-border text-sm">
                  <div className="bg-muted px-3 py-2 font-medium">Period</div>
                  <div className="bg-muted px-3 py-2 font-medium hidden sm:block">Time</div>
                  <div className="bg-muted px-3 py-2 font-medium">Class</div>
                  {displayDateItems.map((item, index) => {
                    const rowTone =
                      item.itemType === "substitute"
                        ? "bg-amber-50"
                        : item.itemType === "covered"
                          ? "bg-amber-50/70"
                          : item.itemType === "on_leave"
                            ? "bg-red-50"
                            : "bg-background";
                    return (
                    <Fragment key={`period-${item.scheduleId}-${item.time}-${item.itemType}`}>
                      <div className={`${rowTone} px-3 py-3 font-semibold text-muted-foreground`}>
                        P{index + 1}
                        {item.itemType === "substitute" ? (
                          <span className="block text-[10px] font-bold text-amber-700 mt-0.5">SUB</span>
                        ) : null}
                      </div>
                      <div className={`${rowTone} px-3 py-3 text-muted-foreground hidden sm:block`}>
                        {item.time}
                      </div>
                      <div className={`${rowTone} px-3 py-3`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{item.subject}</span>
                          {renderItemBadge(item)}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          {item.className} · {item.room}
                        </div>
                        {item.itemType === "substitute" ? (
                          <p className="text-xs text-amber-800 mt-1 font-medium">
                            You are covering for {item.originalTeacherName || "another teacher"}
                          </p>
                        ) : null}
                        {item.itemType === "covered" && item.replacementTeacherName ? (
                          <p className="text-xs text-amber-800 mt-1 font-medium">
                            Covered by {item.replacementTeacherName}
                          </p>
                        ) : null}
                        {item.note && item.itemType === "regular" ? (
                          <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                        ) : null}
                      </div>
                    </Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {displayDateItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No periods scheduled for {resolvedViewDay} on this date.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {!hasSchedule ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No weekly schedule assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="shadow-lg border-border/50 hidden lg:block">
              <CardHeader>
                <CardTitle>Default Weekly Timetable</CardTitle>
                <CardDescription>
                  Regular repeating schedule from admin. Use the date picker above for leave/substitute changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-1 text-xs">
                    <div className="p-2 font-semibold text-muted-foreground whitespace-nowrap">Time</div>
                    {weekDays.map((day, index) => (
                      <div
                        key={day}
                        className={`p-2 font-semibold text-center rounded-lg whitespace-nowrap ${
                          index === viewColumnIndex
                            ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                            : "text-foreground bg-muted/50"
                        }`}
                      >
                        {day}
                        {index === viewColumnIndex ? (
                          <div className="text-[10px] font-normal">{isSelectedToday ? "Today" : "Selected"}</div>
                        ) : null}
                      </div>
                    ))}

                    {timeSlots.map((time) => (
                      <Fragment key={time}>
                        <div className="p-2 text-xs text-muted-foreground border-t border-border/50 whitespace-nowrap">
                          {time}
                        </div>
                        {weekDays.map((day, index) => {
                          const slot = scheduleData[day]?.[time];
                          const isViewColumn = index === viewColumnIndex;
                          return (
                            <div
                              key={`${day}-${time}`}
                              className={`p-1 border-t border-border/50 min-h-[52px] ${
                                isViewColumn ? "bg-primary/5" : ""
                              }`}
                            >
                              {slot && (
                                <div
                                  className={`relative p-1 rounded-lg text-[11px] leading-tight ${slotCardClass(slot)} ${
                                    isSubstituteRelated(slot.itemType) ? "ring-1 ring-amber-400" : ""
                                  }`}
                                >
                                  {isSubstituteRelated(slot.itemType) ? renderSubstituteCornerBadge() : null}
                                  <div className="font-semibold truncate">{slot.subject}</div>
                                  <div className="truncate opacity-90">{slot.class}</div>
                                  {slot.itemType === "substitute" ? (
                                    <div className="text-[10px] mt-0.5 font-bold text-amber-800 truncate">
                                      Substitute
                                    </div>
                                  ) : null}
                                  {slot.itemType === "covered" ? (
                                    <div className="text-[10px] mt-0.5 font-bold text-amber-800 truncate">
                                      Substitute
                                    </div>
                                  ) : null}
                                  {slot.itemType === "on_leave" ? (
                                    <div className="text-[10px] mt-0.5 font-medium">On leave</div>
                                  ) : null}
                                  <div className="flex items-center gap-1 mt-0.5 opacity-80">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{slot.room}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:hidden space-y-4">
              {weekDays.map((day) => {
                const dayClasses = Object.entries(scheduleData[day] || {}).filter(([, slot]) => slot !== null);
                if (dayClasses.length === 0) return null;
                const isViewDay = day.toLowerCase() === resolvedViewDay.toLowerCase();

                return (
                  <Card key={day} className={`shadow-lg border-border/50 ${isViewDay ? "ring-1 ring-primary/30" : ""}`}>
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        {day}
                        {isViewDay ? <Badge>{isSelectedToday ? "Today" : "Selected"}</Badge> : null}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dayClasses.map(([time, slot]) =>
                        slot ? (
                          <div
                            key={`${day}-${time}`}
                            className={`p-4 rounded-xl ${slotCardClass(slot)}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="relative flex-1 min-w-0">
                                {isSubstituteRelated(slot.itemType) ? (
                                  <Badge className="mb-1 bg-amber-500 text-white hover:bg-amber-500 text-[10px] px-1.5 py-0">
                                    Substitute
                                  </Badge>
                                ) : null}
                                <div className="font-semibold">{slot.subject}</div>
                                <div className="text-sm opacity-90">{slot.class}</div>
                                {slot.itemType === "substitute" ? (
                                  <div className="text-xs font-medium mt-1 text-amber-800">
                                    For {slot.originalTeacherName || "teacher"}
                                  </div>
                                ) : null}
                                {slot.itemType === "covered" && slot.replacementTeacherName ? (
                                  <div className="text-xs font-medium mt-1 text-amber-800">
                                    {slot.replacementTeacherName}
                                  </div>
                                ) : null}
                                {slot.itemType === "on_leave" ? (
                                  <div className="text-xs font-medium mt-1">On leave</div>
                                ) : null}
                                <div className="flex items-center gap-1 text-sm opacity-80 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {slot.room}
                                </div>
                              </div>
                              <div className="text-sm font-medium whitespace-nowrap">{time}</div>
                            </div>
                          </div>
                        ) : null
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffSchedule;
