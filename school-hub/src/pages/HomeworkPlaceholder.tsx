import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotebookPen } from "lucide-react";

type HomeworkPlaceholderProps = {
  role: "admin" | "staff" | "student";
};

const copy: Record<HomeworkPlaceholderProps["role"], { title: string; body: string }> = {
  admin: {
    title: "Student homework",
    body: "Assign and review homework by class. This module is next — staff will create homework; students will submit.",
  },
  staff: {
    title: "Homework",
    body: "Create homework for your classes and track student submissions. Coming next in the product focus.",
  },
  student: {
    title: "My homework",
    body: "View assigned homework and submit work. Coming next in the product focus.",
  },
};

const HomeworkPlaceholder = ({ role }: HomeworkPlaceholderProps) => {
  const text = copy[role];
  return (
    <DashboardLayout role={role} userName={role === "admin" ? "Admin User" : role === "staff" ? "Staff" : "Student"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{text.title}</h1>
          <p className="text-muted-foreground mt-1">Student homework management</p>
        </div>
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-primary" />
              In progress
            </CardTitle>
            <CardDescription>{text.body}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Current product focus: staff attendance, student attendance, student homework, and timetable.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export const AdminHomework = () => <HomeworkPlaceholder role="admin" />;
export const StaffHomework = () => <HomeworkPlaceholder role="staff" />;
export const StudentHomework = () => <HomeworkPlaceholder role="student" />;
