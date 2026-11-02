import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  GraduationCap, 
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Printer
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reportTypes = [
  {
    id: "attendance",
    title: "Attendance Report",
    description: "Comprehensive attendance records by class, student, or date range",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "primary",
  },
  {
    id: "student-performance",
    title: "Student Performance",
    description: "Academic performance metrics and grade distributions",
    icon: <TrendingUp className="w-8 h-8" />,
    color: "secondary",
  },
  {
    id: "class-summary",
    title: "Class Summary",
    description: "Overview of class sizes, assignments, and statistics",
    icon: <PieChart className="w-8 h-8" />,
    color: "accent",
  },
  {
    id: "staff-report",
    title: "Staff Report",
    description: "Staff workload, class assignments, and attendance",
    icon: <Users className="w-8 h-8" />,
    color: "purple",
  },
  {
    id: "enrollment",
    title: "Enrollment Report",
    description: "Student enrollment trends and demographics",
    icon: <GraduationCap className="w-8 h-8" />,
    color: "primary",
  },
  {
    id: "financial",
    title: "Fee Collection",
    description: "Fee payment status and pending collections",
    icon: <FileSpreadsheet className="w-8 h-8" />,
    color: "secondary",
  },
];

const recentReports = [
  { name: "Monthly Attendance Report - December 2023", date: "Jan 5, 2024", type: "PDF" },
  { name: "Student Performance Q4 2023", date: "Jan 3, 2024", type: "Excel" },
  { name: "Enrollment Summary 2023-24", date: "Dec 28, 2023", type: "PDF" },
  { name: "Staff Attendance Report", date: "Dec 20, 2023", type: "PDF" },
];

const colorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  purple: "bg-purple/10 text-purple",
};

const AdminReports = () => {
  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">Generate and download various reports</p>
          </div>
          <div className="flex gap-2">
            <Select defaultValue="monthly">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report types grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <Card key={report.id} className="shadow-lg border-border/50 hover:shadow-xl transition-all cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${colorClasses[report.color]}`}>
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Reports */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Recently Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/50 gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{report.name}</div>
                      <div className="text-sm text-muted-foreground">{report.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                      {report.type}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
