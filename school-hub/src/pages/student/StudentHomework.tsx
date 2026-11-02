import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronLeft, ChevronRight, NotebookPen, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { homeworkService, type StudentHomeworkPage } from "@/services/homework.service";
import { formatDisplayDate, formatShortDate, localDateYmd, shiftYmd } from "@/utils/date";

const emptyPage = (): StudentHomeworkPage => ({
  studentid: "",
  studentname: "",
  classid: "",
  classname: "",
  grade: "",
  section: "",
  date: "",
  subjects: [],
});

const StudentHomework = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(localDateYmd());
  const [page, setPage] = useState<StudentHomeworkPage>(emptyPage);

  const loadPage = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const data = await homeworkService.getStudentHomeworkPage(date);
        setPage(data);
        setSelectedDate(data.date || date);
      } catch (error) {
        console.error("Failed to load student homework:", error);
        toast({
          title: "Could not load homework",
          description: "Please sign in again or try another date.",
          variant: "destructive",
        });
        setPage(emptyPage());
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) {
      navigate("/signin");
      return;
    }
    try {
      const user = JSON.parse(raw) as { role?: string; studentId?: string };
      if (user.role !== "student" || !user.studentId) {
        navigate("/signin");
        return;
      }
    } catch {
      navigate("/signin");
      return;
    }
    loadPage(localDateYmd());
  }, [loadPage, navigate]);

  const homeworkCount = useMemo(
    () => page.subjects.reduce((sum, group) => sum + group.homework.length, 0),
    [page.subjects]
  );

  const classLabel = [page.classname, page.grade, page.section].filter(Boolean).join(" · ");

  return (
    <DashboardLayout role="student" userName={page.studentname || "Student"}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My homework</h1>
            <p className="text-muted-foreground mt-1">
              {classLabel ? `${classLabel} · ` : ""}
              Homework assigned for the selected date
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const next = shiftYmd(selectedDate, -1);
                setSelectedDate(next);
                loadPage(next);
              }}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (!e.target.value) return;
                setSelectedDate(e.target.value);
                loadPage(e.target.value);
              }}
              className="w-[160px]"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const next = shiftYmd(selectedDate, 1);
                setSelectedDate(next);
                loadPage(next);
              }}
              disabled={loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <NotebookPen className="w-4 h-4" />
          <span>{formatDisplayDate(selectedDate)}</span>
          <span>·</span>
          <span>
            {homeworkCount} assignment{homeworkCount === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading homework…</p>
        ) : !page.classid ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="py-12 text-center text-muted-foreground">
              No class enrollment found. Contact your school admin.
            </CardContent>
          </Card>
        ) : page.subjects.length === 0 ? (
          <Card className="border-border/50 shadow-lg">
            <CardContent className="py-12 text-center text-muted-foreground">
              No homework assigned for {formatDisplayDate(selectedDate)}.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {page.subjects.map((group) => (
              <Card key={group.subject} className="border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {group.subject}
                  </CardTitle>
                  <CardDescription>
                    {group.homework.length} assignment{group.homework.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.homework.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-semibold text-foreground">{item.title}</div>
                        {item.status ? (
                          <Badge variant="secondary" className="capitalize">
                            {item.status}
                          </Badge>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {item.staffname ? (
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.staffname}
                          </span>
                        ) : null}
                        {item.duedate ? (
                          <span>Due: {formatShortDate(item.duedate)}</span>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentHomework;
