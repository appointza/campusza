import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
import { ArrowLeft, User, Users, GraduationCap, ArrowRightLeft, BookOpen } from "lucide-react";
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

const StaffStudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<StudentEnrollment | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [transfers, setTransfers] = useState<StudentTransfer[]>([]);
  const [promotions, setPromotions] = useState<StudentPromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const orgId = staffService.getOrganizationId();
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
        setStudent(profile);
        setCurrentEnrollment(current);
        setEnrollments(history);
        setTransfers(transferHistory);
        setPromotions(promos);
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };
    load();
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
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="py-12 text-center text-muted-foreground">Loading student...</div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <Button variant="outline" onClick={() => navigate("/staff/students")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="mt-4"><CardContent className="py-12 text-center">Student not found</CardContent></Card>
      </DashboardLayout>
    );
  }

  const displayName = student.fullName || `${student.firstName} ${student.lastName}`.trim();

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/staff/students")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Students
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">{displayName}</h1>
            <p className="text-muted-foreground">Admission No: {student.studentId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Current Class</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {currentEnrollment
                  ? `${currentEnrollment.grade} - ${currentEnrollment.section}`
                  : student.className || "—"}
              </p>
              <p className="text-sm text-muted-foreground">{currentEnrollment?.academicYear || student.currentAcademicYear}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Roll Number</CardTitle></CardHeader>
            <CardContent><p className="text-xl font-semibold">{currentEnrollment?.rollNumber ?? student.rollNumber ?? "—"}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Status</CardTitle></CardHeader>
            <CardContent>
              <Badge className={getStudentStatusColor(student.status as "active")}>
                {getStudentStatusLabel(student.status as "active")}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="academic">Academic History</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Student Profile</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Date of Birth</p><p className="font-medium">{student.dateOfBirth ? formatShortDate(student.dateOfBirth) : "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Gender</p><p className="font-medium capitalize">{student.gender}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{student.email || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{student.phone}</p></div>
                <div><p className="text-sm text-muted-foreground">Admission Date</p><p className="font-medium">{student.admissionDate ? formatShortDate(student.admissionDate) : "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Blood Group</p><p className="font-medium">{student.bloodGroup || "—"}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Parent/Guardian</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{student.parentGuardian?.name || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{student.parentGuardian?.phone || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Relationship</p><p className="font-medium capitalize">{student.parentGuardian?.relationship || "—"}</p></div>
                <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{student.parentGuardian?.email || "—"}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Academic History</CardTitle>
                <CardDescription>Enrollment records per academic year — never overwritten</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicHistoryRows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No enrollment history</TableCell></TableRow>
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

          <TabsContent value="transfers" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Transfer History</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Effective Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transfers recorded</TableCell></TableRow>
                    ) : (
                      transfers.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.fromClassName} - {t.fromSection}</TableCell>
                          <TableCell>{t.toClassName} - {t.toSection}</TableCell>
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

          <TabsContent value="promotions" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Promotion Records</CardTitle></CardHeader>
              <CardContent>
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
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No promotions</TableCell></TableRow>
                    ) : (
                      promotions.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="capitalize">{p.promotionType}</TableCell>
                          <TableCell>Grade {p.fromGrade} · {p.fromClassName}</TableCell>
                          <TableCell>Grade {p.toGrade} · {p.toClassName}</TableCell>
                          <TableCell>{p.academicYearFrom} → {p.academicYearTo}</TableCell>
                          <TableCell>{p.promotionDate ? new Date(p.promotionDate).toLocaleDateString() : "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Academic Records</CardTitle>
                <CardDescription>
                  Attendance, marks, exams, and homework are linked to enrollment ID
                  {currentEnrollment ? ` (${currentEnrollment.id.slice(0, 8)}…)` : ""} for historical accuracy.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm space-y-2">
                <p>Attendance, marks, exams, homework, fees, leave, discipline, achievements, documents, and communication records remain tied to the enrollment active at the time they were created.</p>
                <p>View these records from the respective staff modules (Attendance, Grades, Homework, etc.) filtered by this student's current or past class.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StaffStudentDetail;
