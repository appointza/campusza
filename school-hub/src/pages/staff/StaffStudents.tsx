import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  Search,
  Eye,
  Plus,
  Edit,
  ArrowRightLeft,
  TrendingUp,
  Download,
  Upload,
  Filter,
  Users,
  ChevronRight,
  BookOpen,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff.service";
import { studentEnrollmentService } from "@/services/student-enrollment.service";
import { StudentEditDialog, type StudentEnrollmentContext } from "@/components/students/StudentEditDialog";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import type { Student } from "@/models/student.model";
import type { Class } from "@/models/class.model";
import type { StudentEnrollmentWithProfile, PromotionOutcome } from "@/models/student-enrollment.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueId,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import { getEnrollmentStatusLabel, getPromotionOutcomeLabel } from "@/models/student-enrollment.model";
import { admissionNumberService } from "@/services/admission-number.service";
import { defaultAdmissionNumberSettings, type AdmissionNumberSettings } from "@/models/admission-number.model";

type StudentRow = StudentEnrollmentWithProfile & {
  displayName: string;
};

const accentBars = [
  "from-primary to-primary/60",
  "from-secondary to-secondary/60",
  "from-emerald-500 to-emerald-600/70",
  "from-violet-500 to-violet-600/70",
];

const avatarGradients = [
  "from-primary to-accent",
  "from-cyan-500 to-secondary",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-600",
];

const statusChipClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "current" || s === "active") return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
  if (s === "completed") return "bg-sky-50 text-sky-800 border-sky-200/80";
  if (s === "transferred") return "bg-amber-50 text-amber-900 border-amber-200/80";
  return "bg-muted text-muted-foreground border-border";
};

function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

