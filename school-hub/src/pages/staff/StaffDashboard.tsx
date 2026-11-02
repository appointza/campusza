import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ClipboardList,
  BookOpen,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pageService } from "@/services/page.service";

type TodayClass = {
  subject: string;
  classname: string;
  time: string;
  status: string;
};

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  ongoing: "bg-primary/10 text-primary",
  upcoming: "bg-muted text-muted-foreground",
};

const StaffDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [classesToday, setClassesToday] = useState(0);
  const [attendanceMarked, setAttendanceMarked] = useState("0/0");
  const [nextClassIn, setNextClassIn] = useState("—");
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const page = await pageService.getStaffDashboardPage();
        setTotalStudents(Number(page.totalstudents ?? 0));
        setClassesToday(Number(page.classestoday ?? 0));
        setAttendanceMarked(String(page.attendancemarked ?? "0/0"));
        setNextClassIn(String(page.nextclassin ?? "—"));
        setTodayClasses(
          Array.isArray(page.todayclasses)
            ? page.todayclasses.map((row) => {
                const item = row as Record<string, unknown>;
                return {
                  subject: String(item.subject ?? ""),
                  classname: String(item.classname ?? ""),
                  time: String(item.time ?? ""),
                  status: String(item.status ?? "upcoming"),
                };
              })
            : []
        );
      } catch (error) {
        console.error("Failed to load staff dashboard:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p className="text-muted-foreground">Loading dashboard…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">Here's your schedule and tasks for today.</p>
          </div>
          <Button variant="cyan">
            <ClipboardList className="w-4 h-4 mr-2" />
            Mark Attendance
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="My Students" value={String(totalStudents)} icon={<GraduationCap className="w-6 h-6" />} color="primary" />
          <StatCard title="Classes Today" value={String(classesToday)} icon={<BookOpen className="w-6 h-6" />} color="secondary" />
          <StatCard title="Attendance Marked" value={attendanceMarked} icon={<CheckCircle className="w-6 h-6" />} color="accent" />
          <StatCard title="Next Class In" value={nextClassIn} icon={<Clock className="w-6 h-6" />} color="purple" />
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayClasses.length === 0 ? (
                <p className="text-muted-foreground">No classes scheduled for today.</p>
              ) : (
                todayClasses.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 gap-3"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {(item.classname.split("-")[1] || item.classname.charAt(0) || "?").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{item.subject}</div>
                        <div className="text-sm text-muted-foreground">{item.classname}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{item.time}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status] ?? statusColors.upcoming}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex-col gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            <span>Take Attendance</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <BookOpen className="w-6 h-6 text-secondary" />
            <span>View Students</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <Calendar className="w-6 h-6 text-accent" />
            <span>My Schedule</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <GraduationCap className="w-6 h-6 text-purple" />
            <span>Enter Grades</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
