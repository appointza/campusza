import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pageService } from "@/services/page.service";
import { formatDisplayDate } from "@/utils/date";
import { CalendarClock } from "lucide-react";

type ExamRow = {
  sessionId: string;
  seriesName: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  instructions: string;
};

const StudentExams = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");
  const [classLabel, setClassLabel] = useState("");
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const page = await pageService.getStudentExamTimetablePage();
        const label = [page.classname, page.grade, page.section].filter(Boolean).join(" · ");
        setClassLabel(String(label));
        const rows = Array.isArray(page.exams) ? page.exams : [];
        setExams(
          rows.map((row) => {
            const item = row as Record<string, unknown>;
            return {
              sessionId: String(item.sessionid ?? ""),
              seriesName: String(item.seriesname ?? ""),
              subjectName: String(item.subjectname ?? ""),
              examDate: String(item.examdate ?? ""),
              startTime: String(item.starttime ?? ""),
              endTime: String(item.endtime ?? ""),
              durationMinutes: Number(item.durationminutes ?? 0),
              instructions: String(item.instructions ?? ""),
            };
          })
        );
      } catch {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout role="student" userName={userName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Exam timetable</h1>
          <p className="text-muted-foreground mt-1">Published exams for your class{classLabel ? `: ${classLabel}` : ""}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Upcoming exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : exams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published exams scheduled for your class yet.</p>
            ) : (
              <ul className="space-y-4">
                {exams.map((exam) => (
                  <li key={exam.sessionId} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-lg">{exam.subjectName}</p>
                        <p className="text-sm text-muted-foreground">{exam.seriesName}</p>
                      </div>
                      <Badge>{exam.durationMinutes} min</Badge>
                    </div>
                    <p className="mt-2 text-sm">
                      {formatDisplayDate(exam.examDate)} · {exam.startTime} – {exam.endTime}
                    </p>
                    {exam.instructions ? (
                      <p className="mt-2 text-sm text-muted-foreground">{exam.instructions}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentExams;
