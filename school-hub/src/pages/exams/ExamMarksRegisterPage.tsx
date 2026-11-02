import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { examService } from "@/services/exam.service";
import { pageService } from "@/services/page.service";
import type { ExamMarkRegister, ExamSeries } from "@/models/exam.model";
import type { ExamMarkAttendance } from "@/models/exam.model";
import { Printer, Save } from "lucide-react";

type CellEdit = {
  marksObtained: string;
  attendanceStatus: ExamMarkAttendance;
  expectedUpdatedAt?: string;
};

const ATTENDANCE_OPTIONS: ExamMarkAttendance[] = ["Pending", "Present", "Absent", "Excused", "Exempt"];

type Props = {
  role: "admin" | "staff";
};

export function ExamMarksRegisterPage({ role }: Props) {
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([]);
  const [seriesId, setSeriesId] = useState("");
  const [classId, setClassId] = useState("");
  const [register, setRegister] = useState<ExamMarkRegister | null>(null);
  const [edits, setEdits] = useState<Record<string, CellEdit>>({});
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState("");
  const [reopenReason, setReopenReason] = useState("");

  const cellKey = (sessionId: string, enrollmentId: string) => `${sessionId}:${enrollmentId}`;

  useEffect(() => {
    const load = async () => {
      try {
        const series = await examService.selectSeries();
        setSeriesList(series);
        if (isAdmin) {
          const page = await pageService.getAdminExamsPage();
          const classes = Array.isArray(page.classoptions) ? page.classoptions : [];
          setClassOptions(classes.map((c) => ({ id: String(c.id ?? ""), name: String(c.name ?? "") })));
        } else {
          const page = await pageService.getStaffClassesPage();
          setClassOptions(
            (page.classes || []).map((c) => ({
              id: String(c.id ?? ""),
              name: String(c.name ?? ""),
            }))
          );
        }
      } catch {
        toast({ title: "Failed to load exam marks page", variant: "destructive" });
      }
    };
    load();
  }, [isAdmin, toast]);

  const loadRegister = useCallback(async () => {
    if (!seriesId || !classId) return;
    setLoading(true);
    setSaveState("");
    try {
      const data = await examService.getMarkRegister(seriesId, classId);
      setRegister(data);
      const next: Record<string, CellEdit> = {};
      data.students.forEach((st) => {
        st.cells.forEach((c) => {
          next[cellKey(c.sessionid, c.enrollmentid)] = {
            marksObtained: c.marksobtained == null ? "" : String(c.marksobtained),
            attendanceStatus: c.attendancestatus,
            expectedUpdatedAt: c.updatedat,
          };
        });
      });
      setEdits(next);
    } catch {
      toast({ title: "Could not load register", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [seriesId, classId, toast]);

  useEffect(() => {
    loadRegister();
  }, [loadRegister]);

  const dirtyCells = useMemo(() => {
    if (!register) return [];
    const list: {
      sessionId: string;
      enrollmentId: string;
      marksObtained?: number | null;
      attendanceStatus: string;
      expectedUpdatedAt?: string;
    }[] = [];
    register.students.forEach((st) => {
      st.cells.forEach((c) => {
        const key = cellKey(c.sessionid, c.enrollmentid);
        const edit = edits[key];
        if (!edit) return;
        const marks =
          edit.attendanceStatus === "Absent" || edit.attendanceStatus === "Excused" || edit.attendanceStatus === "Exempt"
            ? null
            : edit.marksObtained === ""
              ? null
              : Number(edit.marksObtained);
        const changed =
          edit.attendanceStatus !== c.attendancestatus ||
          (c.marksobtained ?? null) !== (marks ?? null);
        if (changed) {
          list.push({
            sessionId: c.sessionid,
            enrollmentId: c.enrollmentid,
            marksObtained: marks,
            attendanceStatus: edit.attendanceStatus,
            expectedUpdatedAt: edit.expectedUpdatedAt,
          });
        }
      });
    });
    return list;
  }, [register, edits]);

  const saveDraft = async () => {
    if (!seriesId || !classId || dirtyCells.length === 0) return;
    setSaveState("Saving…");
    try {
      await examService.saveMarkRegister(seriesId, classId, dirtyCells);
      setSaveState("Saved");
      toast({ title: "Marks saved" });
      await loadRegister();
    } catch (err: unknown) {
      setSaveState("Save failed");
      const message =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "")
          : "";
      const stale = message.includes("Refresh and retry") || message.includes("updated by another");
      toast({
        title: stale ? "Data changed" : "Save failed",
        description: stale ? "Another user updated marks. Reload the register and try again." : message || undefined,
        variant: "destructive",
      });
      if (stale) await loadRegister();
    }
  };

  const displayMarks = (sessionId: string, enrollmentId: string, max: number) => {
    const edit = edits[cellKey(sessionId, enrollmentId)];
    if (!edit) return "—";
    if (edit.attendanceStatus === "Pending") return "—";
    if (edit.attendanceStatus !== "Present") return edit.attendanceStatus;
    if (edit.marksObtained === "") return "—";
    const n = Number(edit.marksObtained);
    if (Number.isNaN(n)) return "Invalid";
    if (n > max) return `>${max}`;
    return String(n);
  };

  const readOnly =
    register?.marksstatus === "Approved" ||
    (!isAdmin && register?.marksstatus === "Submitted");

  return (
    <DashboardLayout role={role}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { font-size: 11px; }
        }
      `}</style>
      <div className="space-y-6 print-area">
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <h1 className="text-2xl font-bold">Exam marks register</h1>
            <p className="text-sm text-muted-foreground">Class-wide entry by subject session</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()} disabled={!register}>
              <Printer className="h-4 w-4 mr-2" /> Print register
            </Button>
            <Button onClick={saveDraft} disabled={readOnly || dirtyCells.length === 0}>
              <Save className="h-4 w-4 mr-2" /> Save draft
            </Button>
          </div>
        </div>

        <Card className="no-print">
          <CardContent className="pt-6 grid md:grid-cols-2 gap-4">
            <div>
              <Label>Exam series</Label>
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select series" />
                </SelectTrigger>
                <SelectContent>
                  {seriesList.map((s) => (
                    <SelectItem key={s.id} value={s.id!}>
                      {s.name} ({s.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.filter((c) => c.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {register ? (
          <div className="flex flex-wrap gap-2 items-center no-print">
            <Badge variant="outline">Status: {register.marksstatus}</Badge>
            {saveState ? <span className="text-sm text-muted-foreground">{saveState}</span> : null}
            {!isAdmin && register.marksstatus === "Draft" ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!window.confirm("Submit this mark register to admin for approval? You will not be able to edit after submission.")) {
                    return;
                  }
                  try {
                    await examService.submitMarkRegister(seriesId, classId);
                    toast({ title: "Register submitted" });
                    await loadRegister();
                  } catch {
                    toast({ title: "Submit failed — complete all marks", variant: "destructive" });
                  }
                }}
              >
                Submit register
              </Button>
            ) : null}
            {isAdmin && register.marksstatus === "Submitted" ? (
              <Button
                onClick={async () => {
                  if (!window.confirm("Approve this class mark register?")) return;
                  try {
                    await examService.approveMarkRegister(seriesId, classId);
                    toast({ title: "Register approved" });
                    await loadRegister();
                  } catch {
                    toast({ title: "Approve failed", variant: "destructive" });
                  }
                }}
              >
                Approve register
              </Button>
            ) : null}
            {isAdmin && (register.marksstatus === "Submitted" || register.marksstatus === "Approved") ? (
              <div className="flex gap-2 items-end">
                <Input
                  placeholder="Reopen reason"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await examService.reopenMarkRegister(seriesId, classId, reopenReason);
                      toast({ title: "Register reopened" });
                      await loadRegister();
                    } catch {
                      toast({ title: "Reopen failed", variant: "destructive" });
                    }
                  }}
                >
                  Reopen
                </Button>
              </div>
            ) : null}
            {isAdmin ? (
              <Button
                variant="default"
                onClick={async () => {
                  if (!window.confirm("Publish exam results for this entire series? Students will see results after this.")) {
                    return;
                  }
                  try {
                    const res = (await examService.publishExamResults(seriesId)) as Record<string, unknown>;
                    if (res.success === false) {
                      toast({
                        title: "Publication blocked",
                        description: Array.isArray(res.errors) ? (res.errors as string[]).join(" ") : "",
                        variant: "destructive",
                      });
                    } else {
                      toast({ title: "Results published" });
                    }
                  } catch {
                    toast({ title: "Publish failed", variant: "destructive" });
                  }
                }}
              >
                Publish series results
              </Button>
            ) : null}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>
              {register?.examseriesname || "Register"} — {register?.classname || "Class"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !register || register.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select a series and class with exam sessions.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Student</TableHead>
                    {register.sessions.map((s) => (
                      <TableHead key={s.sessionid} className="min-w-[140px]">
                        {s.subjectname}
                        <div className="text-xs font-normal text-muted-foreground">Max {s.maxmarks}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {register.students.map((st) => (
                    <TableRow key={st.enrollmentid}>
                      <TableCell>{st.rollnumber ?? "—"}</TableCell>
                      <TableCell>{st.studentname}</TableCell>
                      {register.sessions.map((sess) => {
                        const key = cellKey(sess.sessionid, st.enrollmentid);
                        const edit = edits[key] ?? {
                          marksObtained: "",
                          attendanceStatus: "Pending" as ExamMarkAttendance,
                        };
                        return (
                          <TableCell key={sess.sessionid} className="align-top">
                            <div className="space-y-1 no-print">
                              <Select
                                value={edit.attendanceStatus}
                                disabled={readOnly}
                                onValueChange={(v) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...edit,
                                      attendanceStatus: v as ExamMarkAttendance,
                                      marksObtained:
                                        v === "Absent" || v === "Excused" || v === "Exempt" ? "" : edit.marksObtained,
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ATTENDANCE_OPTIONS.map((a) => (
                                    <SelectItem key={a} value={a}>
                                      {a}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                className="h-8"
                                type="number"
                                disabled={readOnly || edit.attendanceStatus !== "Present"}
                                placeholder="Marks"
                                value={edit.marksObtained}
                                onChange={(e) =>
                                  setEdits((prev) => ({
                                    ...prev,
                                    [key]: { ...edit, marksObtained: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <div className="hidden print:block">{displayMarks(sess.sessionid, st.enrollmentid, sess.maxmarks)}</div>
                          </TableCell>
                        );
                      })}
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
}

export default ExamMarksRegisterPage;
