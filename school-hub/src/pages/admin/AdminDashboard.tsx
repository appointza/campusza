import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Calendar,
  FileText,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  dashboardService,
  type AdminDashboardPage,
} from "@/services/dashboard.service";

const emptyPage = (): AdminDashboardPage => ({
  totalstudents: 0,
  totalstaff: 0,
  classestoday: 0,
  attendancerate: "—",
  recentactivities: [],
});

const AdminDashboard = () => {
  const { toast } = useToast();
  const [page, setPage] = useState<AdminDashboardPage>(emptyPage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getAdminDashboardPage();
        setPage(data);
      } catch (error) {
        console.error("Failed to load admin dashboard data", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
        });
        setPage(emptyPage());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <Button variant="hero">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={loading ? "—" : String(page.totalstudents)}
            icon={<GraduationCap className="w-6 h-6" />}
            color="primary"
          />
          <StatCard
            title="Staff Members"
            value={loading ? "—" : String(page.totalstaff)}
            icon={<Users className="w-6 h-6" />}
            color="secondary"
          />
          <StatCard
            title="Classes Today"
            value={loading ? "—" : String(page.classestoday)}
            icon={<Calendar className="w-6 h-6" />}
            color="accent"
          />
          <StatCard
            title="Attendance Rate"
            value={loading ? "—" : page.attendancerate}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : page.recentactivities.length === 0 ? (
                <p className="text-muted-foreground">No recent activity.</p>
              ) : (
                page.recentactivities.map((activity, index) => (
                  <div
                    key={`${activity.action}-${activity.name}-${index}`}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-foreground">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">{activity.name}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.timeago}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="font-display">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                <span>Add Student</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Users className="w-6 h-6 text-secondary" />
                <span>Add Staff</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <FileText className="w-6 h-6 text-accent" />
                <span>Generate Report</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="w-6 h-6 text-purple" />
                <span>Schedule Event</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
