import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ExamValidationSummaryDialog } from "@/components/exams/ExamValidationSummaryDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/utils/date";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import { examService } from "@/services/exam.service";
import type { ExamSeries } from "@/models/exam.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import {
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
} from "lucide-react";

type SeriesRow = {
  id: string;
  name: string;
  termId: string;
  termName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: string;
  examTypeName: string;
  sessionCount: number;
};

type TermOption = { id: string; name: string; academicYear: string };

type LifecycleAction = "schedule" | "publish" | "cancel";
type ExamsListLayout = "table" | "cards";

const EXAMS_LAYOUT_STORAGE_KEY = "admin-exams-list-layout";

const cardAccentBars = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-accent to-accent/70",
  "from-purple to-purple/70",
];

function readExamsLayout(): ExamsListLayout {
  try {
    const v = sessionStorage.getItem(EXAMS_LAYOUT_STORAGE_KEY);
    return v === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
}

function normalizeSeriesStatus(status: string) {
  return (status || "Draft").trim().toLowerCase();
}

function seriesStatusBadgeLabel(status: string) {
  const s = normalizeSeriesStatus(status);
  if (s === "published") return "Published · active";
  if (s === "scheduled") return "Scheduled";
  if (s === "draft") return "Draft";
  return status || "Draft";
}

function seriesLifecycleFlags(row: SeriesRow) {
  const st = normalizeSeriesStatus(row.status);
  return {
    st,
    canSchedule: st === "draft" && row.sessionCount > 0,
    canPublish: st === "scheduled",
  };
}

function formatSeriesDateRange(start: string, end: string) {
  if (!start && !end) return "—";
  const a = start ? formatDisplayDate(start) : "—";
  const b = end ? formatDisplayDate(end) : "—";
  return `${a} – ${b}`;
}

type ExamSeriesActionsProps = {
  row: SeriesRow;
  onEdit: () => void;
  onValidate: () => void;
  onLifecycle: (action: LifecycleAction) => void;
  layout: ExamsListLayout;
};

function ExamSeriesActions({ row, onEdit, onValidate, onLifecycle, layout }: ExamSeriesActionsProps) {
  const { st, canSchedule, canPublish } = seriesLifecycleFlags(row);
  const scheduleTitle = canSchedule
    ? "Draft → Scheduled"
    : st !== "draft"
      ? "Only draft series can be scheduled"
      : "Add at least one session on the timetable";
  const publishTitle = canPublish
    ? "Scheduled → Published (active for students)"
    : "Schedule the series first, then publish";

  const workflowButtons = (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={!canSchedule}
        title={scheduleTitle}
        onClick={() => onLifecycle("schedule")}
        className={layout === "cards" ? "flex-1 min-w-[7rem]" : undefined}
      >
        Schedule
      </Button>
      <Button
        size="sm"
        disabled={!canPublish}
        title={publishTitle}
        onClick={() => onLifecycle("publish")}
        className={layout === "cards" ? "flex-1 min-w-[7rem]" : undefined}
      >
        Publish (active)
      </Button>
    </>
  );

  const overflowMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" aria-label={`More actions for ${row.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onValidate}>Validate</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onLifecycle("cancel")}>
          Cancel series
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (layout === "cards") {
    return (
      <div className="space-y-2 pt-3 border-t border-border/60">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" asChild className="flex-1 min-w-[8rem]">
            <Link to={`/admin/exams/${row.id}`}>
              <CalendarDays className="h-4 w-4 mr-1" aria-hidden />
              Timetable
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" aria-hidden />
            Edit
          </Button>
          {overflowMenu}
        </div>
        <div className="flex flex-wrap gap-2">{workflowButtons}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end items-center gap-1.5">
      <Button size="sm" variant="secondary" asChild>
        <Link to={`/admin/exams/${row.id}`}>
          <CalendarDays className="h-4 w-4 mr-1" aria-hidden />
          Timetable
        </Link>
      </Button>
      <Button size="sm" variant="ghost" onClick={onEdit} aria-label={`Edit ${row.name}`}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline" onClick={onValidate}>
        Validate
      </Button>
      {workflowButtons}
      {overflowMenu}
    </div>
  );
}

const AdminExams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [halfDayPolicy, setHalfDayPolicy] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<SeriesRow | null>(null);
  const [form, setForm] = useState<Partial<ExamSeries>>({
    name: "",
    termId: "",
    startDate: "",
    endDate: "",
    examTypeRefId: "",
    instructions: "",
  });
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationTitle, setValidationTitle] = useState("");
  const [validationDescription, setValidationDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{ id: string; action: LifecycleAction } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [listLayout, setListLayout] = useState<ExamsListLayout>(() => readExamsLayout());

  const setLayout = (layout: ExamsListLayout) => {
    setListLayout(layout);
    try {
      sessionStorage.setItem(EXAMS_LAYOUT_STORAGE_KEY, layout);
    } catch {
      /* ignore */
    }
  };

  const assessments = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ASSESSMENT),
    [referenceValues]
  );

  const filteredSeries = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return series;
    return series.filter((row) => {
      const yearLabel =
        resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, row.academicYear) ||
        row.academicYear;
      return [row.name, row.termName, yearLabel, row.examTypeName, row.status, seriesStatusBadgeLabel(row.status)]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(needle));
    });
  }, [series, searchTerm, referenceValues]);

  const load = async () => {
    setLoading(true);
    try {
      const page = await pageService.getAdminExamsPage();
      const policy = page.schedulingpolicy as Record<string, unknown> | undefined;
      setHalfDayPolicy(String(policy?.halfdaypolicy ?? ""));
      const rows = Array.isArray(page.series) ? page.series : [];
      setSeries(
        rows.map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            termId: String(item.termid ?? ""),
            termName: String(item.termname ?? ""),
            academicYear: String(item.academicyear ?? ""),
            startDate: String(item.startdate ?? ""),
            endDate: String(item.enddate ?? ""),
            status: String(item.status ?? ""),
            examTypeName: String(item.examtypename ?? ""),
            sessionCount: Number(item.sessioncount ?? 0),
          };
        })
      );
      setTerms(
        (Array.isArray(page.termoptions) ? page.termoptions : []).map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            academicYear: String(item.academicyear ?? ""),
          };
        })
      );
      setReferenceValues(
        mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]
      );
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        toast({
          title: "Exam API not on this server",
          description:
            "POST /api/campusza/page/GetAdminExamsPage returned 404. Redeploy the latest Campusza API (TakeBuild) and run Database/migrations/create_exam_module.sql on Postgres. Check GET /api/campusza/Version — fileUtc should be recent and api.GetAdminExamsPage should be true.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Failed to load exams", description: "Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditRow(null);
    setForm({ name: "", termId: "", startDate: "", endDate: "", examTypeRefId: "", instructions: "" });
    setDialogOpen(true);
  };

  const openEdit = async (row: SeriesRow) => {
    const full = (await examService.selectSeries()).find((s) => s.id === row.id);
    setEditRow(row);
    setForm({
      id: row.id,
      name: row.name,
      termId: row.termId,
      academicYear: row.academicYear,
      startDate: row.startDate,
      endDate: row.endDate,
      examTypeRefId: full?.examTypeRefId ?? "",
      instructions: full?.instructions ?? "",
    });
    setDialogOpen(true);
  };

  const onTermChange = (termId: string) => {
    const term = terms.find((t) => t.id === termId);
    setForm((prev) => ({
      ...prev,
      termId,
      academicYear: term?.academicYear ?? prev.academicYear,
    }));
  };

  const saveSeries = async (openTimetableAfter = false) => {
    try {
      const saved = await examService.saveSeries(form);
      setDialogOpen(false);
      await load();
      const isCreate = !editRow;
      if ((isCreate || openTimetableAfter) && saved.id) {
        toast({
          title: isCreate ? "Series created" : "Series saved",
          description: "Set exam dates per subject for each grade on the timetable.",
        });
        navigate(`/admin/exams/${saved.id}`);
        return;
      }
      toast({ title: "Exam series updated" });
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "response" in error
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      toast({
        title: "Could not save series",
        description: msg || (error instanceof Error ? error.message : "Check dates and term."),
        variant: "destructive",
      });
    }
  };

  const runValidateOnly = async (id: string) => {
    try {
      const result = await examService.validateSeries(id);
      setValidationTitle("Validation summary");
      setValidationDescription("Review issues before scheduling or publishing.");
      setValidationErrors(result.errors ?? []);
      setPendingAction(null);
      setValidationOpen(true);
    } catch {
      toast({ title: "Validation failed", variant: "destructive" });
    }
  };

  const startLifecycle = async (id: string, action: LifecycleAction) => {
    try {
      const result = await examService.validateSeries(id);
      const errors = action === "cancel" ? [] : (result.errors ?? []);
      setValidationTitle(
        action === "publish" ? "Publish exam series?" : action === "schedule" ? "Schedule exam series?" : "Cancel exam series?"
      );
      setValidationDescription(
        action === "cancel"
          ? "Students will no longer see this series after cancellation."
          : errors.length
            ? "Fix validation issues before continuing."
            : "Validation passed. Confirm to proceed."
      );
      setValidationErrors(errors);
      setPendingAction(errors.length ? null : { id, action });
      setCancelReason("");
      setValidationOpen(true);
    } catch {
      toast({ title: "Could not validate series", variant: "destructive" });
    }
  };

  const confirmLifecycle = async () => {
    if (!pendingAction) return;
    try {
      if (pendingAction.action === "schedule") {
        await examService.scheduleSeries(pendingAction.id);
        toast({
          title: "Series scheduled",
          description: "Next step: Publish (active) so students see the exam timetable.",
        });
      } else if (pendingAction.action === "publish") {
        await examService.publishSeries(pendingAction.id);
        toast({
          title: "Exam series is active",
          description: "Published — students can see these exams on their timetable.",
        });
      } else if (pendingAction.action === "cancel") {
        if (!cancelReason.trim()) {
          toast({ title: "Cancellation reason is required", variant: "destructive" });
          return;
        }
        await examService.cancelSeries(pendingAction.id, cancelReason.trim());
        toast({ title: "Series cancelled" });
      }
      await load();
    } catch (error: unknown) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "See server message.",
        variant: "destructive",
      });
    }
  };

  const openLifecycleFromEdit = (action: LifecycleAction) => {
    if (!editRow) return;
    setDialogOpen(false);
    void startLifecycle(editRow.id, action);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">Exams</h1>
            <p className="text-muted-foreground mt-1">
              Create a series, then set subject exam dates by grade on the timetable page.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" aria-hidden />
                New series
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editRow ? "Edit exam series" : "Create exam series"}</DialogTitle>
                <DialogDescription>
                  {editRow ? (
                    <>
                      Update name, term, dates, assessment type, and instructions here. Subject exam dates are edited
                      on the grade timetable (button below). While status is Draft or Scheduled you can change sessions;
                      then use Schedule → Publish on the list.
                    </>
                  ) : (
                    <>
                      Set the exam period (name, term, dates). After save you will open the grade timetable to assign
                      dates per subject.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {editRow ? (
                <>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Status:{" "}
                    <Badge
                      variant={
                        normalizeSeriesStatus(editRow.status) === "published" ? "default" : "secondary"
                      }
                    >
                      {seriesStatusBadgeLabel(editRow.status)}
                    </Badge>
                    {editRow.sessionCount > 0
                      ? ` · ${editRow.sessionCount} session(s)`
                      : " · no sessions yet — open timetable"}
                  </p>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                    <p className="font-medium">Make exams active for students</p>
                    {normalizeSeriesStatus(editRow.status) === "draft" && (
                      <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                        <li>Save changes (details or grade timetable)</li>
                        <li>
                          <strong>Schedule</strong> — locks the plan for go-live
                        </li>
                        <li>
                          <strong>Publish (active)</strong> — students see exams on their timetable
                        </li>
                      </ol>
                    )}
                    {normalizeSeriesStatus(editRow.status) === "scheduled" && (
                      <p className="text-muted-foreground">
                        Scheduled and ready. Click <strong>Publish (active)</strong> below (or on the list) so students
                        can see it.
                      </p>
                    )}
                    {normalizeSeriesStatus(editRow.status) === "published" && (
                      <p className="text-muted-foreground">
                        This series is published and active for students. To change sessions you must cancel or use
                        correction flows on published sessions.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
              <div className="grid gap-3 py-2">
                <div>
                  <Label htmlFor="series-name">Name</Label>
                  <Input
                    id="series-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Term</Label>
                  <Select value={form.termId} onValueChange={onTermChange}>
                    <SelectTrigger aria-label="Term">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="series-start">Start date</Label>
                    <Input
                      id="series-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="series-end">End date</Label>
                    <Input
                      id="series-end"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Assessment type</Label>
                  <Select
                    value={form.examTypeRefId}
                    onValueChange={(v) => setForm({ ...form, examTypeRefId: v })}
                  >
                    <SelectTrigger aria-label="Assessment type">
                      <SelectValue placeholder="From reference values (assessment)" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="series-instructions">Instructions</Label>
                  <Textarea
                    id="series-instructions"
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                {editRow ? (
                  <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                    <Link to={`/admin/exams/${editRow.id}`} onClick={() => setDialogOpen(false)}>
                      <CalendarDays className="h-4 w-4 mr-1" aria-hidden />
                      Edit grade timetable
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                  {editRow && normalizeSeriesStatus(editRow.status) === "draft" && editRow.sessionCount > 0 ? (
                    <Button type="button" variant="outline" onClick={() => openLifecycleFromEdit("schedule")}>
                      Schedule
                    </Button>
                  ) : null}
                  {editRow && normalizeSeriesStatus(editRow.status) === "scheduled" ? (
                    <Button type="button" onClick={() => openLifecycleFromEdit("publish")}>
                      Publish (active)
                    </Button>
                  ) : null}
                  {editRow ? (
                    <>
                      <Button type="button" variant="secondary" onClick={() => saveSeries(false)}>
                        Save details
                      </Button>
                      <Button type="button" onClick={() => saveSeries(true)}>
                        Save & open timetable
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => saveSeries(true)}>
                      Save & open timetable
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {halfDayPolicy ? (
          <p className="text-xs text-muted-foreground border rounded-md p-3">{halfDayPolicy}</p>
        ) : null}

        <Card className="shadow-sm border-border/50">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" aria-hidden />
                  Exam series
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Edit series details with the pencil. Subject dates on Timetable. Draft → Schedule → Publish (active).
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground sr-only sm:not-sr-only">View</span>
                <div className="inline-flex rounded-lg border bg-muted/30 p-0.5" role="group" aria-label="List layout">
                  <Button
                    type="button"
                    size="sm"
                    variant={listLayout === "table" ? "secondary" : "ghost"}
                    className="h-8 px-2.5"
                    aria-pressed={listLayout === "table"}
                    onClick={() => setLayout("table")}
                  >
                    <List className="h-4 w-4 mr-1.5" aria-hidden />
                    List
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={listLayout === "cards" ? "secondary" : "ghost"}
                    className="h-8 px-2.5"
                    aria-pressed={listLayout === "cards"}
                    onClick={() => setLayout("cards")}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1.5" aria-hidden />
                    Cards
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Search name, term, type, status…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Search exam series"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm" aria-live="polite">
                Loading exam series…
              </p>
            ) : series.length === 0 ? (
              <p className="text-muted-foreground text-sm">No exam series yet. Create one to build a timetable.</p>
            ) : filteredSeries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No series match your search.</p>
            ) : listLayout === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSeries.map((row, index) => {
                  const st = normalizeSeriesStatus(row.status);
                  const yearLabel =
                    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, row.academicYear) ||
                    row.academicYear ||
                    "—";
                  return (
                    <Card
                      key={row.id}
                      className="shadow-sm border-border/50 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div
                        className={cn("h-1.5 bg-gradient-to-r", cardAccentBars[index % cardAccentBars.length])}
                        aria-hidden
                      />
                      <CardContent className="pt-4 pb-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/admin/exams/${row.id}`}
                              className="font-display font-semibold text-lg text-primary hover:underline truncate block"
                            >
                              {row.name}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {row.termName} · {yearLabel}
                            </p>
                          </div>
                          <Badge variant={st === "published" ? "default" : "secondary"} className="shrink-0">
                            {seriesStatusBadgeLabel(row.status)}
                          </Badge>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">Dates</dt>
                            <dd className="font-medium">{formatSeriesDateRange(row.startDate, row.endDate)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Type</dt>
                            <dd className="font-medium truncate">{row.examTypeName || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Sessions</dt>
                            <dd className="font-medium">{row.sessionCount}</dd>
                          </div>
                        </dl>
                        <ExamSeriesActions
                          row={row}
                          layout="cards"
                          onEdit={() => void openEdit(row)}
                          onValidate={() => void runValidateOnly(row.id)}
                          onLifecycle={(action) => void startLifecycle(row.id, action)}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Academic year</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="hidden lg:table-cell">Dates</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right min-w-[280px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeries.map((row) => {
                      const st = normalizeSeriesStatus(row.status);
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium max-w-[140px]">
                            <Link className="text-primary hover:underline truncate block" to={`/admin/exams/${row.id}`}>
                              {row.name}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {resolveReferenceValueName(
                              referenceValues,
                              ReferenceValueCategory.ACADEMIC_YEAR,
                              row.academicYear
                            ) ||
                              row.academicYear ||
                              "—"}
                          </TableCell>
                          <TableCell>{row.termName}</TableCell>
                          <TableCell className="hidden lg:table-cell whitespace-nowrap text-sm">
                            {formatSeriesDateRange(row.startDate, row.endDate)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{row.examTypeName || "—"}</TableCell>
                          <TableCell>{row.sessionCount}</TableCell>
                          <TableCell>
                            <Badge variant={st === "published" ? "default" : "secondary"}>
                              {seriesStatusBadgeLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right align-top py-3">
                            <ExamSeriesActions
                              row={row}
                              layout="table"
                              onEdit={() => void openEdit(row)}
                              onValidate={() => void runValidateOnly(row.id)}
                              onLifecycle={(action) => void startLifecycle(row.id, action)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExamValidationSummaryDialog
        open={validationOpen}
        onOpenChange={setValidationOpen}
        title={validationTitle}
        description={validationDescription}
        errors={validationErrors}
        confirmLabel={
          pendingAction?.action === "publish"
            ? "Publish (active)"
            : pendingAction?.action === "schedule"
              ? "Schedule"
              : "Cancel series"
        }
        destructive={pendingAction?.action === "cancel"}
        requireReason={pendingAction?.action === "cancel"}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onConfirm={confirmLifecycle}
      />
    </DashboardLayout>
  );
};

export default AdminExams;
