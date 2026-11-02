import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, ExternalLink, TrendingUp } from "lucide-react";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import { studentEnrollmentService } from "@/services/student-enrollment.service";
import { staffService } from "@/services/staff.service";
import type { Class } from "@/models/class.model";
import type { PromotionOutcome } from "@/models/student-enrollment.model";
import { getPromotionOutcomeLabel } from "@/models/student-enrollment.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";

type StudentRow = {
  enrollmentId: string;
  studentId: string;
  internalId: string;
  admissionNumber: string;
  displayName: string;
  academicYear: string;
  classId: string;
  className: string;
  grade: string;
  section: string;
  rollNumber?: number;
};

function mapPageRow(item: Record<string, unknown>): StudentRow {
  const first = String(item.firstname ?? "");
  const last = String(item.lastname ?? "");
  const full = String(item.fullname ?? `${first} ${last}`.trim());
  return {
    enrollmentId: String(item.enrollmentid ?? item.enrollmentId ?? ""),
    studentId: String(item.studentid ?? item.studentId ?? ""),
    internalId: String(item.id ?? ""),
    admissionNumber: String(item.admissionnumber ?? item.studentid ?? ""),
    displayName: full || String(item.admissionnumber ?? "Student"),
    academicYear: String(item.academicyear ?? item.currentacademicyear ?? ""),
    classId: String(item.classid ?? ""),
    className: String(item.classname ?? ""),
    grade: String(item.classgrade ?? item.classGrade ?? ""),
    section: String(item.section ?? ""),
    rollNumber: item.rollnumber != null ? Number(item.rollnumber) : undefined,
  };
}

function academicYearsMatch(
  yearA: string | undefined,
  yearB: string | undefined,
  referenceValues: ReferenceValue[]
): boolean {
  const a = yearA?.trim();
  const b = yearB?.trim();
  if (!b) return true;
  if (!a) return false;
  if (a === b) return true;
  const nameA =
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, a) || a;
  const nameB =
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, b) || b;
  return nameA === nameB;
}

function sectionsMatch(
  sectionA: string | undefined,
  sectionB: string | undefined,
  referenceValues: ReferenceValue[]
): boolean {
  const a = sectionA?.trim();
  const b = sectionB?.trim();
  if (!b) return true;
  if (!a) return false;
  if (a === b) return true;
  const nameA =
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.CLASS_SECTION, a) || a;
  const nameB =
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.CLASS_SECTION, b) || b;
  return nameA === nameB;
}

function studentInSourceClass(
  student: StudentRow,
  fromClassId: string,
  fromClass: Class | undefined,
  referenceValues: ReferenceValue[]
): boolean {
  if (student.classId === fromClassId) return true;
  if (!fromClass) return false;
  return (
    student.className === fromClass.name &&
    academicYearsMatch(student.academicYear, fromClass.academicYear, referenceValues)
  );
}

