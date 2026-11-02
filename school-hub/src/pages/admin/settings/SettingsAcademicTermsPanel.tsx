import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { Term } from "@/models/term.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueId,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import { Edit, Plus, Search, Trash2 } from "lucide-react";

const statusOptions: Term["status"][] = ["active", "completed", "upcoming", "cancelled"];

type Props = {
  referenceValues: ReferenceValue[];
  onCountChange?: (count: number) => void;
};

export function SettingsAcademicTermsPanel({ referenceValues, onCountChange }: Props) {
  const { toast } = useToast();
  const [terms, setTerms] = useState<Term[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [formData, setFormData] = useState<Partial<Term>>({
    name: "",
    startDate: "",
    endDate: "",
    status: "active",
    academicYear: "",
    description: "",
  });

  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent && !hasLoadedRef.current) {
      setInitialLoading(true);
    }
    try {
      const list = await termService.getAll();
      setTerms(list);
      onCountChangeRef.current?.(list.length);
      hasLoadedRef.current = true;
    } catch {
      onCountChangeRef.current?.(0);
      if (!options?.silent) {
        toast({
          title: "Failed to load terms",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );

  const filteredTerms = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return terms;
    return terms.filter((term) =>
      [term.name, term.academicYear, term.status, term.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [terms, search]);

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

  const openAdd = () => {
    resetForm();
    setSelectedTerm(null);
    setDialogOpen(true);
  };

  const openEdit = (term: Term) => {
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
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.status || !formData.academicYear) {
      toast({
        title: "Missing fields",
        description: "Name, dates, status, and academic year are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
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
      setDialogOpen(false);
      setSelectedTerm(null);
      resetForm();
      await load({ silent: true });
      toast({ title: "Term saved", description: saved.name });
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTerm) return;
    setSaving(true);
    try {
      await termService.delete(selectedTerm.id);
      await load({ silent: true });
      setDeleteOpen(false);
      setSelectedTerm(null);
      toast({ title: "Term removed", variant: "destructive" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const termFormFields = (
    <div className="grid gap-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="settings-term-name">Name</Label>
        <Input
          id="settings-term-name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Term 1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="settings-term-start">Start date</Label>
          <Input
            id="settings-term-start"
            type="date"
            value={formData.startDate || ""}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-term-end">End date</Label>
          <Input
            id="settings-term-end"
            type="date"
            value={formData.endDate || ""}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Academic year</Label>
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
                  Add an Academic Year reference first
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
          <Label>Status</Label>
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
        <Label htmlFor="settings-term-desc">Description</Label>
        <Input
          id="settings-term-desc"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search terms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="hero" size="sm" className="shrink-0" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add term
        </Button>
      </div>

      {initialLoading ? (
        <p className="text-sm text-muted-foreground">Loading terms…</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg border border-border/60 w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {terms.length === 0 ? "No terms yet." : "No terms match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell>{term.academicYear}</TableCell>
                    <TableCell>
                      {term.startDate} – {term.endDate}
                    </TableCell>
                    <TableCell className="capitalize">{term.status}</TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(term)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTerm(term);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit term" : "Add term"}</DialogTitle>
            <DialogDescription>Dates and academic year are used on classes, calendar, and exams.</DialogDescription>
          </DialogHeader>
          {termFormFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save term"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete term?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-semibold">{selectedTerm?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
