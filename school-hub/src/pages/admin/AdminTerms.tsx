import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { termService } from "@/services/term.service";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import type { Term } from "@/models/term.model";
import { ReferenceValueCategory, getReferenceValuesByCategory, resolveReferenceValueId, resolveReferenceValueName, type ReferenceValue } from "@/models/referencevalue.model";
import { Calendar, Edit, Plus, Search, Trash2 } from "lucide-react";

const statusOptions: Term["status"][] = ["active", "completed", "upcoming", "cancelled"];

const AdminTerms = () => {
  const { toast } = useToast();
  const [terms, setTerms] = useState<Term[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [formData, setFormData] = useState<Partial<Term>>({
    name: "",
    startDate: "",
    endDate: "",
    status: "active",
    academicYear: "",
    description: "",
  });

  useEffect(() => {
    const loadTerms = async () => {
      setLoading(true);
      try {
        const page = await pageService.getAdminTermsPage();
        setTerms(
          (Array.isArray(page.terms) ? page.terms : []).map((row) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              name: String(item.name ?? ""),
              startDate: String(item.startdate ?? ""),
              endDate: String(item.enddate ?? ""),
              status: String(item.status ?? "active") as Term["status"],
              academicYear: String(item.academicyear ?? ""),
              description: String(item.description ?? ""),
            };
          })
        );
        setReferenceValues(mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]);
      } catch (error) {
        toast({
          title: "Failed to load terms",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTerms();
  }, [toast]);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );

  const filteredTerms = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return terms;
    return terms.filter((term) =>
      [
        term.name,
        term.academicYear,
        term.status,
        term.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [terms, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      status: "active",
      academicYear: "",
      description: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (term: Term) => {
    setSelectedTerm(term);
    setFormData({
      id: term.id,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      status: term.status,
      academicYear: resolveReferenceValueId(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, term.academicYear),
      description: term.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.status || !formData.academicYear) {
      toast({
        title: "Missing fields",
        description: "Name, start date, end date, status, and academic year are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const resolvedAcademicYear = resolveReferenceValueName(
        referenceValues,
        ReferenceValueCategory.ACADEMIC_YEAR,
        formData.academicYear
      );
      const saved = await termService.save({
        ...formData,
        id: formData.id || "",
        status: formData.status || "active",
        academicYear: resolvedAcademicYear,
      });
      setTerms((prev) => {
        const exists = prev.some((t) => t.id === saved.id);
        return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev];
      });
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedTerm(null);
      resetForm();
      toast({
        title: "Term Saved",
        description: `${saved.name} has been saved successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (term: Term) => {
    setSelectedTerm(term);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTerm) return;
    setLoading(true);
    try {
      await termService.delete(selectedTerm.id);
      setTerms((prev) => prev.filter((t) => t.id !== selectedTerm.id));
      setIsDeleteDialogOpen(false);
      setSelectedTerm(null);
      toast({
        title: "Term Removed",
        description: `${selectedTerm.name} has been removed.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Terms</h1>
            <p className="text-muted-foreground mt-1">Manage academic terms and semesters</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Term
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Term</DialogTitle>
                <DialogDescription>Enter the term details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="term-name">Name</Label>
                  <Input
                    id="term-name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Term 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term-start">Start Date</Label>
                    <Input
                      id="term-start"
                      type="date"
                      value={formData.startDate || ""}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term-end">End Date</Label>
                    <Input
                      id="term-end"
                      type="date"
                      value={formData.endDate || ""}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="term-year">Academic Year</Label>
                  <Select
                    value={formData.academicYear || ""}
                    onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
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
                    <Label htmlFor="term-status">Status</Label>
                    <Select
                      value={formData.status || "active"}
                      onValueChange={(value) => setFormData({ ...formData, status: value as Term["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term-desc">Description</Label>
                  <Input
                    id="term-desc"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Semester 1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Term"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Term List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, academic year, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No terms found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.name}</TableCell>
                      <TableCell>{term.academicYear}</TableCell>
                      <TableCell>
                        {term.startDate} - {term.endDate}
                      </TableCell>
                      <TableCell className="capitalize">{term.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(term)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(term)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Term</DialogTitle>
              <DialogDescription>Update the term details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-term-name">Name</Label>
                <Input
                  id="edit-term-name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-term-start">Start Date</Label>
                  <Input
                    id="edit-term-start"
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-term-end">End Date</Label>
                  <Input
                    id="edit-term-end"
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-term-year">Academic Year</Label>
                  <Select
                    value={formData.academicYear || ""}
                    onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="edit-term-status">Status</Label>
                  <Select
                    value={formData.status || "active"}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Term["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-term-desc">Description</Label>
                <Input
                  id="edit-term-desc"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Term?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove <span className="font-semibold">{selectedTerm?.name}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminTerms;