const AdminStudentPromotion = () => {
  const { toast } = useToast();
  const organizationId = staffService.getOrganizationId();
  const promotedBy = staffService.getSessionEmail() || "admin";

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);

  const [promoteForm, setPromoteForm] = useState({
    fromAcademicYear: "",
    fromClassId: "",
    fromSection: "",
    toAcademicYear: "",
    toClassId: "",
    toSection: "",
    notes: "",
  });
  const [promoteSelections, setPromoteSelections] = useState<
    Record<string, { selected: boolean; outcome: PromotionOutcome; rollNumber: number }>
  >({});
  const [promoteSaving, setPromoteSaving] = useState(false);

  const [transferStudentId, setTransferStudentId] = useState("");
  const [transferForm, setTransferForm] = useState({
    toClassId: "",
    rollNumber: 1,
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });
  const [transferSaving, setTransferSaving] = useState(false);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const page = await pageService.getAdminStudentsPage();
      setReferenceValues(
        mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]
      );
      setClasses(
        (Array.isArray(page.classoptions) ? page.classoptions : []).map((row) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            grade: String(item.grade ?? ""),
            section: String(item.section ?? ""),
            academicYear: String(item.academicyear ?? ""),
          } as Class;
        })
      );
      setStudents(
        (Array.isArray(page.rows) ? page.rows : []).map((row) => mapPageRow(row as Record<string, unknown>))
      );
    } catch {
      toast({
        title: "Failed to load data",
        description: "Could not load students and classes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fromClass = useMemo(
    () => classes.find((c) => c.id === promoteForm.fromClassId),
    [classes, promoteForm.fromClassId]
  );

  useEffect(() => {
    if (!fromClass) return;
    const yearLabel =
      resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, fromClass.academicYear) ||
      fromClass.academicYear;
    setPromoteForm((prev) => ({
      ...prev,
      fromAcademicYear: yearLabel || prev.fromAcademicYear,
    }));
  }, [fromClass?.id, fromClass?.academicYear, referenceValues]);

  const promoteCandidates = useMemo(() => {
    if (!promoteForm.fromClassId) return [];
    return students.filter(
      (s) =>
        studentInSourceClass(s, promoteForm.fromClassId, fromClass, referenceValues) &&
        sectionsMatch(s.section, promoteForm.fromSection, referenceValues)
    );
  }, [students, promoteForm.fromClassId, promoteForm.fromSection, fromClass, referenceValues]);

  const targetClassOptions = useMemo(() => {
    if (!promoteForm.toAcademicYear) return classes;
    return classes.filter(
      (c) =>
        c.academicYear === promoteForm.toAcademicYear ||
        resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, c.academicYear) ===
          promoteForm.toAcademicYear
    );
  }, [classes, promoteForm.toAcademicYear, referenceValues]);

  useEffect(() => {
    const init: typeof promoteSelections = {};
    promoteCandidates.forEach((s, i) => {
      init[s.internalId] = {
        selected: false,
        outcome: "promote",
        rollNumber: s.rollNumber ?? i + 1,
      };
    });
    setPromoteSelections(init);
  }, [
    promoteForm.fromClassId,
    promoteForm.fromSection,
    promoteCandidates.length,
  ]);

  const transferSource = useMemo(
    () => students.find((s) => s.studentId === transferStudentId || s.internalId === transferStudentId),
    [students, transferStudentId]
  );

  const transferClassOptions = useMemo(() => {
    if (!transferSource) return classes;
    return classes.filter((c) => c.id !== transferSource.classId);
  }, [classes, transferSource]);

  const handlePromote = async () => {
    const selected = Object.entries(promoteSelections).filter(([, v]) => v.selected);
    if (selected.length === 0) {
      toast({ title: "No students selected", variant: "destructive" });
      return;
    }
    const toClass = classes.find((c) => c.id === promoteForm.toClassId);
    if (!toClass || !promoteForm.fromClassId || !promoteForm.fromAcademicYear || !promoteForm.toAcademicYear) {
      toast({ title: "Missing fields", description: "Select source and target year/class.", variant: "destructive" });
      return;
    }
    setPromoteSaving(true);
    try {
      const updated = await studentEnrollmentService.promoteStudents({
        organizationId,
        fromAcademicYear: promoteForm.fromAcademicYear,
        fromClassId: promoteForm.fromClassId,
        fromSection: "",
        toAcademicYear: promoteForm.toAcademicYear,
        toClassId: promoteForm.toClassId,
        toClassName: toClass.name,
        toGrade: toClass.grade,
        toSection: promoteForm.toSection || toClass.section,
        promotedBy,
        notes: promoteForm.notes,
        students: selected.map(([internalId, v]) => ({
          studentId: internalId,
          outcome: v.outcome,
          rollNumber: v.rollNumber,
        })),
      });
      if (updated.length === 0) {
        toast({
          title: "No enrollments updated",
          description: "No active enrollments matched the source class. Refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Promotion complete",
        description: `${updated.length} student(s) processed. History is on each student profile.`,
      });
      await loadData();
    } catch {
      toast({ title: "Promotion failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setPromoteSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferSource?.enrollmentId || !transferForm.toClassId) {
      toast({ title: "Select student and target class", variant: "destructive" });
      return;
    }
    const toClass = classes.find((c) => c.id === transferForm.toClassId);
    if (!toClass) return;
    setTransferSaving(true);
    try {
      await studentEnrollmentService.transferStudent({
        organizationId,
        studentId: transferSource.internalId,
        enrollmentId: transferSource.enrollmentId,
        toClassId: transferForm.toClassId,
        toClassName: toClass.name,
        toGrade: toClass.grade,
        toSection: toClass.section,
        rollNumber: transferForm.rollNumber,
        reason: transferForm.reason,
        effectiveDate: transferForm.effectiveDate,
      });
      toast({
        title: "Transfer complete",
        description: `${transferSource.displayName} moved to ${toClass.name}.`,
      });
      setTransferStudentId("");
      setTransferForm({
        toClassId: "",
        rollNumber: 1,
        reason: "",
        effectiveDate: new Date().toISOString().split("T")[0],
      });
      await loadData();
    } catch {
      toast({ title: "Transfer failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setTransferSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-4 sm:space-y-6 min-w-0 max-w-5xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Promotion &amp; transfer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Move students to a new class or academic year. Previous enrollments are kept for history.{" "}
            <Link to="/admin/students" className="text-primary underline-offset-4 hover:underline inline-flex items-center gap-1">
              Students <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>

        <Tabs defaultValue="promote" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="promote" className="gap-1.5">
              <TrendingUp className="w-4 h-4" /> Promote
            </TabsTrigger>
            <TabsTrigger value="transfer" className="gap-1.5">
              <ArrowRightLeft className="w-4 h-4" /> Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="promote">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bulk promotion</CardTitle>
                <CardDescription>
                  End of year or term: select a source class, target year/class, then choose students and outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <Label>From class</Label>
                    <Select
                      value={promoteForm.fromClassId}
                      onValueChange={(v) => setPromoteForm({ ...promoteForm, fromClassId: v })}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => {
                          const yearLabel =
                            resolveReferenceValueName(
                              referenceValues,
                              ReferenceValueCategory.ACADEMIC_YEAR,
                              c.academicYear
                            ) || c.academicYear;
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {yearLabel ? `(${yearLabel})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label>From academic year</Label>
                    <Input
                      value={promoteForm.fromAcademicYear}
                      onChange={(e) => setPromoteForm({ ...promoteForm, fromAcademicYear: e.target.value })}
                      placeholder="e.g. 2026-2027"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label>To academic year</Label>
                    <Select
                      value={promoteForm.toAcademicYear}
                      onValueChange={(v) => setPromoteForm({ ...promoteForm, toAcademicYear: v, toClassId: "" })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYearOptions.map((y) => (
                          <SelectItem key={y.id} value={y.name}>
                            {y.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label>To class</Label>
                    <Select
                      value={promoteForm.toClassId}
                      onValueChange={(v) => {
                        const c = classes.find((x) => x.id === v);
                        setPromoteForm({
                          ...promoteForm,
                          toClassId: v,
                          toSection: c?.section ?? promoteForm.toSection,
                        });
                      }}
                      disabled={!promoteForm.toAcademicYear || targetClassOptions.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetClassOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {promoteForm.toAcademicYear && targetClassOptions.length === 0 ? (
                      <p className="text-xs text-amber-700">
                        No classes for {promoteForm.toAcademicYear}. Add one under Admin → Classes first.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5 min-w-0 sm:col-span-2">
                    <Label>To section (optional override)</Label>
                    <Input
                      value={promoteForm.toSection}
                      onChange={(e) => setPromoteForm({ ...promoteForm, toSection: e.target.value })}
                      placeholder="Uses class section if empty"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 sm:col-span-2">
                    <Label>Notes (optional)</Label>
                    <Input
                      value={promoteForm.notes}
                      onChange={(e) => setPromoteForm({ ...promoteForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10" />
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Roll</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="w-20">New roll</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Loading…
                          </TableCell>
                        </TableRow>
                      ) : !promoteForm.fromClassId ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Select a source class to list students.
                          </TableCell>
                        </TableRow>
                      ) : promoteCandidates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {students.length === 0
                              ? "No students with a current enrollment. Add students under Admin → Students."
                              : `No students in this class${fromClass ? ` (${fromClass.name})` : ""}. Pick the same class as on the Students page, or check for duplicate class names.`}
                          </TableCell>
                        </TableRow>
                      ) : (
                        promoteCandidates.map((s) => {
                          const sel = promoteSelections[s.internalId] ?? {
                            selected: false,
                            outcome: "promote" as PromotionOutcome,
                            rollNumber: 1,
                          };
                          return (
                            <TableRow key={s.internalId}>
                              <TableCell>
                                <Checkbox
                                  checked={sel.selected}
                                  onCheckedChange={(checked) =>
                                    setPromoteSelections({
                                      ...promoteSelections,
                                      [s.internalId]: { ...sel, selected: Boolean(checked) },
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium">{s.displayName}</TableCell>
                              <TableCell className="hidden sm:table-cell tabular-nums">{s.rollNumber ?? "—"}</TableCell>
                              <TableCell>
                                <Select
                                  value={sel.outcome}
                                  onValueChange={(v) =>
                                    setPromoteSelections({
                                      ...promoteSelections,
                                      [s.internalId]: { ...sel, outcome: v as PromotionOutcome },
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8 w-full min-w-[8rem]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(["promote", "repeat", "transfer_out", "left_school"] as PromotionOutcome[]).map(
                                      (o) => (
                                        <SelectItem key={o} value={o}>
                                          {getPromotionOutcomeLabel(o)}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  className="h-8 w-full"
                                  value={sel.rollNumber}
                                  onChange={(e) =>
                                    setPromoteSelections({
                                      ...promoteSelections,
                                      [s.internalId]: { ...sel, rollNumber: Number(e.target.value) || 1 },
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Button variant="hero" onClick={handlePromote} disabled={promoteSaving || loading}>
                  {promoteSaving ? "Saving…" : "Run promotion"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfer">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transfer class</CardTitle>
                <CardDescription>
                  Same academic year: move one student to another class or section. Recorded in transfer history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label>Student</Label>
                  <Select
                    value={transferStudentId}
                    onValueChange={(v) => {
                      setTransferStudentId(v);
                      const row = students.find((s) => s.studentId === v);
                      setTransferForm((f) => ({
                        ...f,
                        rollNumber: row?.rollNumber ?? 1,
                      }));
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {students.map((s) => (
                        <SelectItem key={s.studentId} value={s.studentId}>
                          {s.displayName} — {s.className || "No class"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {transferSource ? (
                  <p className="text-xs text-muted-foreground">
                    Current: {transferSource.className} · {transferSource.academicYear} · roll{" "}
                    {transferSource.rollNumber ?? "—"}
                  </p>
                ) : null}
                <div className="space-y-1.5">
                  <Label>To class</Label>
                  <Select
                    value={transferForm.toClassId}
                    onValueChange={(v) => setTransferForm({ ...transferForm, toClassId: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {transferClassOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Roll number</Label>
                  <Input
                    type="number"
                    value={transferForm.rollNumber}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, rollNumber: Number(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reason</Label>
                  <Input
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    placeholder="Optional note"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Effective date</Label>
                  <Input
                    type="date"
                    value={transferForm.effectiveDate}
                    onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                  />
                </div>
                <Button variant="hero" onClick={handleTransfer} disabled={transferSaving || loading}>
                  {transferSaving ? "Saving…" : "Transfer student"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudentPromotion;
