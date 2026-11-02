import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  Eye,
  Edit,
  Users,
  ArrowLeft,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { DocumentRequirement, DocumentAction } from "@/models/class-configuration.model";
import {
  getDocumentTypeLabel,
  getDocumentActionLabel,
  getDocumentActionColor,
  getSemesterTypeLabel,
  getRequiredAtLabel,
} from "@/models/class-configuration.model";
import { classConfigurationService } from "@/services/class-configuration.service";
import { staffService } from "@/services/staff.service";
import { studentService } from "@/services/student.service";
import type { Student } from "@/models/student.model";

type StaffDocument = DocumentRequirement & {
  status: "pending" | "in_progress" | "completed" | "cancelled";
  studentCount?: number;
  completedCount?: number;
  notes?: string;
};

type StudentDocumentStatus = "pending" | "issued" | "collected" | "not_required";

const StaffDocuments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStaffId, setCurrentStaffId] = useState<string>("");
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all"); // "all" or classId
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "cancelled">("all");
  const [selectedDocument, setSelectedDocument] = useState<StaffDocument | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"pending" | "in_progress" | "completed" | "cancelled">("pending");
  const [updateNotes, setUpdateNotes] = useState("");

  // Students for the selected document (Manage Students view)
  const [documentStudents, setDocumentStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentClassFilter, setStudentClassFilter] = useState<string>("all"); // \"all\" or className
  const [studentSearch, setStudentSearch] = useState<string>("");
  // Per-student document status (keyed by student.id) — UI-only until backend supports it
  const [studentDocumentStatus, setStudentDocumentStatus] = useState<Record<string, StudentDocumentStatus>>({});

  // Load assigned documents for current staff from server
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
          return;
        }

        const user = JSON.parse(raw) as {
          email?: string;
          staffId?: string;
          staff_id?: string;
          userId?: string | number;
          userid?: string | number;
          user_id?: string | number;
        };
        const userEmail = user?.email;

        const rawId =
          user?.staffId ?? user?.staff_id ?? user?.userId ?? user?.userid ?? user?.user_id;
        let staffId =
          rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";

        if (!staffId && userEmail) {
          const allStaff = await staffService.getAll();
          const currentStaff = allStaff.find((s) => s.email === userEmail);
          if (currentStaff?.staffId) staffId = currentStaff.staffId;
        }

        if (!staffId) {
          toast({
            title: "Error",
            description: "User session not found (staffId or staff record required).",
            variant: "destructive",
          });
          return;
        }
        setCurrentStaffId(staffId);

        const allReqs = await classConfigurationService.getDocumentRequirements();
        const staffReqs = allReqs.filter(
          (r) => r.assignedStaffId === staffId
        );

        const mapped: StaffDocument[] = staffReqs.map((r) => ({
          ...r,
          status: (r.status || "pending") as "pending" | "in_progress" | "completed" | "cancelled",
        }));

        setDocuments(mapped);
      } catch (error) {
        console.error("Failed to load staff documents", error);
        toast({
          title: "Error",
          description: "Failed to load documents assigned to you.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  // Filter documents assigned to current staff
  const myDocuments = documents.filter((doc) => doc.assignedStaffId === currentStaffId);

  // Unique classes from assigned documents (for class filter dropdown)
  const classFilterOptions = (() => {
    const seen = new Set<string>();
    const list: { value: string; label: string }[] = [{ value: "all", label: "All classes" }];
    myDocuments.forEach((doc) => {
      if (doc.classId && !seen.has(doc.classId)) {
        seen.add(doc.classId);
        list.push({
          value: doc.classId,
          label: doc.className || doc.grade || doc.classId,
        });
      }
    });
    return list;
  })();

  // Apply class filter: "all" = show all; specific class = only that class
  const classFilteredDocuments =
    classFilter === "all"
      ? myDocuments
      : myDocuments.filter((doc) => doc.classId === classFilter);

  // Filter by search and status (on top of class filter)
  const filteredDocuments = classFilteredDocuments.filter((doc) => {
    const matchesSearch =
      doc.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDocumentTypeLabel(doc.documentType).toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const handleViewDocument = (doc: StaffDocument) => {
    setSelectedDocument(doc);
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = (doc: StaffDocument) => {
    setSelectedDocument(doc);
    setUpdateStatus(doc.status);
    setUpdateNotes(doc.notes || "");
    setIsUpdateDialogOpen(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedDocument) return;

    try {
      await classConfigurationService.updateDocumentRequirementStatus(selectedDocument.id, updateStatus);
      
      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === selectedDocument.id ? { ...doc, status: updateStatus } : doc
        )
      );

      toast({
        title: "Status Updated",
        description: `Document status has been updated to ${getStatusLabel(updateStatus)}.`,
      });

      setIsUpdateDialogOpen(false);
      setSelectedDocument(null);
      setUpdateNotes("");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update document status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuickStatusUpdate = async (doc: StaffDocument, newStatus: typeof doc.status) => {
    try {
      await classConfigurationService.updateDocumentRequirementStatus(doc.id, newStatus);
      
      // Update local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, status: newStatus } : d
        )
      );

      toast({
        title: "Status Updated",
        description: `Document status has been updated to ${getStatusLabel(newStatus)}.`,
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update document status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageStudents = (doc: StaffDocument) => {
    navigate(`/staff/documents/${doc.id}/students`);
  };

  const handleStudentDocumentStatus = (studentId: string, status: StudentDocumentStatus) => {
    setStudentDocumentStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    const student = documentStudents.find((s) => s.id === studentId);
    const name = student?.fullName || [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
    const actionLabel = selectedDocument?.action === "issue" ? "issued" : "collected";
    toast({
      title: "Status Updated",
      description: `${name}'s document has been marked as ${status === "issued" || status === "collected" ? actionLabel : status}.`,
    });
  };

  const getStudentStatusColor = (status: StudentDocumentStatus) => {
    switch (status) {
      case "issued":
      case "collected":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "not_required":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStudentStatusLabel = (status: StudentDocumentStatus, action: DocumentAction) => {
    if (status === "issued" || status === "collected") {
      return action === "issue" ? "Issued" : "Collected";
    }
    return status === "pending" ? "Pending" : "Not Required";
  };

  // Students for the current document (loaded when opening Manage Students),
  // with optional class filter (when document is for all classes) and name search
  const getStudentsForDocument = (): Student[] => {
    let list = documentStudents;

    if (studentClassFilter !== "all") {
      list = list.filter((s) => (s.className || "").toLowerCase() === studentClassFilter.toLowerCase());
    }

    if (studentSearch.trim()) {
      const term = studentSearch.toLowerCase();
      list = list.filter((s) => {
        const name =
          s.fullName ||
          [s.firstName, s.lastName].filter(Boolean).join(" ") ||
          s.studentId ||
          "";
        return name.toLowerCase().includes(term);
      });
    }

    return list;
  };

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Documents</h1>
            <p className="text-muted-foreground mt-1">
              View and manage documents assigned to you
            </p>
          </div>
        </div>

        {/* Stats Cards — reflect class filter when a class is selected */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assigned</p>
                  <p className="text-2xl font-bold">{loading ? "—" : classFilteredDocuments.length}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {loading ? "—" : classFilteredDocuments.filter((d) => d.status === "pending").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-700" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {loading ? "—" : classFilteredDocuments.filter((d) => d.status === "in_progress").length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-700" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-700">
                    {loading ? "—" : classFilteredDocuments.filter((d) => d.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Assigned Documents</CardTitle>
                <CardDescription>
                  Documents you are responsible for collecting or issuing
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 sm:flex-initial min-w-[140px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Grade/Class</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Required At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No documents assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {getDocumentTypeLabel(doc.documentType)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doc.grade}</div>
                          {doc.className && (
                            <div className="text-sm text-muted-foreground">{doc.className}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDocumentActionColor(doc.action)}>
                          {getDocumentActionLabel(doc.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getRequiredAtLabel(doc.requiredAt)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(doc.status)}>
                          {getStatusLabel(doc.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.studentCount !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(doc.completedCount || 0) / doc.studentCount * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {doc.completedCount || 0}/{doc.studentCount}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageStudents(doc)}>
                              <Users className="w-4 h-4 mr-2" />
                              Manage Students
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(doc)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            {doc.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleQuickStatusUpdate(doc, "in_progress")}>
                                <Clock className="w-4 h-4 mr-2" />
                                Mark In Progress
                              </DropdownMenuItem>
                            )}
                            {doc.status === "in_progress" && (
                              <DropdownMenuItem onClick={() => handleQuickStatusUpdate(doc, "completed")}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Completed
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Document Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Document Details</DialogTitle>
              <DialogDescription>
                View complete information about this document requirement
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Document Type</Label>
                    <p className="font-medium">{getDocumentTypeLabel(selectedDocument.documentType)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Action</Label>
                    <Badge className={getDocumentActionColor(selectedDocument.action)}>
                      {getDocumentActionLabel(selectedDocument.action)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Grade</Label>
                    <p className="font-medium">{selectedDocument.grade}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Class</Label>
                    <p className="font-medium">{selectedDocument.className || "All Classes"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Semester</Label>
                    <p className="font-medium">{getSemesterTypeLabel(selectedDocument.semesterType)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Required At</Label>
                    <p className="font-medium">{getRequiredAtLabel(selectedDocument.requiredAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedDocument.status)}>
                      {getStatusLabel(selectedDocument.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Required</Label>
                    <p className="font-medium">{selectedDocument.isRequired ? "Yes" : "No"}</p>
                  </div>
                </div>
                {selectedDocument.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedDocument.description}</p>
                  </div>
                )}
                {selectedDocument.studentCount !== undefined && (
                  <div>
                    <Label className="text-muted-foreground">Progress</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(selectedDocument.completedCount || 0) / selectedDocument.studentCount * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {selectedDocument.completedCount || 0} / {selectedDocument.studentCount} completed
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedDocument) {
                  handleUpdateStatus(selectedDocument);
                }
              }}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Status Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Document Status</DialogTitle>
              <DialogDescription>
                Update the status and add notes for this document
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Document</Label>
                  <p className="text-sm font-medium">
                    {getDocumentTypeLabel(selectedDocument.documentType)} - {selectedDocument.grade}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={updateStatus}
                    onValueChange={(value: any) => setUpdateStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add any notes or comments..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStatusUpdate}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Management View - Only Right Side */}
        {isStudentViewOpen && selectedDocument && (
          <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-background lg:left-64">
            <div className="flex flex-col h-full">
              {/* Header */}
              <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
                <div className="flex items-center justify-between min-h-16 px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsStudentViewOpen(false);
                        setSelectedDocument(null);
                      }}
                      className="shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-display font-bold text-foreground truncate">
                        {getDocumentTypeLabel(selectedDocument.documentType)} - {selectedDocument.grade}
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        {selectedDocument.className || "All Classes"} • {getSemesterTypeLabel(selectedDocument.semesterType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <Badge className={getDocumentActionColor(selectedDocument.action)}>
                      {getDocumentActionLabel(selectedDocument.action)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsStudentViewOpen(false);
                        setSelectedDocument(null);
                      }}
                      className="lg:hidden"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </header>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                        <p className="text-2xl font-bold">{getStudentsForDocument().length}</p>
                      </div>
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedDocument.action === "issue" ? "Issued" : "Collected"}
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {getStudentsForDocument().filter(s => 
                            studentDocumentStatus[s.id] === (selectedDocument.action === "issue" ? "issued" : "collected")
                          ).length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-700" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {getStudentsForDocument().filter(s => 
                            studentDocumentStatus[s.id] === "pending"
                          ).length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-700" />
                    </div>
                  </CardContent>
                </Card>
                  </div>

                  {/* Students List */}
                  <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle>Students List</CardTitle>
                      <CardDescription>
                        Mark each student as {selectedDocument.action === "issue" ? "issued" : "collected"} when the document is processed
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Show class filter only when the document is not fixed to a single class */}
                      {!selectedDocument.classId && (
                        <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                          <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Filter by class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All classes</SelectItem>
                            {Array.from(
                              new Set(
                                documentStudents
                                  .map((s) => s.className)
                                  .filter((c): c is string => !!c)
                              )
                            ).map((className) => (
                              <SelectItem key={className} value={className}>
                                {className}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="relative flex-1 sm:flex-initial min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search student name..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getStudentsForDocument().map((student) => {
                      const status = studentDocumentStatus[student.id] || "pending";
                      const isCompleted = status === "issued" || status === "collected";
                      const displayName =
                        student.fullName ||
                        [student.firstName, student.lastName].filter(Boolean).join(" ") ||
                        student.studentId ||
                        "Student";
                      const displayClass =
                        student.className ||
                        [student.grade, student.section].filter(Boolean).join(" ") ||
                        "";
                      
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {student.rollNumber}
                            </div>
                            <div>
                              <div className="font-medium">{displayName}</div>
                              <div className="text-sm text-muted-foreground">
                                {student.studentId && <span>{student.studentId}</span>}
                                {student.studentId && displayClass && <span> • </span>}
                                {displayClass}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStudentStatusColor(status)}>
                              {getStudentStatusLabel(status, selectedDocument.action)}
                            </Badge>
                            <div className="flex gap-2">
                              {!isCompleted && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStudentDocumentStatus(
                                    student.id,
                                    selectedDocument.action === "issue" ? "issued" : "collected"
                                  )}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark {selectedDocument.action === "issue" ? "Issued" : "Collected"}
                                </Button>
                              )}
                              {isCompleted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStudentDocumentStatus(student.id, "pending")}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffDocuments;

