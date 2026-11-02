import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import { examService } from "@/services/exam.service";
import { referenceValueService } from "@/services/reference-value.service";
import type { ExamSession, ExamSeries } from "@/models/exam.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import {
  buildGradePlannerRows,
  classMatchesGrade,
  dateWithinSeries,
  toApiTime,
  type GradePlannerRow,
} from "@/utils/examGradePlanner";
import { ArrowLeft, CalendarDays } from "lucide-react";

type ClassOption = {
  id: string;
  name: string;
  grade: string;
  gradeRefId: string;
  section: string;
  termId: string;
};

function gradeStorageKey(seriesId: string) {
  return `campusza_exam_series_grade_${seriesId}`;
}

const AdminExamSeriesDetail = () => {
  const { seriesId = "" } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<ExamSeries | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [gradeRefs, setGradeRefs] = useState<ReferenceValue[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [gradePlannerRows, setGradePlannerRows] = useState<GradePlannerRow[]>([]);
  const [gradeStartTime, setGradeStartTime] = useState("09:00");
  const [gradeEndTime, setGradeEndTime] = useState("10:00");
  const [gradeSaveBusy, setGradeSaveBusy] = useState(false);

  const load = useCallback(async () => {
    if (!seriesId) return;
    setLoading(true);
    try {
      const page = await pageService.getAdminExamsPage();
      setReferenceValues(
        mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]
      );
      setClassOptions(
        (Array.isArray(page.classoptions) ? page.classoptions : []).map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            grade: String(item.grade ?? ""),
            gradeRefId: String(item.graderefid ?? item.grade ?? ""),
            section: String(item.section ?? ""),
            termId: String(item.termid ?? ""),
          };
        })
      );
      const grades = await referenceValueService.getByCategory(ReferenceValueCategory.GRADE);
      setGradeRefs(grades.filter((g) => g.isActive !== false));
      const allSeries = await examService.selectSeries();
      const current = allSeries.find((s) => s.id === seriesId) ?? null;
      setSeries(current);
      setSessions(await examService.selectSessions(seriesId));
    } catch {
      toast({ title: "Failed to load exam series", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [seriesId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const grades = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.GRADE),
    [referenceValues]
  );

  const gradeOptions = useMemo(() => {
    const byId = new Map<string, ReferenceValue>();
    for (const g of gradeRefs) byId.set(g.id, g);
    for (const g of grades) {
      if (!byId.has(g.id)) byId.set(g.id, g);
    }
    return Array.from(byId.values()).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [gradeRefs, grades]);

  const selectedGrade = useMemo(
    () => gradeOptions.find((g) => g.id === selectedGradeId),
    [gradeOptions, selectedGradeId]
  );

  const classesForSelectedGrade = useMemo(() => {
    if (!selectedGrade || !series?.termId) return [];
    return classOptions.filter(
      (c) =>
        c.termId === series.termId &&
        classMatchesGrade(c.gradeRefId, c.grade, selectedGrade)
    );
  }, [classOptions, selectedGrade, series?.termId]);

  const gradeClassIds = useMemo(
    () => classesForSelectedGrade.map((c) => c.id),
    [classesForSelectedGrade]
  );

  const defaultGradeId = useMemo(() => {
    if (!series?.termId || gradeOptions.length === 0) return "";
    const stored = sessionStorage.getItem(gradeStorageKey(seriesId));
    if (stored && gradeOptions.some((g) => g.id === stored)) {
      const g = gradeOptions.find((x) => x.id === stored)!;
      const hasClasses = classOptions.some(
        (c) => c.termId === series.termId && classMatchesGrade(c.gradeRefId, c.grade, g)
      );
      if (hasClasses) return stored;
    }
    const withClasses = gradeOptions.find((g) =>
      classOptions.some(
        (c) => c.termId === series.termId && classMatchesGrade(c.gradeRefId, c.grade, g)
      )
    );
    return withClasses?.id ?? gradeOptions[0]?.id ?? "";
  }, [gradeOptions, classOptions, series?.termId, seriesId]);

  useEffect(() => {
    if (selectedGradeId || !defaultGradeId) return;
    setSelectedGradeId(defaultGradeId);
  }, [defaultGradeId, selectedGradeId]);

  useEffect(() => {
    if (selectedGradeId && seriesId) {
      sessionStorage.setItem(gradeStorageKey(seriesId), selectedGradeId);
    }
  }, [selectedGradeId, seriesId]);

  useEffect(() => {
    if (!selectedGrade || gradeClassIds.length === 0) {
      setGradePlannerRows([]);
      return;
    }
    setGradePlannerRows(
      buildGradePlannerRows(selectedGrade, referenceValues, gradeClassIds, sessions)
    );
  }, [selectedGrade, gradeClassIds, referenceValues, sessions]);

  const seriesEditable =
    series?.status !== "Published" && series?.status !== "Cancelled";

  const applySlotToAllRows = (start: string, end: string) => {
    setGradeStartTime(start);
    setGradeEndTime(end);
    setGradePlannerRows((prev) =>
      prev.map((r) => ({ ...r, startTime: start, endTime: end }))
    );
  };

  const applyDefaultTimesToAll = () => {
    setGradePlannerRows((prev) =>
      prev.map((r) => ({
        ...r,
        startTime: gradeStartTime,
        endTime: gradeEndTime,
      }))
    );
  };

  const updatePlannerRow = (subjectId: string, patch: Partial<GradePlannerRow>) => {
    setGradePlannerRows((prev) =>
      prev.map((r) => (r.subjectId === subjectId ? { ...r, ...patch } : r))
    );
  };

  const syncDuration = (start: string, end: string) => {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const diff = Math.max(0, toMinutes(end) - toMinutes(start));
    return diff || 30;
  };

  const saveGradePlanner = async () => {
    if (!seriesId || !series || !selectedGrade) return;
    if (gradeClassIds.length === 0) {
      toast({
        title: "No classes for this grade",
        description: "Add classes for the series term with this grade on Admin → Classes.",
        variant: "destructive",
      });
      return;
    }
    const toSave = gradePlannerRows.filter((r) => r.examDate.trim());
    if (toSave.length === 0) {
      toast({
        title: "Pick at least one exam date",
        description: "Enter a date for each subject you want in this timetable.",
        variant: "destructive",
      });
      return;
    }
    for (const row of toSave) {
      if (!dateWithinSeries(row.examDate, series.startDate, series.endDate)) {
        toast({
          title: "Date outside series",
          description: `${row.subjectName}: choose a date between ${series.startDate} and ${series.endDate}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setGradeSaveBusy(true);
    const errors: string[] = [];
    let savedCount = 0;
    try {
      for (const row of toSave) {
        const rowStart = toApiTime(row.startTime || gradeStartTime, "09:00:00");
        const rowEnd = toApiTime(row.endTime || gradeEndTime, "10:00:00");
        const durationMinutes = syncDuration(rowStart, rowEnd);
        try {
          await examService.saveSession({
            id: row.sessionId,
            examSeriesId: seriesId,
            subjectId: row.subjectId,
            examDate: row.examDate.slice(0, 10),
            startTime: rowStart,
            endTime: rowEnd,
            durationMinutes,
            maxMarks: 100,
            passingMarks: 35,
            classIds: gradeClassIds,
          });
          savedCount += 1;
        } catch (error: unknown) {
          const msg =
            error && typeof error === "object" && "response" in error
              ? String(
                  (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? ""
                )
              : error instanceof Error
                ? error.message
                : "Save failed";
          errors.push(`${row.subjectName}: ${msg || "Could not save"}`);
        }
      }
      await load();
      if (errors.length === 0) {
        toast({
          title: "Timetable saved",
          description: `${savedCount} exam session(s) for ${selectedGrade.name}. Plan other grades from the dropdown if needed.`,
        });
      } else {
        toast({
          title: "Some sessions could not be saved",
          description: errors.slice(0, 3).join(" · "),
          variant: "destructive",
        });
      }
    } finally {
      setGradeSaveBusy(false);
    }
  };

  const focusGradeForSession = (session: ExamSession) => {
    const firstClassId = session.classIds?.[0];
    const cls = classOptions.find((c) => c.id === firstClassId);
    if (cls) {
      const grade = gradeOptions.find((g) => classMatchesGrade(cls.gradeRefId, cls.grade, g));
      if (grade) setSelectedGradeId(grade.id);
    }
    requestAnimationFrame(() => {
      document.getElementById("grade-planner")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const classLabel = (id: string) => {
    const c = classOptions.find((x) => x.id === id);
    if (!c) return id;
    return [c.name, c.grade, c.section].filter(Boolean).join(" · ");
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/exams">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{series?.name || "Exam series"}</h1>
            <p className="text-muted-foreground text-sm">
              {series?.startDate} – {series?.endDate} · {series?.status} · plan by grade
            </p>
          </div>
        </div>

        <Card id="grade-planner">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" aria-hidden />
              Grade timetable
            </CardTitle>
            <CardDescription>
              Same day with morning and evening papers: give each subject its own start and end time (times must not
              overlap for the same students). Subjects come from Admin → Schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Grade</Label>
                <Select
                  value={selectedGradeId}
                  onValueChange={setSelectedGradeId}
                  disabled={!seriesEditable}
                >
                  <SelectTrigger aria-label="Grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Default start time</Label>
                <Input
                  type="time"
                  value={gradeStartTime}
                  onChange={(e) => setGradeStartTime(e.target.value)}
                  disabled={!seriesEditable}
                />
              </div>
              <div>
                <Label>Default end time</Label>
                <Input
                  type="time"
                  value={gradeEndTime}
                  onChange={(e) => setGradeEndTime(e.target.value)}
                  disabled={!seriesEditable}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Quick slot (all subjects):</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!seriesEditable}
                onClick={() => applySlotToAllRows("09:00", "12:00")}
              >
                Morning 9–12
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!seriesEditable}
                onClick={() => applySlotToAllRows("14:00", "17:00")}
              >
                Afternoon 2–5
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!seriesEditable}
                onClick={() => applySlotToAllRows("16:00", "18:00")}
              >
                Evening 4–6
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!seriesEditable}
                onClick={applyDefaultTimesToAll}
              >
                Apply default times to all
              </Button>
            </div>

            {selectedGrade && classesForSelectedGrade.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Applies to {classesForSelectedGrade.length} class(es):{" "}
                {classesForSelectedGrade.map(classLabel).join("; ")}
              </p>
            ) : selectedGrade ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                No classes for this grade in the exam series term. Check term on each class under Admin → Classes.
              </p>
            ) : null}

            {selectedGrade && gradePlannerRows.length === 0 && classesForSelectedGrade.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                No subjects on this grade. Open Admin → Schedule, select this grade, and save grade subjects first.
              </p>
            ) : null}

            {gradePlannerRows.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Exam date</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gradePlannerRows.map((row) => (
                      <TableRow key={row.subjectId}>
                        <TableCell>{row.subjectName}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={row.examDate}
                            min={series?.startDate?.slice(0, 10)}
                            max={series?.endDate?.slice(0, 10)}
                            disabled={!seriesEditable}
                            onChange={(e) => updatePlannerRow(row.subjectId, { examDate: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={row.startTime}
                            disabled={!seriesEditable}
                            onChange={(e) => updatePlannerRow(row.subjectId, { startTime: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            value={row.endTime}
                            disabled={!seriesEditable}
                            onChange={(e) => updatePlannerRow(row.subjectId, { endTime: e.target.value })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground">
                  Example: Maths and English both on 5 Dec — set Maths 09:00–11:00 and English 14:00–16:00. Overlapping
                  times on the same date for the same grade will fail validation.
                </p>
                <Button onClick={saveGradePlanner} disabled={!seriesEditable || gradeSaveBusy}>
                  {gradeSaveBusy ? "Saving…" : "Save timetable"}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All sessions</CardTitle>
            <CardDescription>
              Every grade you saved appears here. Use Edit to jump to that grade in the planner above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Loading sessions…
              </p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions yet. Choose a grade above and save dates for each subject.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Max / pass</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {resolveReferenceValueName(referenceValues, ReferenceValueCategory.SUBJECT, s.subjectId)}
                      </TableCell>
                      <TableCell>{s.examDate}</TableCell>
                      <TableCell>
                        {s.startTime?.slice(0, 5)} – {s.endTime?.slice(0, 5)}
                      </TableCell>
                      <TableCell>{s.durationMinutes} min</TableCell>
                      <TableCell>
                        {s.maxMarks} / {s.passingMarks}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {(s.classIds || []).map(classLabel).join(", ")}
                      </TableCell>
                      <TableCell>{s.status}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!seriesEditable}
                          onClick={() => focusGradeForSession(s)}
                        >
                          Edit in planner
                        </Button>
                        <Button size="sm" variant="link" asChild>
                          <Link to={`/admin/exams/${seriesId}/sessions/${s.id}/seating`}>Seating</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminExamSeriesDetail;
