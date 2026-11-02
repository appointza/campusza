import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DocumentRequirement } from "@/models/class-configuration.model";
import { classConfigurationService } from "@/services/class-configuration.service";
import { staffService } from "@/services/staff.service";
import { studentService } from "@/services/student.service";
import { documentRequirementStudentService } from "@/services/document-requirement-student.service";
import type { Student } from "@/models/student.model";

type StudentDocumentStatus = "pending" | "issued" | "collected" | "not_required";

const StaffDocumentStudents = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [document, setDocument] = useState<DocumentRequirement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [studentDocumentStatus, setStudentDocumentStatus] = useState<Record<string, StudentDocumentStatus>>({});

  // Load document and students
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = localStorage.getItem("campusza_user");
        if (!raw) {
          toast({
            title: "Error",
            description: "User session not found.",
            variant: "destructive",
          });
          navigate("/staff/documents");
          return;
        }

        const user = JSON.parse(raw) as { email?: string; staffId?: string };
        const userEmail = user?.email;
        let staffId = user?.staffId ?? "";

        if (!staffId && userEmail) {
          const allStaff = await staffService.getAll();
          const current = allStaff.find((s) => s.email === userEmail);
          if (current?.staffId) staffId = current.staffId;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "Staff ID not found.",
            variant: "destructive",
          });
          navigate("/staff/documents");
          return;
        }

        // Fetch the document
        if (!documentId) {
          toast({
            title: "Error",
            description: "Document not found.",
            variant: "destructive",
          });
          navigate("/staff/documents");
          return;
        }

        // Load all documents assigned to this staff and find the one by ID
        const orgId = staffService.getOrganizationId();
        const docs = await classConfigurationService.getDocumentRequirements({
          organizationid: orgId,
          assignedstaffid: staffId,
        });

        const foundDoc = docs.find((d) => d.id === documentId);
        if (!foundDoc) {
          toast({
            title: "Error",
            description: "Document not found.",
            variant: "destructive",
          });
          navigate("/staff/documents");
          return;
        }

        setDocument(foundDoc);

        // Load students for this document
        let documentStudents: Student[] = [];
        if (foundDoc.classId) {
          documentStudents = await studentService.getByClass(foundDoc.classId);
        } else {
          const allStudents = await studentService.getAll();
          documentStudents = allStudents.filter(
            (s) =>
              s.grade === foundDoc.grade ||
              (foundDoc.className && s.className === foundDoc.className)
          );
        }
        setStudents(documentStudents);

        // Load saved statuses from database
        if (orgId && documentId) {
          try {
            const savedStatuses = await documentRequirementStudentService.select({
              organizationid: orgId,
              documentrequirementid: documentId,
            });
            const statusMap: Record<string, any> = Object.fromEntries(
              savedStatuses.map(s => [s.studentid, s])
            );
            setStudentDocumentStatus(
              Object.fromEntries(
                Object.entries(statusMap).map(([sid, item]) => [sid, item.status])
              )
            );
          } catch (e) {
            console.error("Failed to load saved statuses:", e);
          }
        }
      } catch (error) {
        console.error("Failed to load document or students:", error);
        toast({
          title: "Error",
          description: "Failed to load document details.",
          variant: "destructive",
        });
        navigate("/staff/documents");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [documentId, navigate, toast]);

  const getFilteredStudents = () => {
    let filtered = students;

    if (classFilter !== "all") {
      filtered = filtered.filter((s) => s.className === classFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.fullName && s.fullName.toLowerCase().includes(term)) ||
          (s.firstName && s.firstName.toLowerCase().includes(term)) ||
          (s.lastName && s.lastName.toLowerCase().includes(term)) ||
          (s.studentId && s.studentId.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const classOptions = Array.from(
    new Set(students.map((s) => s.className).filter(Boolean))
  );

  const handleStatusChange = async (studentId: string, status: StudentDocumentStatus) => {
    // Update UI immediately
    setStudentDocumentStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    // Save to backend
    try {
      console.log("Saving status for student:", studentId, "status:", status, "documentId:", documentId);
      
      const orgId = staffService.getOrganizationId();
      console.log("Organization ID:", orgId);
      
      if (!documentId) {
        console.error("Document ID is missing");
        toast({
          title: "Error",
          description: "Document ID not found.",
          variant: "destructive",
        });
        return;
      }

      if (!orgId) {
        console.error("Organization ID is missing");
        toast({
          title: "Error",
          description: "Organization ID not found.",
          variant: "destructive",
        });
        return;
      }

      console.log("Calling API with:", {
        organizationid: orgId,
        documentrequirementid: documentId,
        studentid: studentId,
        status,
      });

      const result = await documentRequirementStudentService.save({
        organizationid: orgId,
        documentrequirementid: documentId,
        studentid: studentId,
        status,
      });

      console.log("API result:", result);

      const student = students.find((s) => s.id === studentId);
      const name =
        student?.fullName ||
        [student?.firstName, student?.lastName].filter(Boolean).join(" ") ||
        "Student";
      toast({
        title: "Status Saved",
        description: `${name}'s document status updated to ${status}.`,
      });
    } catch (error) {
      console.error("Failed to save status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status?: StudentDocumentStatus) => {
    switch (status) {
      case "issued":
      case "collected":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "not_required":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: StudentDocumentStatus) => {
    switch (status) {
      case "issued":
      case "collected":
        return "bg-green-50";
      case "pending":
        return "bg-yellow-50";
      case "not_required":
        return "bg-gray-50";
      default:
        return "bg-white";
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const filtered = getFilteredStudents();

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/staff/documents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {document?.name || "Document"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage students and track document status
            </p>
          </div>
        </div>

        {/* Document Info */}
        {document && (
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="font-medium">{document.documentType}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Action</Label>
                  <p className="font-medium">{document.action}</p>
                </div>
                {document.className && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Class</Label>
                    <p className="font-medium">{document.className}</p>
                  </div>
                )}
                {document.grade && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Grade</Label>
                    <p className="font-medium">{document.grade}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Students ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label>Search</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {classOptions.length > 0 && (
                  <div className="w-full sm:w-48">
                    <Label>Class</Label>
                    <Select value={classFilter} onValueChange={setClassFilter}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No students found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((student) => {
                      const status = studentDocumentStatus[student.id] || "pending";
                      return (
                        <TableRow
                          key={student.id}
                          className={getStatusColor(status)}
                        >
                          <TableCell className="font-medium">
                            {student.fullName ||
                              `${student.firstName} ${student.lastName}`.trim() ||
                              student.studentId}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.studentId}
                          </TableCell>
                          <TableCell>{student.className}</TableCell>
                          <TableCell>
                            <Select
                              value={status}
                              onValueChange={(val) =>
                                handleStatusChange(
                                  student.id,
                                  val as StudentDocumentStatus
                                )
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </div>
                                </SelectItem>
                                <SelectItem value="issued">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" />
                                    Issued
                                  </div>
                                </SelectItem>
                                <SelectItem value="collected">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" />
                                    Collected
                                  </div>
                                </SelectItem>
                                <SelectItem value="not_required">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-3 h-3" />
                                    Not Required
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
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
    </DashboardLayout>
  );
};

export default StaffDocumentStudents;