const StaffStudents = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState(() => searchParams.get("classId") ?? "");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editContext, setEditContext] = useState<{
    studentInternalId: string;
    enrollment: StudentEnrollmentContext;
  } | null>(null);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<StudentRow | null>(null);

  const [addForm, setAddForm] = useState<Partial<Student>>({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    dateOfBirth: "",
    parentGuardian: { name: "", relationship: "guardian", phone: "" },
    classId: "",
    rollNumber: 1,
    currentAcademicYear: "",
    admissionDate: new Date().toISOString().split("T")[0],
    status: "active",
  });

  const [promoteForm, setPromoteForm] = useState({
    fromAcademicYear: "",
    fromClassId: "",
    fromSection: "",
    toAcademicYear: "",
    toClassId: "",
    toSection: "",
  });
  const [promoteSelections, setPromoteSelections] = useState<
    Record<string, { selected: boolean; outcome: PromotionOutcome; rollNumber: number }>
  >({});

  const [admissionSettings, setAdmissionSettings] = useState<AdmissionNumberSettings>(defaultAdmissionNumberSettings());

  const [transferForm, setTransferForm] = useState({
    toClassId: "",
    rollNumber: 1,
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  const organizationId = staffService.getOrganizationId();
  const [resolvedStaffId, setResolvedStaffId] = useState("");

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );

  const studentCountByClass = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach((s) => {
      if (s.classId) counts.set(s.classId, (counts.get(s.classId) ?? 0) + 1);
    });
    return counts;
  }, [students]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  const addFormClassOptions = useMemo(() => {
    if (!addForm.currentAcademicYear) return classes;
    const yearName = resolveReferenceValueName(
      referenceValues,
      ReferenceValueCategory.ACADEMIC_YEAR,
      addForm.currentAcademicYear
    );
    if (!yearName) return classes;
    const matched = classes.filter((c) => c.academicYear === yearName);
    return matched.length > 0 ? matched : classes;
  }, [classes, addForm.currentAcademicYear, referenceValues]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const page = await pageService.getStaffStudentsPage();
      setResolvedStaffId(String(page.staffid ?? ""));
      setReferenceValues(mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]);
      setClasses(
        (Array.isArray(page.classes) ? page.classes : []).map((row) => {
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
        (Array.isArray(page.students) ? page.students : []).map((row) => {
          const item = row as Record<string, unknown>;
          return {
            enrollmentId: String(item.enrollmentid ?? ""),
            studentId: String(item.studentid ?? ""),
            admissionNumber: String(item.admissionnumber ?? ""),
            firstName: String(item.firstname ?? ""),
            lastName: String(item.lastname ?? ""),
            fullName: String(item.fullname ?? ""),
            email: String(item.email ?? ""),
            phone: String(item.phone ?? ""),
            academicYear: String(item.academicyear ?? ""),
            classId: String(item.classid ?? ""),
            className: String(item.classname ?? ""),
            grade: String(item.grade ?? ""),
            section: String(item.section ?? ""),
            rollNumber: item.rollnumber != null ? Number(item.rollnumber) : undefined,
            enrollmentStatus: String(item.enrollmentstatus ?? ""),
            status: String(item.status ?? ""),
            isCurrent: Boolean(item.iscurrent),
            studentStatus: String(item.studentstatus ?? ""),
            displayName: String(item.displayname ?? item.fullname ?? ""),
          } as StudentRow;
        })
      );
      } catch (error) {
        console.error("Failed to load students:", error);
        toast({
          title: "Error",
        description: "Failed to load students.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    loadData();
    admissionNumberService.getSettings().then(setAdmissionSettings).catch(() => undefined);
  }, [loadData]);

  useEffect(() => {
    const fromUrl = searchParams.get("classId");
    if (fromUrl && classes.some((c) => c.id === fromUrl)) {
      setSelectedClassId(fromUrl);
    } else if (classes.length > 0 && !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, searchParams, selectedClassId]);

  const selectClass = (classId: string) => {
    setSelectedClassId(classId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("classId", classId);
      return next;
    });
  };

  useEffect(() => {
    if (!addForm.classId) return;
    const stillValid = addFormClassOptions.some((c) => c.id === addForm.classId);
    if (!stillValid) {
      setAddForm((prev) => ({ ...prev, classId: "" }));
    }
  }, [addForm.classId, addFormClassOptions]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClassId && s.classId !== selectedClassId) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          s.displayName.toLowerCase().includes(q) ||
          s.admissionNumber.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [students, selectedClassId, searchTerm, statusFilter]);

  const rosterTotalForClass = selectedClassId ? (studentCountByClass.get(selectedClassId) ?? 0) : 0;
  const totalStudentsAllClasses = students.length;

  const openAddStudent = () => {
    const cls = classes.find((c) => c.id === selectedClassId);
    const yearId = cls
      ? resolveReferenceValueId(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, cls.academicYear)
      : "";
    const nextRoll =
      students
        .filter((s) => s.classId === selectedClassId)
        .reduce((max, s) => Math.max(max, s.rollNumber ?? 0), 0) + 1;
    setAddForm((prev) => ({
      ...prev,
      classId: selectedClassId,
      currentAcademicYear: yearId,
      rollNumber: nextRoll,
    }));
    setIsAddOpen(true);
  };

  const promoteCandidates = useMemo(() => {
    if (!promoteForm.fromClassId) return [];
    return students.filter(
      (s) =>
        s.classId === promoteForm.fromClassId &&
        (!promoteForm.fromSection || s.section === promoteForm.fromSection) &&
        (!promoteForm.fromAcademicYear || s.academicYear === promoteForm.fromAcademicYear)
    );
  }, [students, promoteForm]);

  const targetClassOptions = useMemo(() => {
    const selected = classes.find((c) => c.id === promoteForm.toClassId);
    if (!selected) return classes;
    return classes.filter((c) => c.grade === selected.grade || c.academicYear === promoteForm.toAcademicYear);
  }, [classes, promoteForm.toClassId, promoteForm.toAcademicYear]);

  const handleAddStudent = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.phone || !addForm.dateOfBirth || !addForm.classId || !addForm.currentAcademicYear) {
      toast({ title: "Missing fields", description: "First name, last name, phone, date of birth, class, and academic year are required.", variant: "destructive" });
      return;
    }
    const selectedClass = classes.find((c) => c.id === addForm.classId);
    const academicYearName = resolveReferenceValueName(
      referenceValues,
      ReferenceValueCategory.ACADEMIC_YEAR,
      addForm.currentAcademicYear
    );
    const statusId = resolveReferenceValueId(referenceValues, ReferenceValueCategory.STUDENT_STATUS, addForm.status);

    try {
      const created = await studentEnrollmentService.createStudentWithEnrollment({
        student: {
          ...addForm,
          fullName: `${addForm.firstName} ${addForm.lastName}`.trim(),
          className: selectedClass?.name,
          grade: selectedClass?.grade,
          section: selectedClass?.section,
          currentAcademicYear: academicYearName,
          status: statusId || "active",
        },
        enrollment: {
          academicYear: academicYearName,
          classId: addForm.classId,
          className: selectedClass?.name,
          grade: selectedClass?.grade,
          section: selectedClass?.section,
          rollNumber: addForm.rollNumber,
          joinedDate: addForm.admissionDate,
        },
      });
      const loginHint = created.loginMobile
        ? ` Student login — mobile: ${created.loginMobile}, password: date of birth.`
        : "";
      toast({
        title: "Student added",
        description: `Profile and enrollment created.${loginHint}`,
      });
      setIsAddOpen(false);
      admissionNumberService.getSettings().then(setAdmissionSettings).catch(() => undefined);
      loadData();
    } catch (error: unknown) {
      let message = "Could not add student.";
      const data = (error as { response?: { data?: unknown } })?.response?.data;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data) as { message?: string };
          message = parsed.message || message;
        } catch {
          message = data || message;
        }
      } else if (data && typeof data === "object" && "message" in data) {
        message = String((data as { message?: string }).message || message);
      }
      toast({ title: "Failed", description: message, variant: "destructive" });
    }
  };

  const openEdit = (row: StudentRow) => {
    setEditContext({
      studentInternalId: row.studentId,
      enrollment: {
        enrollmentId: row.enrollmentId,
        academicYear: row.academicYear,
        classId: row.classId,
        className: row.className,
        grade: row.grade,
        section: row.section,
        rollNumber: row.rollNumber,
      },
    });
    setIsEditOpen(true);
  };

  const openPromote = () => {
    const init: typeof promoteSelections = {};
    promoteCandidates.forEach((s, i) => {
      init[s.studentId] = { selected: false, outcome: "promote", rollNumber: i + 1 };
    });
    setPromoteSelections(init);
    setIsPromoteOpen(true);
  };

  const handlePromote = async () => {
    const selected = Object.entries(promoteSelections).filter(([, v]) => v.selected);
    if (selected.length === 0) {
      toast({ title: "No students selected", variant: "destructive" });
      return;
    }
    const toClass = classes.find((c) => c.id === promoteForm.toClassId);
    if (!toClass) {
      toast({ title: "Select target class", variant: "destructive" });
      return;
    }
    try {
      await studentEnrollmentService.promoteStudents({
        organizationId,
        fromAcademicYear: promoteForm.fromAcademicYear,
        fromClassId: promoteForm.fromClassId,
        fromSection: promoteForm.fromSection,
        toAcademicYear: promoteForm.toAcademicYear,
        toClassId: promoteForm.toClassId,
        toClassName: toClass.name,
        toGrade: toClass.grade,
        toSection: promoteForm.toSection || toClass.section,
        promotedBy: resolvedStaffId,
        students: selected.map(([studentId, v]) => ({
          studentId,
          outcome: v.outcome,
          rollNumber: v.rollNumber,
        })),
      });
      toast({ title: "Promotion complete", description: `${selected.length} student(s) processed.` });
      setIsPromoteOpen(false);
      loadData();
    } catch {
      toast({ title: "Promotion failed", variant: "destructive" });
    }
  };

  const openTransfer = (row: StudentRow) => {
    setTransferTarget(row);
    setTransferForm({
      toClassId: "",
      rollNumber: row.rollNumber ?? 1,
      reason: "",
      effectiveDate: new Date().toISOString().split("T")[0],
    });
    setIsTransferOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferTarget || !transferForm.toClassId) return;
    const toClass = classes.find((c) => c.id === transferForm.toClassId);
    if (!toClass) return;
    try {
      await studentEnrollmentService.transferStudent({
        organizationId,
        studentId: transferTarget.studentId,
        enrollmentId: transferTarget.enrollmentId,
        toClassId: transferForm.toClassId,
        toClassName: toClass.name,
        toGrade: toClass.grade,
        toSection: toClass.section,
        rollNumber: transferForm.rollNumber,
        reason: transferForm.reason,
        effectiveDate: transferForm.effectiveDate,
      });
      toast({ title: "Transfer complete", description: `${transferTarget.displayName} transferred.` });
      setIsTransferOpen(false);
      loadData();
    } catch {
      toast({ title: "Transfer failed", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const header = "Admission No,Name,Academic Year,Class,Section,Roll No,Status,Phone,Email";
    const rows = filteredStudents.map((s) =>
      [
        s.admissionNumber,
        s.displayName,
        s.academicYear,
        s.className,
        s.section,
        s.rollNumber ?? "",
        s.status,
        s.phone,
        s.email,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
      if (cols.length < 6) continue;
      const [admissionNo, firstName, , academicYear, className, section, rollNo] = cols;
      const matchedClass = classes.find(
        (c) => c.name === className || (c.grade && c.section === section)
      );
      if (!matchedClass) continue;
      try {
        await studentEnrollmentService.createStudentWithEnrollment({
          student: {
            studentId: admissionNo,
            firstName: firstName.split(" ")[0] || firstName,
            lastName: firstName.split(" ").slice(1).join(" ") || "",
            phone: cols[7] || "0000000000",
            email: cols[8] || "",
            gender: "other",
            parentGuardian: { name: "Guardian", relationship: "guardian", phone: cols[7] || "" },
            admissionDate: new Date().toISOString().split("T")[0],
            status: "active",
          },
          enrollment: {
            academicYear: academicYear || matchedClass.academicYear,
            classId: matchedClass.id,
            className: matchedClass.name,
            grade: matchedClass.grade,
            section: matchedClass.section,
            rollNumber: Number(rollNo) || 1,
          },
        });
        imported++;
      } catch {
        /* skip row */
      }
    }
    toast({ title: "Import complete", description: `${imported} student(s) imported.` });
    loadData();
  };

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Students</h1>
              <p className="text-muted-foreground mt-1 max-w-xl">
                Class roster hub — pick a class, search learners, and add or update profiles.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/staff/classes")}>
                <BookOpen className="w-4 h-4 mr-1.5" />
                Classes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    More actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExport} disabled={!selectedClassId}>
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <label className="flex items-center w-full cursor-pointer px-2 py-1.5 text-sm">
                      <Upload className="w-4 h-4 mr-2" /> Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                      />
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openPromote}>
                    <TrendingUp className="w-4 h-4 mr-2" /> Promote students
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!loading && classes.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {classes.length} class{classes.length === 1 ? "" : "es"}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                <Users className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium">{totalStudentsAllClasses} students total</span>
              </div>
              {selectedClass ? (
                <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {rosterTotalForClass} in {selectedClass.name}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {loading && classes.length === 0 ? (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            <Skeleton className="h-[420px] rounded-xl" />
            <Skeleton className="h-[420px] rounded-xl" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No classes assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,320px)_1fr] gap-6 items-start">
            <aside className="space-y-3 lg:sticky lg:top-20">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Your classes
              </p>
              <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                {classes.map((cls, index) => {
                  const isActive = selectedClassId === cls.id;
                  const count = studentCountByClass.get(cls.id) ?? 0;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => selectClass(cls.id)}
                      className={cn(
                        "w-full text-left rounded-xl border bg-card overflow-hidden transition-all",
                        "hover:shadow-md hover:border-border",
                        isActive
                          ? "border-foreground/20 bg-muted/50 shadow-sm ring-1 ring-border"
                          : "border-border/60 shadow-sm"
                      )}
                    >
                      <div className={`h-1 bg-gradient-to-r ${accentBars[index % accentBars.length]}`} />
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display font-bold text-foreground truncate">{cls.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {cls.grade}
                              {cls.section ? ` · Sec ${cls.section}` : ""}
                            </p>
                            {cls.academicYear ? (
                              <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{cls.academicYear}</p>
                            ) : null}
                          </div>
                          {isActive ? (
                            <Badge variant="secondary" className="shrink-0 font-medium">
                              Active
                            </Badge>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          )}
                        </div>
                        <div className="rounded-lg bg-muted/50 border border-border/40 py-2.5 px-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Roster</span>
                          <span className="text-lg font-display font-bold text-foreground leading-none">{count}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-w-0 space-y-4">
              {selectedClass ? (
                <>
                  <Card className="overflow-hidden border-border/50 shadow-md">
                    <div
                      className={cn(
                        "h-1.5 bg-gradient-to-r",
                        accentBars[
                          (classes.findIndex((c) => c.id === selectedClassId) + accentBars.length) %
                            accentBars.length
                        ]
                      )}
                    />
                    <CardContent className="pt-5 pb-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Active class
                          </p>
                          <h2 className="text-xl font-display font-bold text-foreground">{selectedClass.name}</h2>
                          <p className="text-sm text-muted-foreground">
                            {[selectedClass.grade, selectedClass.section ? `Section ${selectedClass.section}` : null, selectedClass.academicYear]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <Button variant="hero" size="sm" className="shrink-0" onClick={openAddStudent}>
                          <Plus className="w-4 h-4 mr-1.5" /> Add to this class
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-border/50 overflow-hidden">
                    <CardHeader className="pb-4 space-y-4 border-b bg-muted/20">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          Roster
                          <Badge variant="secondary" className="font-normal ml-1">
                            {filteredStudents.length}
                          </Badge>
                        </CardTitle>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search name, admission no, phone…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-background"
                          />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full sm:w-[160px] bg-background">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All status</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-14 px-4 rounded-xl border border-dashed bg-muted/20">
                          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                          <p className="font-medium text-foreground">No students match</p>
                          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            {searchTerm || statusFilter !== "all"
                              ? "Try clearing search or filters."
                              : "Add the first learner to this class."}
                          </p>
                          {!searchTerm && statusFilter === "all" ? (
                            <Button variant="hero" size="sm" className="mt-4" onClick={openAddStudent}>
                              <Plus className="w-4 h-4 mr-1.5" /> Add student
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <>
                          <div className="md:hidden space-y-3">
                            {filteredStudents.map((student, index) => (
                              <div
                                key={student.enrollmentId}
                                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      "w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-sm",
                                      avatarGradients[index % avatarGradients.length]
                                    )}
                                  >
                                    {studentInitials(student.displayName)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground truncate">{student.displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{student.admissionNumber}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge variant="outline" className="font-normal text-xs">
                                        Roll {student.rollNumber ?? "—"}
                                      </Badge>
                                      <span
                                        className={cn(
                                          "inline-flex px-2 py-0.5 rounded-full text-xs border",
                                          statusChipClass(student.status)
                                        )}
                                      >
                                        {getEnrollmentStatusLabel(
                                          student.status as "current" | "completed" | "transferred" | "left"
                                        )}
                                      </span>
                                    </div>
                                    {student.phone ? (
                                      <p className="text-xs text-muted-foreground mt-2">{student.phone}</p>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 h-9"
                                    onClick={() => openEdit(student)}
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9"
                                    onClick={() => navigate(`/staff/students/${student.studentId}`)}
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" /> Profile
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="hidden md:block rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableHead>Student</TableHead>
                                  <TableHead className="w-[72px]">Roll</TableHead>
                                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right w-[200px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredStudents.map((student, index) => (
                                  <TableRow key={student.enrollmentId} className="group">
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold shrink-0",
                                            avatarGradients[index % avatarGradients.length]
                                          )}
                                        >
                                          {studentInitials(student.displayName)}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-medium truncate">{student.displayName}</div>
                                          <div className="text-xs text-muted-foreground truncate">
                                            {student.admissionNumber}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium tabular-nums">
                                      {student.rollNumber ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                      {student.phone || "—"}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={cn(
                                          "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                          statusChipClass(student.status)
                                        )}
                                      >
                                        {getEnrollmentStatusLabel(
                                          student.status as "current" | "completed" | "transferred" | "left"
                                        )}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8"
                                          onClick={() => openEdit(student)}
                                        >
                                          <Edit className="w-3.5 h-3.5 mr-1" />
                                          Edit
                                        </Button>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 px-2">
                                              More
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() => navigate(`/staff/students/${student.studentId}`)}
                                            >
                                              <Eye className="w-4 h-4 mr-2" /> View profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openTransfer(student)}>
                                              <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer class
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <ChevronRight className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3 rotate-180" />
                    <p className="text-muted-foreground">Select a class from the list to view its roster.</p>
                  </CardContent>
                </Card>
              )}
            </main>
          </div>
        )}

        {/* Add Student */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
              <DialogDescription>Profile information and initial enrollment</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Admission No</Label>
                  <Input
                    value={addForm.studentId}
                    placeholder={
                      admissionSettings.autoGenerate
                        ? `Auto: ${admissionSettings.preview}`
                        : "Enter admission number"
                    }
                    onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                  />
                  {admissionSettings.autoGenerate ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank for next number ({admissionSettings.preview})
                    </p>
                  ) : null}
                </div>
                <div><Label>Roll Number</Label><Input type="number" value={addForm.rollNumber} onChange={(e) => setAddForm({ ...addForm, rollNumber: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} /></div>
                <div><Label>Last Name *</Label><Input value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone *</Label><Input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} /></div>
                <div><Label>Date of birth *</Label><Input type="date" value={addForm.dateOfBirth} onChange={(e) => setAddForm({ ...addForm, dateOfBirth: e.target.value })} /></div>
              </div>
              <div><Label>Email</Label><Input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} /></div>
              <div><Label>Parent/Guardian</Label><Input value={addForm.parentGuardian?.name} onChange={(e) => setAddForm({ ...addForm, parentGuardian: { ...addForm.parentGuardian!, name: e.target.value } })} /></div>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2 flex items-center gap-1"><GraduationCap className="w-4 h-4" /> Initial Enrollment</p>
                <div className="grid gap-3">
                  <div>
                    <Label>Academic Year *</Label>
                    {selectedClass && addForm.currentAcademicYear ? (
                      <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        {resolveReferenceValueName(
                          referenceValues,
                          ReferenceValueCategory.ACADEMIC_YEAR,
                          addForm.currentAcademicYear
                        ) || selectedClass.academicYear}
                      </div>
                    ) : (
                      <Select
                        value={addForm.currentAcademicYear}
                        onValueChange={(v) => setAddForm({ ...addForm, currentAcademicYear: v, classId: "" })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                          {academicYearOptions.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label>Class *</Label>
                    {selectedClass ? (
                      <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                        {selectedClass.name}
                        {selectedClass.section ? ` (${selectedClass.section})` : ""}
                      </div>
                    ) : (
                      <Select value={addForm.classId} onValueChange={(v) => setAddForm({ ...addForm, classId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                          {addFormClassOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}{c.section ? ` (${c.section})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div><Label>Admission Date</Label><Input type="date" value={addForm.admissionDate} onChange={(e) => setAddForm({ ...addForm, admissionDate: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStudent}>Add Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {editContext ? (
          <StudentEditDialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);
              if (!open) setEditContext(null);
            }}
            studentInternalId={editContext.studentInternalId}
            enrollment={editContext.enrollment}
            classLabel={selectedClass?.name}
            onSaved={loadData}
          />
        ) : null}

        {/* Promote Students */}
        <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Promote Students</DialogTitle>
              <DialogDescription>Select source class and target academic year/class. Previous enrollments are preserved.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>From Academic Year</Label>
                  <Select value={promoteForm.fromAcademicYear} onValueChange={(v) => setPromoteForm({ ...promoteForm, fromAcademicYear: v })}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>{academicYearOptions.map((y) => <SelectItem key={y.id} value={y.name}>{y.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>From Class</Label>
                  <Select value={promoteForm.fromClassId} onValueChange={(v) => setPromoteForm({ ...promoteForm, fromClassId: v })}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>To Academic Year</Label>
                  <Select value={promoteForm.toAcademicYear} onValueChange={(v) => setPromoteForm({ ...promoteForm, toAcademicYear: v })}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>{academicYearOptions.map((y) => <SelectItem key={y.id} value={y.name}>{y.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>To Class</Label>
                  <Select value={promoteForm.toClassId} onValueChange={(v) => setPromoteForm({ ...promoteForm, toClassId: v })}>
                    <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                    <SelectContent>{targetClassOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>To Section</Label>
                  <Input value={promoteForm.toSection} onChange={(e) => setPromoteForm({ ...promoteForm, toSection: e.target.value })} placeholder="A" />
                </div>
              </div>
              <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                {promoteCandidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Select source class to see students.</p>
                ) : (
                  promoteCandidates.map((s) => {
                    const sel = promoteSelections[s.studentId] ?? { selected: false, outcome: "promote" as PromotionOutcome, rollNumber: 1 };
                    return (
                      <div key={s.studentId} className="flex items-center gap-3 text-sm">
                        <Checkbox
                          checked={sel.selected}
                          onCheckedChange={(checked) =>
                            setPromoteSelections({ ...promoteSelections, [s.studentId]: { ...sel, selected: Boolean(checked) } })
                          }
                        />
                        <span className="flex-1">{s.displayName}</span>
                        <Select
                          value={sel.outcome}
                          onValueChange={(v) =>
                            setPromoteSelections({ ...promoteSelections, [s.studentId]: { ...sel, outcome: v as PromotionOutcome } })
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["promote", "repeat", "transfer_out", "left_school"] as PromotionOutcome[]).map((o) => (
                              <SelectItem key={o} value={o}>{getPromotionOutcomeLabel(o)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="w-16 h-8"
                          value={sel.rollNumber}
                          onChange={(e) =>
                            setPromoteSelections({ ...promoteSelections, [s.studentId]: { ...sel, rollNumber: Number(e.target.value) } })
                          }
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPromoteOpen(false)}>Cancel</Button>
              <Button onClick={handlePromote}>Promote Students</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Class/Section</DialogTitle>
              <DialogDescription>
                {transferTarget ? `Transfer ${transferTarget.displayName} within ${transferTarget.academicYear}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>To Class</Label>
                <Select value={transferForm.toClassId} onValueChange={(v) => setTransferForm({ ...transferForm, toClassId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.filter((c) => c.id !== transferTarget?.classId).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Roll Number</Label><Input type="number" value={transferForm.rollNumber} onChange={(e) => setTransferForm({ ...transferForm, rollNumber: Number(e.target.value) })} /></div>
              <div><Label>Reason</Label><Input value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} /></div>
              <div><Label>Effective Date</Label><Input type="date" value={transferForm.effectiveDate} onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTransferOpen(false)}>Cancel</Button>
              <Button onClick={handleTransfer}>Transfer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default StaffStudents;
