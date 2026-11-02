import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  NotebookPen,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  homeworkService,
  type AdminHomeworkClassCard,
  type AdminHomeworkPage,
} from "@/services/homework.service";
import { formatDisplayDate, localDateYmd, shiftYmd } from "@/utils/date";

const colorVariants = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-purple to-purple/70",
];

const emptyPage = (): AdminHomeworkPage => ({ date: "", classes: [] });

const AdminHomework = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(localDateYmd());
  const [page, setPage] = useState<AdminHomeworkPage>(emptyPage);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const loadPage = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const data = await homeworkService.getAdminHomeworkPage(date);
        setPage(data);
        setSelectedDate(data.date || date);
        setExpandedClassId(null);
      } catch (error) {
        console.error("Failed to load admin homework:", error);
        toast({
          title: "Error",
          description: "Failed to load homework.",
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
    loadPage(localDateYmd());
  }, [loadPage]);

  const classesWithHomework = useMemo(
    () => page.classes.filter((c) => c.subjects.length > 0),
    [page.classes]
  );

  const toggleClass = (classId: string) => {
    setExpandedClassId((prev) => (prev === classId ? null : classId));
  };

  const renderClassCard = (card: AdminHomeworkClassCard, index: number) => {
    const isExpanded = expandedClassId === card.classid;
    const subjectNames = card.subjects.map((s) => s.subject);
    const homeworkCount = card.subjects.reduce((sum, s) => sum + s.homework.length, 0);

    return (
      <Card
        key={card.classid}
        className={`shadow-lg border-border/50 overflow-hidden cursor-pointer transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isExpanded ? "ring-2 ring-primary/40" : ""
        }`}
        tabIndex={0}
        role="button"
        aria-expanded={isExpanded}
        onClick={() => toggleClass(card.classid)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleClass(card.classid);
          }
        }}
      >
        <div className={`h-2 bg-gradient-to-r ${colorVariants[index % colorVariants.length]}`} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="font-display text-lg">{card.classname}</CardTitle>
              {(card.grade || card.section) && (
                <CardDescription className="mt-0.5">
                  {[card.grade, card.section].filter(Boolean).join(" · ")}
                </CardDescription>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </div>

          {subjectNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {subjectNames.map((subject) => (
                <Badge key={subject} variant="secondary" className="font-normal">
                  {subject}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">No homework for this date</p>
          )}

          {homeworkCount > 0 && !isExpanded && (
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter or click to view {homeworkCount} assignment{homeworkCount === 1 ? "" : "s"}
            </p>
          )}
        </CardHeader>

        {isExpanded && card.subjects.length > 0 && (
          <CardContent className="space-y-4 border-t pt-4" onClick={(e) => e.stopPropagation()}>
            {card.subjects.map((group) => (
              <div key={group.subject} className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {group.subject}
                </div>
                {group.homework.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                    <div className="font-semibold">{item.title}</div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {item.staffname && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.staffname}
                        </span>
                      )}
                      {item.duedate ? <span>Due: {item.duedate}</span> : <span>No due date</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Homework</h1>
            <p className="text-muted-foreground mt-1">
              View homework by class — click a card or press Enter to see details
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <NotebookPen className="w-4 h-4" />
          {formatDisplayDate(selectedDate)} · {page.classes.length} class
          {page.classes.length === 1 ? "" : "es"} · {classesWithHomework.length} with homework
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading homework…</p>
        ) : page.classes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No classes found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.classes.map((card, index) => renderClassCard(card, index))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminHomework;
