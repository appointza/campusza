import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StudentTimetableSection } from "@/pages/student/StudentTimetableSection";

const StudentTimetable = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) {
      navigate("/signin");
      return;
    }
    try {
      const user = JSON.parse(raw) as { role?: string; studentId?: string; email?: string };
      if (user.role !== "student" || !user.studentId) {
        navigate("/signin");
        return;
      }
      if (user.email) setUserName(user.email);
    } catch {
      navigate("/signin");
    }
  }, [navigate]);

  return (
    <DashboardLayout role="student" userName={userName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Timetable</h1>
          <p className="text-muted-foreground mt-1">Your class schedule for the week</p>
        </div>
        <StudentTimetableSection />
      </div>
    </DashboardLayout>
  );
};

export default StudentTimetable;
