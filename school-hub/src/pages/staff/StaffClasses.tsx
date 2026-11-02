import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  ClipboardList,
  Clock,
  GraduationCap,
  MapPin,
  Users,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  NotebookPen,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { pageService } from "@/services/page.service";
import { StaffClassAttendanceSection } from "@/pages/staff/StaffClassAttendanceSection";
import { StaffClassHomeworkSection } from "@/pages/staff/StaffClassHomeworkSection";
import { localDateYmd, shiftYmd } from "@/utils/date";
import { cn } from "@/lib/utils";

const accentBars = [
  "from-primary to-primary/60",
  "from-secondary to-secondary/60",
  "from-emerald-500 to-emerald-600/70",
  "from-violet-500 to-violet-600/70",
];

type ClassWithDetails = {
  id: string;
  name: string;
  subject: string;
  students: number;
  room: string;
  schedule: string;
};

type ClassPanelTab = "attendance" | "homework";

const StaffClasses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [myClasses, setMyClasses] = useState<ClassWithDetails[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState(() => searchParams.get("classId") ?? "");
  const [selectedDate, setSelectedDate] = useState(localDateYmd());
  const [activeTab, setActiveTab] = useState<ClassPanelTab>(() => {
    const t = searchParams.get("tab");
    return t === "homework" ? "homework" : "attendance";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "homework" || tab === "attendance") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      try {
        const page = await pageService.getStaffClassesPage();
        const classes = Array.isArray(page.classes)
          ? page.classes.map((row) => {
              const item = row as Record<string, unknown>;
              return {
                id: String(item.id ?? ""),
                name: String(item.name ?? ""),
                subject: String(item.subject ?? "N/A"),
                students: Number(item.students ?? 0),
                room: String(item.room ?? "N/A"),
                schedule: String(item.schedule ?? "N/A"),
              };
            })
          : [];
        setMyClasses(classes);
        setTotalStudents(Number(page.totalstudents ?? 0));
        setTotalHours(Number(page.totalhours ?? 0));
        const fromUrl = searchParams.get("classId");
        if (fromUrl && classes.some((c) => c.id === fromUrl)) {
          setSelectedClassId(fromUrl);
        } else if (classes.length > 0) {
          setSelectedClassId((prev) => prev || classes[0].id);
        }
      } catch (error) {
        console.error("Failed to load classes:", error);
        toast({
          title: "Error",
          description: "Failed to load classes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [toast, searchParams]);

  const selectClass = (classId: string) => {
    setSelectedClassId(classId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("classId", classId);
      next.set("tab", activeTab);
      return next;
    });
  };

  const handleTabChange = (tab: string) => {
    const next = tab === "homework" ? "homework" : "attendance";
    setActiveTab(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (selectedClassId) params.set("classId", selectedClassId);
      params.set("tab", next);
      return params;
    });
  };

  const selectedClass = myClasses.find((c) => c.id === selectedClassId);

  const displayDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
              Classes & attendance
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl">
              Select a class, then mark attendance or assign homework for the same day.
            </p>
          </div>
          {!loading && myClasses.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{myClasses.length} classes</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">{totalStudents} students</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">{totalHours}h / week</span>
              </div>
            </div>
          ) : null}
        </div>

        {loading && myClasses.length === 0 ? (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            <Skeleton className="h-[420px] rounded-xl" />
            <Skeleton className="h-[420px] rounded-xl" />
          </div>
        ) : myClasses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No classes assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,320px)_1fr] gap-6 items-start">
            <aside className="space-y-3 lg:sticky lg:top-20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Your classes
              </p>
              <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                {myClasses.map((cls, index) => {
                  const isActive = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => selectClass(cls.id)}
                      className={cn(
                        "w-full text-left rounded-xl border bg-card overflow-hidden transition-all",
                        "hover:shadow-md hover:border-primary/30",
                        isActive
                          ? "ring-2 ring-primary border-primary/40 shadow-md"
                          : "border-border/60 shadow-sm"
                      )}
                    >
                      <div className={`h-1 bg-gradient-to-r ${accentBars[index % accentBars.length]}`} />
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display font-bold text-foreground truncate">{cls.name}</p>
                            <p className="text-sm text-primary font-medium truncate">{cls.subject}</p>
                          </div>
                          {isActive ? (
                            <Badge className="shrink-0 bg-primary/10 text-primary border-0">Active</Badge>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="rounded-lg bg-muted/60 py-2 px-1">
                            <p className="text-lg font-bold text-primary leading-none">{cls.students}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Students</p>
                          </div>
                          <div className="rounded-lg bg-muted/60 py-2 px-1 min-w-0">
                            <p className="text-xs font-semibold truncate" title={cls.room}>{cls.room}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Room</p>
                          </div>
                          <div className="rounded-lg bg-muted/60 py-2 px-1 min-w-0">
                            <p className="text-[10px] font-medium line-clamp-2 leading-tight" title={cls.schedule}>
                              {cls.schedule}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">When</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1 border-t border-border/50">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/staff/students?classId=${cls.id}`);
                            }}
                          >
                            <Users className="w-3.5 h-3.5 mr-1" />
                            Roster
                          </Button>
                          <Button
                            type="button"
                            variant={isActive ? "secondary" : "outline"}
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectClass(cls.id);
                            }}
                          >
                            <ClipboardList className="w-3.5 h-3.5 mr-1" />
                            Open
                          </Button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-w-0 space-y-4">
              {selectedClass ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        <span className="font-medium text-foreground">{selectedClass.name}</span>
                        <span className="mx-1">·</span>
                        {selectedClass.room}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(shiftYmd(selectedDate, -1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 min-w-[200px]">
                        <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{displayDate}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(shiftYmd(selectedDate, 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      {selectedDate !== localDateYmd() ? (
                        <Button variant="outline" size="sm" onClick={() => setSelectedDate(localDateYmd())}>
                          Today
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="attendance" className="gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Attendance
                      </TabsTrigger>
                      <TabsTrigger value="homework" className="gap-2">
                        <NotebookPen className="w-4 h-4" />
                        Homework
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="attendance" className="mt-4">
                      <StaffClassAttendanceSection
                        embedded
                        hideDateControls
                        selectedClassId={selectedClassId}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        onClassIdChange={setSelectedClassId}
                      />
                    </TabsContent>
                    <TabsContent value="homework" className="mt-4">
                      <StaffClassHomeworkSection
                        embedded
                        selectedClassId={selectedClassId}
                        className={selectedClass.name}
                        subjectLabel={selectedClass.subject}
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                      />
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Select a class from the list.
                  </CardContent>
                </Card>
              )}
            </main>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffClasses;
