import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  GraduationCap, 
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { studentService } from "@/services/student.service";
import { studentEnrollmentService } from "@/services/student-enrollment.service";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import type { Student } from "@/models/student.model";
import type { StudentEnrollmentWithProfile } from "@/models/student-enrollment.model";
import type { Class } from "@/models/class.model";
import { ReferenceValueCategory, getReferenceValuesByCategory, resolveReferenceValueId, resolveReferenceValueName, type ReferenceValue } from "@/models/referencevalue.model";
import { admissionNumberService } from "@/services/admission-number.service";
import { defaultAdmissionNumberSettings, type AdmissionNumberSettings } from "@/models/admission-number.model";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StudentEditPanel, type StudentEnrollmentContext } from "@/components/students/StudentEditDialog";
import { AdminStudentsPromotionHistory } from "@/components/students/AdminStudentsPromotionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StudentTable = {
  id: string;
  studentId: string;
  name: string;
  grade: string;
  email: string;
  phone: string;
  status: string;
  enrollmentId: string;
  classId: string;
  className: string;
  classGrade: string;
  section: string;
  academicYear: string;
  rollNumber?: number;
  firstName: string;
  lastName: string;
  admissionNumber: string;
};

function academicYearsMatch(
  yearA: string | undefined,
  yearB: string | undefined,
  referenceValues: ReferenceValue[]
): boolean {
  const a = yearA?.trim();
  const b = yearB?.trim();
  if (!b || b === "all") return true;
  if (!a) return false;
  if (a === b) return true;
  const nameA =
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, a) || a;
  const nameB =
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, b) || b;
  return nameA === nameB;
}

function formatClassLabel(row: StudentTable): string {
  if (row.className?.trim()) return row.className.trim();
  const parts = [row.classGrade, row.section].filter((p) => p?.trim());
  return parts.length ? parts.join("-") : "—";
}

function formatAcademicYearLabel(year: string | undefined, referenceValues: ReferenceValue[]): string {
  const raw = year?.trim();
  if (!raw) return "—";
  return (
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, raw) || raw
  );
}

function mapPageRow(item: Record<string, unknown>): StudentTable {
  return {
    id: String(item.id ?? ""),
    studentId: String(item.studentid ?? ""),
    name: String(item.name ?? ""),
    grade: String(item.grade ?? ""),
    email: String(item.email ?? ""),
    phone: String(item.phone ?? ""),
    status: String(item.status ?? ""),
    enrollmentId: String(item.enrollmentid ?? item.enrollmentId ?? ""),
    classId: String(item.classid ?? item.classId ?? ""),
    className: String(item.classname ?? item.className ?? ""),
    classGrade: String(item.classgrade ?? item.classGrade ?? ""),
    section: String(item.section ?? ""),
    academicYear: String(item.academicyear ?? item.academicYear ?? ""),
    rollNumber: item.rollnumber != null ? Number(item.rollnumber) : undefined,
    firstName: String(item.firstname ?? ""),
    lastName: String(item.lastname ?? ""),
    admissionNumber: String(item.admissionnumber ?? item.studentid ?? ""),
  };
}

function mapEnrollmentToRow(row: StudentEnrollmentWithProfile): StudentTable {
  const gradeLabel = row.className || [row.grade, row.section].filter(Boolean).join("-");
  const displayGrade = row.academicYear ? `${gradeLabel} (${row.academicYear})` : gradeLabel;
  return {
    id: row.studentId,
    studentId: row.admissionNumber || row.studentId,
    name: row.fullName || `${row.firstName} ${row.lastName}`.trim(),
    grade: displayGrade,
    email: row.email,
    phone: row.phone,
    status: row.status || "current",
    enrollmentId: row.enrollmentId,
    classId: row.classId,
    className: row.className,
    classGrade: row.grade,
    section: row.section,
    academicYear: row.academicYear,
    rollNumber: row.rollNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    admissionNumber: row.admissionNumber,
  };
}

