import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, User, Users, GraduationCap, ArrowRightLeft, BookOpen, Edit } from "lucide-react";
import type { Student } from "@/models/student.model";
import { getStudentStatusColor, getStudentStatusLabel } from "@/models/student.model";
import type { StudentEnrollment, StudentTransfer } from "@/models/student-enrollment.model";
import { getEnrollmentStatusLabel } from "@/models/student-enrollment.model";
import { studentService } from "@/services/student.service";
import { studentEnrollmentService } from "@/services/student-enrollment.service";
import { studentPromotionService } from "@/services/student-promotion.service";
import { staffService } from "@/services/staff.service";
import type { StudentPromotion } from "@/models/student-promotion.model";
import { formatShortDate } from "@/utils/date";
import { cn } from "@/lib/utils";

const panelCard = "shadow-none border-zinc-400";

type AdminStudentDetailPanelProps = {
  studentId: string;
  onBack: () => void;
  onEdit?: () => void;
  className?: string;
};

export function AdminStudentDetailPanel({ studentId, onBack, onEdit, className }: AdminStudentDetailPanelProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<StudentEnrollment | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [transfers, setTransfers] = useState<StudentTransfer[]>([]);
  const [promotions, setPromotions] = useState<StudentPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orgId = staffService.getOrganizationId();
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [profile, current, history, transferHistory, promos] = await Promise.all([
          studentService.getById(studentId),
          studentEnrollmentService.getCurrent(studentId),
          studentEnrollmentService.getHistory(studentId),
          studentEnrollmentService.getTransferHistory(studentId),
          studentPromotionService.selectPromotions({ studentId, organizationId: orgId }),
        ]);
        if (cancelled) return;
        setStudent(profile);
        setCurrentEnrollment(current);
        setEnrollments(history);
        setTransfers(transferHistory);
        setPromotions(promos);
      } catch {
        if (!cancelled) setStudent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const academicHistoryRows = useMemo(() => {
    return enrollments
      .map((e) => ({
        id: e.id,
        academicYear: e.academicYear,
        grade: e.grade,
        section: e.section,
        rollNumber: e.rollNumber,
        status: e.status,
        isCurrent: e.isCurrent,
      }))
      .sort((a, b) => b.academicYear.localeCompare(a.academicYear));
  }, [enrollments]);

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-zinc-400 bg-card p-8 text-center text-sm text-muted-foreground", className)}>
        Loading student…
      </div>
    );
  }

  if (!student) {
    return (
      <div className={cn("space-y-3", className)}>
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 xl:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Button>
        <Card className={panelCard}>
          <CardContent className="py-12 text-center text-muted-foreground">Student not found</CardContent>
        </Card>
      </div>
    );
  }

  const displayName = student.fullName || `${student.firstName} ${student.lastName}`.trim();

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 xl:hidden" onClick={onBack} aria-label="Back to list">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold text-foreground" title={displayName}>
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground">Admission No: {student.studentId}</p>
          </div>
        </div>
        {onEdit ? (
          <Button variant="outline" size="sm" className="shrink-0 border-zinc-400" onClick={onEdit}>
            <Edit className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className={panelCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current Class</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {currentEnrollment ? `${currentEnrollment.grade} - ${currentEnrollment.section}` : student.className || "—"}
            </p>
            <p className="text-sm text-muted-foreground">{currentEnrollment?.academicYear || student.currentAcademicYear}</p>
          </CardContent>
        </Card>
        <Card className={panelCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Roll Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{currentEnrollment?.rollNumber ?? student.rollNumber ?? "—"}</p>
          </CardContent>
        </Card>
        <Card className={panelCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStudentStatusColor(student.status as "active")}>
              {getStudentStatusLabel(student.status as "active")}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="min-w-0">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            Profile
          </TabsTrigger>
          <TabsTrigger value="academic" className="text-xs sm:text-sm">
            Academic
          </TabsTrigger>
          <TabsTrigger value="transfers" className="text-xs sm:text-sm">
            Transfers
          </TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs sm:text-sm">
            Promotions
          </TabsTrigger>
          <TabsTrigger value="records" className="text-xs sm:text-sm">
            Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-3 space-y-3">
          <Card className={panelCard}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Student Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{student.dateOfBirth ? formatShortDate(student.dateOfBirth) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="break-all font-medium">{student.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{student.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Admission Date</p>
                <p className="font-medium">{student.admissionDate ? formatShortDate(student.admissionDate) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blood Group</p>
                <p className="font-medium">{student.bloodGroup || "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={panelCard}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Parent/Guardian
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{student.parentGuardian?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{student.parentGuardian?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Relationship</p>
                <p className="font-medium capitalize">{student.parentGuardian?.relationship || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{student.parentGuardian?.email || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="mt-3">
          <Card className={panelCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-4 w-4" /> Academic History
              </CardTitle>
              <CardDescription>Enrollment records per academic year</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicHistoryRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No enrollment history
                      </TableCell>
                    </TableRow>
                  ) : (
                    academicHistoryRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.academicYear}</TableCell>
                        <TableCell>{row.grade}</TableCell>
                        <TableCell>{row.section}</TableCell>
                        <TableCell>{row.rollNumber ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={row.isCurrent ? "default" : "secondary"}>
                            {row.isCurrent ? "Current" : getEnrollmentStatusLabel(row.status as "completed")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="mt-3">
          <Card className={panelCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRightLeft className="h-4 w-4" /> Transfer History
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No transfers recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          {t.fromClassName} - {t.fromSection}
                        </TableCell>
                        <TableCell>
                          {t.toClassName} - {t.toSection}
                        </TableCell>
                        <TableCell>{t.reason || "—"}</TableCell>
                        <TableCell>{t.effectiveDate ? new Date(t.effectiveDate).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="mt-3">
          <Card className={panelCard}>
            <CardHeader>
              <CardTitle className="text-base">Promotion Records</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No promotions
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize">{p.promotionType}</TableCell>
                        <TableCell>
                          Grade {p.fromGrade} · {p.fromClassName}
                        </TableCell>
                        <TableCell>
                          Grade {p.toGrade} · {p.toClassName}
                        </TableCell>
                        <TableCell>
                          {p.academicYearFrom} → {p.academicYearTo}
                        </TableCell>
                        <TableCell>{p.promotionDate ? new Date(p.promotionDate).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-3">
          <Card className={panelCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" /> Academic Records
              </CardTitle>
              <CardDescription>
                Records are linked to enrollment ID
                {currentEnrollment ? ` (${currentEnrollment.id.slice(0, 8)}…)` : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Attendance, marks, exams, and homework remain tied to the enrollment active when they were created.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
