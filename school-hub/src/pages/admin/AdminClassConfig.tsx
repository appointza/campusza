import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings,
  FileText,
  DollarSign,
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  UserCog
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { 
  ClassFeeConfiguration, 
  DocumentRequirement,
  DocumentType,
  DocumentAction
} from "@/models/class-configuration.model";
import { 
  getDocumentTypeLabel, 
  getRequiredAtLabel,
  getDocumentActionLabel,
  getDocumentActionColor
} from "@/models/class-configuration.model";
import { classConfigurationService } from "@/services/class-configuration.service";
import { classService } from "@/services/class.service";
import { termService } from "@/services/term.service";
import { staffService } from "@/services/staff.service";
import { referenceValueService } from "@/services/reference-value.service";
import type { Class } from "@/models/class.model";
import type { Term } from "@/models/term.model";
import type { Staff } from "@/models/staff.model";
import type { ReferenceValue } from "@/models/referencevalue.model";
import { ReferenceValueCategory, getReferenceValuesByCategory, resolveReferenceValueId, resolveReferenceValueName } from "@/models/referencevalue.model";

const AdminClassConfig = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("documents");
  const [searchTerm, setSearchTerm] = useState("");
  const [feeSearchTerm, setFeeSearchTerm] = useState("");
  const [selectedFeeGrade, setSelectedFeeGrade] = useState("all");
  const [selectedFeeTerm, setSelectedFeeTerm] = useState("all");
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [loading, setLoading] = useState(false);

  // Fee Configuration State
  const [feeConfigs, setFeeConfigs] = useState<ClassFeeConfiguration[]>([]);
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [selectedFeeConfig, setSelectedFeeConfig] = useState<ClassFeeConfiguration | null>(null);
  const [feeFormData, setFeeFormData] = useState<Partial<ClassFeeConfiguration>>({
    grade: "",
    semesterType: "term_based",
    totalAmount: 0,
    currency: "USD",
    numberOfInstallments: 1,
  });

  // Document Requirement State
  const [documentReqs, setDocumentReqs] = useState<DocumentRequirement[]>([]);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [selectedDocumentReq, setSelectedDocumentReq] = useState<DocumentRequirement | null>(null);
  const [documentFormData, setDocumentFormData] = useState<Partial<DocumentRequirement>>({
    grade: "",
    semesterType: "term_based",
    documentType: "bonafide_certificate",
    action: "collect",
    isRequired: false,
    requiredAt: "admission",
    assignedStaffId: undefined,
    assignedStaffName: undefined,
  });
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [selectedDocumentGrade, setSelectedDocumentGrade] = useState("all");
  const [selectedDocumentType, setSelectedDocumentType] = useState("all");

  const gradeOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.GRADE),
    [referenceValues]
  );

  const getGradeName = (gradeId?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.GRADE, gradeId);
  const getTermName = (termId?: string) =>
    terms.find((term) => term.id === termId)?.name || "";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [
          classData,
          termData,
          staffData,
          refValues,
          feeData,
          docData,
        ] = await Promise.all([
          classService.getAll(),
          termService.getAll(),
          staffService.getAll(),
          referenceValueService.getAll(),
          classConfigurationService.getFeeConfigs(),
          classConfigurationService.getDocumentRequirements(),
        ]);
        setClasses(classData);
        setTerms(termData);
        setStaff(staffData);
        setReferenceValues(refValues);
        setFeeConfigs(feeData);
        setDocumentReqs(docData);
      } catch (error) {
        toast({
          title: "Failed to load class configuration",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter document requirements
  const filteredDocumentReqs = documentReqs.filter(req => {
    const matchesSearch = 
      getGradeName(req.grade).toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
      getDocumentTypeLabel(req.documentType).toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
      getRequiredAtLabel(req.requiredAt).toLowerCase().includes(documentSearchTerm.toLowerCase()) ||
      getDocumentActionLabel(req.action).toLowerCase().includes(documentSearchTerm.toLowerCase());
    const normalizedGrade = resolveReferenceValueId(referenceValues, ReferenceValueCategory.GRADE, req.grade);
    const matchesGrade = selectedDocumentGrade === "all" || normalizedGrade === selectedDocumentGrade;
    const matchesType = selectedDocumentType === "all" || req.documentType === selectedDocumentType;
    return matchesSearch && matchesGrade && matchesType && req.isActive;
  });

  // Filter fee structures
  const filteredFeeConfigs = feeConfigs.filter(config => {
    const termName = config.termName || terms.find(t => t.id === config.termId)?.name || "";
    const matchesSearch = 
      getGradeName(config.grade).toLowerCase().includes(feeSearchTerm.toLowerCase()) ||
      termName.toLowerCase().includes(feeSearchTerm.toLowerCase()) ||
      (config.className || "").toLowerCase().includes(feeSearchTerm.toLowerCase());
    const normalizedGrade = resolveReferenceValueId(referenceValues, ReferenceValueCategory.GRADE, config.grade);
    const matchesGrade = selectedFeeGrade === "all" || normalizedGrade === selectedFeeGrade;
    const matchesTerm = selectedFeeTerm === "all" || config.termId === selectedFeeTerm;
    return matchesSearch && matchesGrade && matchesTerm && config.isActive;
  });

  // Document types
  const documentTypes: DocumentType[] = [
    "marksheet",
    "report_card",
    "transfer_certificate",
    "bonafide_certificate",
    "character_certificate",
    "migration_certificate",
    "id_card",
    "other"
  ];

  const handleAddDocumentReq = () => {
    setSelectedDocumentReq(null);
    setDocumentFormData({
      grade: "",
      semesterType: "term_based",
      documentType: "bonafide_certificate",
      action: "collect",
      isRequired: false,
      requiredAt: "admission",
    });
    setIsDocumentDialogOpen(true);
  };

  const handleEditDocumentReq = (req: DocumentRequirement) => {
    setSelectedDocumentReq(req);
    setDocumentFormData({
      ...req,
      grade: resolveReferenceValueId(referenceValues, ReferenceValueCategory.GRADE, req.grade),
      semesterType: "term_based",
    });
    setIsDocumentDialogOpen(true);
  };

  const handleSaveDocumentReq = async () => {
    if (!documentFormData.grade || !documentFormData.documentType || !documentFormData.action) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!documentFormData.termId) {
      toast({
        title: "Validation Error",
        description: "Term is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const className = classes.find(c => c.id === documentFormData.classId)?.name;
      const termName = terms.find(t => t.id === documentFormData.termId)?.name;
      const staffName = staff.find(s => s.staffId === documentFormData.assignedStaffId)?.fullName;

      const saved = await classConfigurationService.saveDocumentRequirement({
        ...documentFormData,
        termId: documentFormData.termId,
        termName,
        id: selectedDocumentReq?.id || documentFormData.id,
        className,
        assignedStaffName: staffName,
        semesterType: "term_based",
      });

      setDocumentReqs(prev => {
        const exists = prev.some(r => r.id === saved.id);
        return exists ? prev.map(r => (r.id === saved.id ? saved : r)) : [...prev, saved];
      });

      toast({
        title: selectedDocumentReq ? "Requirement Updated" : "Requirement Added",
        description: "Document requirement has been saved successfully.",
      });

      setIsDocumentDialogOpen(false);
      setSelectedDocumentReq(null);
    } catch (error) {
      toast({
        title: "Failed to save requirement",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocumentReq = async (req: DocumentRequirement) => {
    setLoading(true);
    try {
      await classConfigurationService.deleteDocumentRequirement(req.id);
      setDocumentReqs(prev => prev.filter(r => r.id !== req.id));
      toast({
        title: "Requirement Removed",
        description: "Document requirement has been removed.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Failed to remove requirement",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fee Configuration Handlers
  const handleAddFeeConfig = () => {
    setSelectedFeeConfig(null);
    setFeeFormData({
      grade: "",
      semesterType: "term_based",
      totalAmount: 0,
      currency: "USD",
      numberOfInstallments: 1,
    });
    setIsFeeDialogOpen(true);
  };

  const handleEditFeeConfig = (config: ClassFeeConfiguration) => {
    setSelectedFeeConfig(config);
    setFeeFormData({
      ...config,
      grade: resolveReferenceValueId(referenceValues, ReferenceValueCategory.GRADE, config.grade),
      semesterType: "term_based",
    });
    setIsFeeDialogOpen(true);
  };

  const handleSaveFeeConfig = async () => {
    if (!feeFormData.grade || !feeFormData.totalAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!feeFormData.termId) {
      toast({
        title: "Validation Error",
        description: "Term is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const className = classes.find(c => c.id === feeFormData.classId)?.name;
      const termName = terms.find(t => t.id === feeFormData.termId)?.name;

      const saved = await classConfigurationService.saveFeeConfig({
        ...feeFormData,
        termId: feeFormData.termId,
        termName,
        id: selectedFeeConfig?.id || feeFormData.id,
        className,
        feeStructures: feeFormData.feeStructures || [],
        paymentSchedule: feeFormData.paymentSchedule || "one_time",
        semesterType: "term_based",
      });

      setFeeConfigs(prev => {
        const exists = prev.some(c => c.id === saved.id);
        return exists ? prev.map(c => (c.id === saved.id ? saved : c)) : [...prev, saved];
      });

      toast({
        title: selectedFeeConfig ? "Configuration Updated" : "Configuration Added",
        description: "Fee configuration has been saved successfully.",
      });

      setIsFeeDialogOpen(false);
      setSelectedFeeConfig(null);
    } catch (error) {
      toast({
        title: "Failed to save configuration",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeeConfig = async (config: ClassFeeConfiguration) => {
    setLoading(true);
    try {
      await classConfigurationService.deleteFeeConfig(config.id);
      setFeeConfigs(prev => prev.filter(c => c.id !== config.id));
      toast({
        title: "Configuration Removed",
        description: "Fee configuration has been removed.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Failed to remove configuration",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Class Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Configure document requirements (including marksheets) and fees by class and semester
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">
              <FolderOpen className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="w-4 h-4 mr-2" />
              Fee Configuration
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Requirements</CardTitle>
                    <CardDescription>
                      Configure document requirements by class and semester. 
                      Maintain records of documents collected from students or issued by the school.
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddDocumentReq}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by grade, document type, or requirement..."
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Filter by Grade</Label>
                      <Select value={selectedDocumentGrade} onValueChange={setSelectedDocumentGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Grades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Grades</SelectItem>
                          {gradeOptions.length === 0 ? (
                            <SelectItem value="no-grades">No grades found</SelectItem>
                          ) : (
                            gradeOptions.map((grade) => (
                              <SelectItem key={grade.id} value={grade.id}>
                                {grade.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Filter by Document Type</Label>
                      <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Document Types</SelectItem>
                          {documentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getDocumentTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Document Requirements Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Assigned Staff</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Required At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocumentReqs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No document requirements found. Click "Add Document" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocumentReqs.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{getGradeName(req.grade)}</TableCell>
                          <TableCell>{req.className || "All Classes"}</TableCell>
                          <TableCell>{req.termName || getTermName(req.termId) || "N/A"}</TableCell>
                          <TableCell>{getDocumentTypeLabel(req.documentType)}</TableCell>
                          <TableCell>
                            <Badge className={getDocumentActionColor(req.action)}>
                              {getDocumentActionLabel(req.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {req.assignedStaffName ? (
                              <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{req.assignedStaffName}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not Assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {req.isRequired ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle className="w-3 h-3 mr-1" />
                                Optional
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{getRequiredAtLabel(req.requiredAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditDocumentReq(req)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteDocumentReq(req)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Summary */}
                {filteredDocumentReqs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Requirements: <span className="font-semibold text-foreground">{filteredDocumentReqs.length}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Required: <span className="font-semibold text-foreground">
                          {filteredDocumentReqs.filter(r => r.isRequired).length}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Configuration Tab */}
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fee Configuration</CardTitle>
                    <CardDescription>
                      View and manage fee structures by class and semester
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddFeeConfig}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Configuration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by grade or term..."
                      value={feeSearchTerm}
                      onChange={(e) => setFeeSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Filter by Grade</Label>
                      <Select value={selectedFeeGrade} onValueChange={setSelectedFeeGrade}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Grades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Grades</SelectItem>
                          {gradeOptions.length === 0 ? (
                            <SelectItem value="no-grades">No grades found</SelectItem>
                          ) : (
                            gradeOptions.map((grade) => (
                              <SelectItem key={grade.id} value={grade.id}>
                                {grade.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Filter by Term</Label>
                      <Select value={selectedFeeTerm} onValueChange={setSelectedFeeTerm}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Terms</SelectItem>
                          {terms.length === 0 ? (
                            <SelectItem value="no-terms">No terms found</SelectItem>
                          ) : (
                            terms.map((term) => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Fee Structures Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeeConfigs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No fee structures found. Click "Add Configuration" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFeeConfigs.map((config) => {
                        const term = terms.find(t => t.id === config.termId);
                        return (
                          <TableRow key={config.id}>
                            <TableCell className="font-medium">{term?.name || "N/A"}</TableCell>
                            <TableCell>{getGradeName(config.grade)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {config.className || "All Classes"}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${Number(config.totalAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditFeeConfig(config)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteFeeConfig(config)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Summary */}
                {filteredFeeConfigs.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Structures: <span className="font-semibold text-foreground">{filteredFeeConfigs.length}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Total Amount: <span className="font-semibold text-foreground">
                          ${filteredFeeConfigs.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Fee Configuration Dialog */}
        <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedFeeConfig ? "Edit Fee Configuration" : "Add Fee Configuration"}
              </DialogTitle>
              <DialogDescription>
                Configure fee structure for a specific class and semester
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee-grade">Grade *</Label>
                  <Select
                    value={feeFormData.grade || ""}
                    onValueChange={(value) =>
                      setFeeFormData({ ...feeFormData, grade: value, classId: undefined, className: undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.length === 0 ? (
                        <SelectItem value="no-grades">No grades found</SelectItem>
                      ) : (
                        gradeOptions.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-class">Class (Optional)</Label>
                  <Select
                    value={feeFormData.classId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setFeeFormData({ ...feeFormData, classId: undefined, className: undefined });
                      } else {
                        const selectedClass = classes.find(c => c.id === value);
                        setFeeFormData({
                          ...feeFormData,
                          classId: value,
                          className: selectedClass?.name,
                        });
                      }
                    }}
                    disabled={!feeFormData.grade}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Classes</SelectItem>
                      {classes
                        .filter(c => !feeFormData.grade || c.grade === feeFormData.grade)
                        .map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-term">Term *</Label>
                <Select
                  value={feeFormData.termId || ""}
                  onValueChange={(value) => {
                    const selectedTerm = terms.find(t => t.id === value);
                    setFeeFormData({
                      ...feeFormData,
                      termId: value,
                      termName: selectedTerm?.name,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.length === 0 ? (
                      <SelectItem value="no-terms" disabled>
                        No terms found
                      </SelectItem>
                    ) : (
                      terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee-amount">Total Amount *</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeFormData.totalAmount || 0}
                    onChange={(e) =>
                      setFeeFormData({ ...feeFormData, totalAmount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-currency">Currency</Label>
                  <Select
                    value={feeFormData.currency || "USD"}
                    onValueChange={(value) =>
                      setFeeFormData({ ...feeFormData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee-schedule">Payment Schedule *</Label>
                  <Select
                    value={feeFormData.paymentSchedule || "one_time"}
                    onValueChange={(value) =>
                      setFeeFormData({ ...feeFormData, paymentSchedule: value as ClassFeeConfiguration["paymentSchedule"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One Time</SelectItem>
                      <SelectItem value="installments">Installments</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-installments">Number of Installments</Label>
                  <Input
                    id="fee-installments"
                    type="number"
                    min="1"
                    value={feeFormData.numberOfInstallments || 1}
                    onChange={(e) =>
                      setFeeFormData({ ...feeFormData, numberOfInstallments: parseInt(e.target.value) || 1 })
                    }
                    disabled={feeFormData.paymentSchedule !== "installments"}
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFeeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFeeConfig}>
                {selectedFeeConfig ? "Update" : "Create"} Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Requirement Dialog */}
        <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedDocumentReq ? "Edit Document Requirement" : "Add Document Requirement"}
              </DialogTitle>
              <DialogDescription>
                Configure document requirements for a specific class and semester
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-grade">Grade *</Label>
                  <Select
                    value={documentFormData.grade || ""}
                    onValueChange={(value) =>
                      setDocumentFormData({ ...documentFormData, grade: value, classId: undefined, className: undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {gradeOptions.length === 0 ? (
                        <SelectItem value="no-grades">No grades found</SelectItem>
                      ) : (
                        gradeOptions.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-class">Class (Optional)</Label>
                  <Select
                    value={documentFormData.classId || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setDocumentFormData({ ...documentFormData, classId: undefined, className: undefined });
                      } else {
                        const selectedClass = classes.find(c => c.id === value);
                        setDocumentFormData({
                          ...documentFormData,
                          classId: value,
                          className: selectedClass?.name,
                        });
                      }
                    }}
                    disabled={!documentFormData.grade || documentFormData.grade === "all"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Classes</SelectItem>
                      {classes
                        .filter(c => !documentFormData.grade || c.grade === documentFormData.grade || documentFormData.grade === "all")
                        .map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-term">Term *</Label>
                <Select
                  value={documentFormData.termId || ""}
                  onValueChange={(value) => {
                    const selectedTerm = terms.find(t => t.id === value);
                    setDocumentFormData({
                      ...documentFormData,
                      termId: value,
                      termName: selectedTerm?.name,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.length === 0 ? (
                      <SelectItem value="no-terms" disabled>
                        No terms found
                      </SelectItem>
                    ) : (
                      terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type *</Label>
                <Select
                  value={documentFormData.documentType || "bonafide_certificate"}
                  onValueChange={(value) => {
                    const newType = value as DocumentType;
                    // Auto-set action based on document type
                    const autoAction: DocumentAction = newType === "marksheet" ? "issue" : 
                      (newType === "transfer_certificate" || newType === "birth" ? "collect" : "issue");
                    setDocumentFormData({ 
                      ...documentFormData, 
                      documentType: newType,
                      action: autoAction
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getDocumentTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-action">Action Type *</Label>
                <Select
                  value={documentFormData.action || "collect"}
                  onValueChange={(value) =>
                    setDocumentFormData({ ...documentFormData, action: value as DocumentAction })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collect">Collect from Student</SelectItem>
                    <SelectItem value="issue">Issue by School</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {documentFormData.documentType === "marksheet" 
                    ? "Marksheets are issued by the school. This configuration is for maintaining records of issued marksheets, not for generating them."
                    : documentFormData.action === "collect" 
                    ? "Document must be collected from the student (e.g., Transfer Certificate, Birth Certificate)"
                    : "Document must be issued by the school (e.g., Bonafide Certificate, Character Certificate)"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-required-at">Required At *</Label>
                <Select
                  value={documentFormData.requiredAt || "admission"}
                  onValueChange={(value) =>
                    setDocumentFormData({ ...documentFormData, requiredAt: value as DocumentRequirement["requiredAt"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admission">At Admission</SelectItem>
                    <SelectItem value="term_start">At Term Start</SelectItem>
                    <SelectItem value="term_end">At Term End</SelectItem>
                    <SelectItem value="graduation">At Graduation</SelectItem>
                    <SelectItem value="on_demand">On Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-staff">Assigned Staff (Optional)</Label>
                <Select
                  value={documentFormData.assignedStaffId || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setDocumentFormData({ 
                        ...documentFormData, 
                        assignedStaffId: undefined, 
                        assignedStaffName: undefined 
                      });
                    } else {
                      const selectedStaff = staff.find(s => s.staffId === value);
                      setDocumentFormData({
                        ...documentFormData,
                        assignedStaffId: value, // store business code STF-...
                        assignedStaffName: selectedStaff?.fullName,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Staff Assigned</SelectItem>
                    {staff
                      .filter((staffMember) => !!staffMember.staffId)
                      .map((staffMember) => (
                        <SelectItem key={staffMember.staffId} value={staffMember.staffId}>
                          {staffMember.fullName || staffMember.email} - {staffMember.role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assign a staff member responsible for handling this document
                </p>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="doc-required">Document Required</Label>
                  <p className="text-xs text-muted-foreground">
                    Whether this document must be provided
                  </p>
                </div>
                <Switch
                  id="doc-required"
                  checked={documentFormData.isRequired || false}
                  onCheckedChange={(checked) =>
                    setDocumentFormData({ ...documentFormData, isRequired: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-description">Description (Optional)</Label>
                <Input
                  id="doc-description"
                  value={documentFormData.description || ""}
                  onChange={(e) =>
                    setDocumentFormData({ ...documentFormData, description: e.target.value })
                  }
                  placeholder="Additional notes about this requirement"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDocumentReq}>
                {selectedDocumentReq ? "Update" : "Create"} Requirement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminClassConfig;