const AdminStudents = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [studentsData, setStudentsData] = useState<StudentTable[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("all");
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [studentsPageTab, setStudentsPageTab] = useState<"roster" | "promotions">("roster");
  const [loading, setLoading] = useState(false);
  const [classOptions, setClassOptions] = useState<Class[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editContext, setEditContext] = useState<{
    studentInternalId: string;
    enrollment: StudentEnrollmentContext;
    classLabel?: string;
  } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentTable | null>(null);
  const [admissionSettings, setAdmissionSettings] = useState<AdmissionNumberSettings>(defaultAdmissionNumberSettings());

  const [addFormData, setAddFormData] = useState<Partial<Student>>({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    dateOfBirth: "",
    parentGuardian: {
      name: "",
      relationship: "guardian",
      phone: "",
    },
    classId: "",
    rollNumber: 1,
    currentAcademicYear: "",
    status: "active",
  });

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const page = await pageService.getAdminStudentsPage();
      setStudentsData(
        (Array.isArray(page.rows) ? page.rows : []).map((row) =>
          mapPageRow(row as Record<string, unknown>)
        )
      );
      setClassOptions(
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
      setReferenceValues(mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]);
    } catch {
      toast({
        title: "Failed to load students",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStudents();
    admissionNumberService.getSettings().then(setAdmissionSettings).catch(() => undefined);
  }, [loadStudents]);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );
  const studentStatusOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.STUDENT_STATUS),
    [referenceValues]
  );

  const classesForFilterYear = useMemo(() => {
    if (filterAcademicYear === "all") return classOptions;
    return classOptions.filter((c) =>
      academicYearsMatch(c.academicYear, filterAcademicYear, referenceValues)
    );
  }, [classOptions, filterAcademicYear, referenceValues]);

  const addFormClassOptions = useMemo(() => {
    const year = addFormData.currentAcademicYear;
    if (!year) return [];
    return classOptions.filter((c) => academicYearsMatch(c.academicYear, year, referenceValues));
  }, [classOptions, addFormData.currentAcademicYear, referenceValues]);

  useEffect(() => {
    if (filterClassId === "all") return;
    if (!classesForFilterYear.some((c) => c.id === filterClassId)) {
      setFilterClassId("all");
    }
  }, [filterAcademicYear, filterClassId, classesForFilterYear]);

  useEffect(() => {
    if (!addFormData.classId || !addFormData.currentAcademicYear) return;
    if (!addFormClassOptions.some((c) => c.id === addFormData.classId)) {
      setAddFormData((prev) => ({ ...prev, classId: "" }));
    }
  }, [addFormData.classId, addFormData.currentAcademicYear, addFormClassOptions]);

  const filteredStudents = useMemo(() => {
    return studentsData.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatClassLabel(student).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatAcademicYearLabel(student.academicYear, referenceValues)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesYear = academicYearsMatch(
        student.academicYear,
        filterAcademicYear,
        referenceValues
      );
      const matchesClass =
        filterClassId === "all" || student.classId === filterClassId;
      return matchesSearch && matchesYear && matchesClass;
    });
  }, [studentsData, searchTerm, filterAcademicYear, filterClassId, referenceValues]);

  const resetAddForm = () => {
    setAddFormData({
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "male",
      dateOfBirth: "",
      parentGuardian: {
        name: "",
        relationship: "guardian",
        phone: "",
      },
      classId: "",
      rollNumber: 1,
      currentAcademicYear: "",
      status: "active",
    });
  };

  const handleAddStudent = async () => {
    if (!addFormData.firstName || !addFormData.lastName || !addFormData.phone || !addFormData.dateOfBirth || !addFormData.classId || !addFormData.currentAcademicYear) {
      toast({
        title: "Missing fields",
        description: "First name, last name, phone, date of birth, class, and academic year are required.",
        variant: "destructive",
      });
      return;
    }

    const selectedClass = classOptions.find((cls) => cls.id === addFormData.classId);
    if (
      selectedClass &&
      !academicYearsMatch(selectedClass.academicYear, addFormData.currentAcademicYear, referenceValues)
    ) {
      toast({
        title: "Class and year mismatch",
        description: "Choose a class that belongs to the selected academic year.",
        variant: "destructive",
      });
      return;
    }
    const academicYearName = resolveReferenceValueName(
      referenceValues,
      ReferenceValueCategory.ACADEMIC_YEAR,
      addFormData.currentAcademicYear
    );
    const statusId = resolveReferenceValueId(
      referenceValues,
      ReferenceValueCategory.STUDENT_STATUS,
      addFormData.status
    );

    const payload: Partial<Student> = {
      ...addFormData,
      fullName: `${addFormData.firstName} ${addFormData.lastName}`.trim(),
      className: selectedClass?.name || "",
      grade: selectedClass?.grade || "",
      section: selectedClass?.section || "",
      admissionDate: new Date().toISOString().split("T")[0],
      currentAcademicYear: academicYearName,
      status: statusId || "active",
    };

    setLoading(true);
    try {
      const created = await studentEnrollmentService.createStudentWithEnrollment({
        student: payload,
        enrollment: {
          academicYear: academicYearName,
          classId: addFormData.classId,
          className: selectedClass?.name,
          grade: selectedClass?.grade,
          section: selectedClass?.section,
          rollNumber: addFormData.rollNumber,
          joinedDate: payload.admissionDate,
        },
      });
      await loadStudents();
      setIsAddDialogOpen(false);
      resetAddForm();
      admissionNumberService.getSettings().then(setAdmissionSettings).catch(() => undefined);
      const loginHint = created.loginMobile
        ? ` Login — mobile: ${created.loginMobile}, password: date of birth.`
        : "";
      toast({
        title: "Student Added",
        description: `${created.fullName || created.firstName} has been added successfully.${loginHint}`,
      });
    } catch (error) {
      toast({
        title: "Failed to add student",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (student: StudentTable) => {
    navigate(`/admin/students/${student.id}`);
  };

  const resolveEnrollmentContext = async (student: StudentTable): Promise<StudentEnrollmentContext> => {
    if (student.enrollmentId) {
      return {
        enrollmentId: student.enrollmentId,
        academicYear: student.academicYear,
        classId: student.classId,
        className: student.className,
        grade: student.classGrade || student.className,
        section: student.section,
        rollNumber: student.rollNumber,
      };
    }

    const enrollments = await studentEnrollmentService.selectWithProfile({
      studentId: student.id,
      isCurrent: true,
    });
    const current = enrollments.find((e) => e.isCurrent) ?? enrollments[0];
    if (current) {
      return {
        enrollmentId: current.enrollmentId,
        academicYear: current.academicYear,
        classId: current.classId,
        className: current.className,
        grade: current.grade,
        section: current.section,
        rollNumber: current.rollNumber,
      };
    }

    const profile = await studentService.getById(student.id);
    return {
      enrollmentId: "",
      academicYear: profile.currentAcademicYear || "",
      classId: profile.classId || "",
      className: profile.className || "",
      grade: profile.grade || "",
      section: profile.section || "",
      rollNumber: profile.rollNumber,
    };
  };

  const openEdit = async (student: StudentTable) => {
    setEditLoading(true);
    setEditContext(null);
    try {
      const enrollment = await resolveEnrollmentContext(student);
      setEditContext({
        studentInternalId: student.id,
        classLabel: student.className || student.grade,
        enrollment,
      });
    } catch {
      toast({
        title: "Could not open editor",
        description: "Try again or refresh the page.",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const closeEdit = () => {
    setEditContext(null);
  };

  const handleDelete = (student: StudentTable) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    try {
      await studentService.delete(selectedStudent.id);
      setStudentsData((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      toast({
        title: "Student Removed",
        description: `${selectedStudent.name} has been removed.`,
        variant: "destructive",
      });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground mt-1">Manage all student records and enrollments</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student details below to add a new student to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={addFormData.firstName || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={addFormData.lastName || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Admission No</Label>
                    <Input
                      id="studentId"
                      placeholder={
                        admissionSettings.autoGenerate
                          ? `Auto: ${admissionSettings.preview}`
                          : "Enter admission number"
                      }
                      value={addFormData.studentId || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, studentId: e.target.value })}
                    />
                    {admissionSettings.autoGenerate ? (
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use next number ({admissionSettings.preview})
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={addFormData.gender || "male"}
                      onValueChange={(value) => setAddFormData({ ...addFormData, gender: value as Student["gender"] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.smith@school.com"
                    value={addFormData.email || ""}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 234 567 890"
                      value={addFormData.phone || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={addFormData.dateOfBirth || ""}
                      onChange={(e) => setAddFormData({ ...addFormData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select
                      value={addFormData.currentAcademicYear || ""}
                      onValueChange={(value) =>
                        setAddFormData({ ...addFormData, currentAcademicYear: value, classId: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYearOptions.length === 0 ? (
                          <SelectItem value="no-years" disabled>
                            No academic years available
                          </SelectItem>
                        ) : (
                          academicYearOptions.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number</Label>
                    <Input
                      id="rollNumber"
                      type="number"
                      min="1"
                      value={addFormData.rollNumber || 1}
                      onChange={(e) => setAddFormData({ ...addFormData, rollNumber: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classId">Class</Label>
                  <Select
                    value={addFormData.classId || ""}
                    onValueChange={(value) => setAddFormData({ ...addFormData, classId: value })}
                    disabled={!addFormData.currentAcademicYear}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          addFormData.currentAcademicYear
                            ? "Select class for this year"
                            : "Select academic year first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!addFormData.currentAcademicYear ? (
                        <SelectItem value="pick-year" disabled>
                          Select academic year first
                        </SelectItem>
                      ) : addFormClassOptions.length === 0 ? (
                        <SelectItem value="no-classes" disabled>
                          No classes for this academic year
                        </SelectItem>
                      ) : (
                        addFormClassOptions.map((cls) => {
                          const yearLabel = formatAcademicYearLabel(cls.academicYear, referenceValues);
                          return (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                              {yearLabel !== "—" ? ` (${yearLabel})` : ""}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Parent/Guardian Name</Label>
                    <Input
                      id="guardianName"
                      placeholder="Parent name"
                      value={addFormData.parentGuardian?.name || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          parentGuardian: {
                            ...addFormData.parentGuardian,
                            name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Parent/Guardian Phone</Label>
                    <Input
                      id="guardianPhone"
                      placeholder="+1 234 567 890"
                      value={addFormData.parentGuardian?.phone || ""}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          parentGuardian: {
                            ...addFormData.parentGuardian,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetAddForm();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleAddStudent} disabled={loading}>
                  {loading ? "Saving..." : "Add Student"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {editLoading || editContext ? (
          <div className="space-y-4">
            <Button variant="ghost" className="gap-2 -ml-2" onClick={closeEdit} disabled={editLoading}>
              <ArrowLeft className="w-4 h-4" />
              Back to students
            </Button>
            {editLoading ? (
              <Card className="shadow-lg border-border/50 min-h-[calc(100vh-10rem)] flex items-center justify-center">
                <p className="text-muted-foreground">Loading student…</p>
              </Card>
            ) : (
              <StudentEditPanel
                open={true}
                onOpenChange={(open) => {
                  if (!open) closeEdit();
                }}
                studentInternalId={editContext!.studentInternalId}
                enrollment={editContext!.enrollment}
                classLabel={editContext!.classLabel}
                onSaved={loadStudents}
              />
            )}
          </div>
        ) : (
          <Tabs
            value={studentsPageTab}
            onValueChange={(v) => setStudentsPageTab(v as "roster" | "promotions")}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="roster">Students</TabsTrigger>
              <TabsTrigger value="promotions">Promotion history</TabsTrigger>
            </TabsList>

            <TabsContent value="roster" className="mt-0 space-y-4">
          <div className="space-y-4">
            <Card className="shadow-lg border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students by name, ID, class, or year..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All academic years</SelectItem>
                      {academicYearOptions.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterClassId}
                    onValueChange={setFilterClassId}
                    disabled={filterAcademicYear !== "all" && classesForFilterYear.length === 0}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {(filterAcademicYear === "all" ? classOptions : classesForFilterYear).map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                          {filterAcademicYear === "all" && cls.academicYear
                            ? ` (${formatAcademicYearLabel(cls.academicYear, referenceValues)})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="font-display">All Students ({filteredStudents.length})</CardTitle>
                <CardDescription>Select a student to open the full edit form</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Academic year</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Phone</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Loading students...
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow
                          key={student.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openEdit(student)}
                        >
                          <TableCell className="font-medium">{student.studentId}</TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">{student.name}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatAcademicYearLabel(student.academicYear, referenceValues)}
                          </TableCell>
                          <TableCell className="text-sm">{formatClassLabel(student)}</TableCell>
                          <TableCell className="hidden lg:table-cell">{student.email}</TableCell>
                          <TableCell className="hidden lg:table-cell">{student.phone}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                student.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {student.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
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
                                  <Button variant="ghost" size="sm" className="h-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(student)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="promotions" className="mt-0">
              <AdminStudentsPromotionHistory
                referenceValues={referenceValues}
                active={studentsPageTab === "promotions"}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove{" "}
                <span className="font-semibold">{selectedStudent?.name}</span> from the student list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
