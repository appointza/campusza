import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Filter, X } from "lucide-react";
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
import { staffService } from "@/services/staff.service";
import type { Staff, StaffRole, StaffStatus } from "@/models/staff.model";
import { getStaffRoleLabel, getStaffStatusLabel } from "@/models/staff.model";
import { cn } from "@/lib/utils";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  normalizeReferenceValueIds,
  resolveReferenceValueId,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";

const ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: "teacher", label: "Teacher" },
  { value: "administrator", label: "Administrator" },
  { value: "counselor", label: "Counselor" },
  { value: "coach", label: "Coach" },
  { value: "librarian", label: "Librarian" },
  { value: "nurse", label: "Nurse" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: { value: StaffStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

type StaffEditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
  subjects: string[];
};

function asRole(value: string | undefined): StaffRole {
  return ROLE_OPTIONS.some((option) => option.value === value) ? (value as StaffRole) : "teacher";
}

function asStatus(value: string | undefined): StaffStatus {
  return STATUS_OPTIONS.some((option) => option.value === value) ? (value as StaffStatus) : "active";
}

function departmentValidationMessage(department: string, options: { id: string }[]): string | null {
  if (options.length === 0) {
    return "No departments available. Add departments in Settings first.";
  }
  if (!department?.trim() || !options.some((o) => o.id === department)) {
    return "Please select a department.";
  }
  return null;
}

function staffToEditForm(staff: Staff, referenceValues: ReferenceValue[]): StaffEditForm {
  return {
    firstName: staff.firstName || "",
    lastName: staff.lastName || "",
    email: staff.email || "",
    phone: staff.phone || "",
    role: asRole(staff.role),
    department: resolveReferenceValueId(referenceValues, ReferenceValueCategory.DEPARTMENT, staff.department),
    status: asStatus(staff.status),
    subjects: normalizeReferenceValueIds(
      referenceValues,
      ReferenceValueCategory.SUBJECT,
      parseSubjectList(staff.subjects)
    ),
  };
}

const staffCardClass = "shadow-none border-zinc-400 overflow-hidden rounded-xl bg-card";

const cardAccentBars = [
  "from-primary via-accent to-magenta",
  "from-cyan via-secondary to-primary",
  "from-purple via-primary to-cyan",
  "from-secondary via-cyan to-purple",
];

const avatarGradients = [
  "from-primary to-accent",
  "from-cyan to-secondary",
  "from-purple to-magenta",
  "from-secondary to-primary",
];

const roleChipColors: Record<string, string> = {
  teacher: "bg-sky-50 text-sky-700",
  administrator: "bg-orange-50 text-orange-700",
  counselor: "bg-violet-50 text-violet-700",
  coach: "bg-emerald-50 text-emerald-700",
  librarian: "bg-amber-50 text-amber-800",
  nurse: "bg-rose-50 text-rose-700",
  other: "bg-zinc-100 text-zinc-700",
};

const subjectBadgeColors = [
  "border-primary/25 bg-primary/10 text-primary",
  "border-cyan/30 bg-cyan/10 text-cyan-700",
  "border-purple/25 bg-purple/10 text-purple-700",
  "border-secondary/30 bg-secondary/10 text-secondary",
];

function staffInitials(staff: Staff): string {
  const first = (staff.firstName?.trim()?.[0] || staff.fullName?.trim()?.[0] || "?").toUpperCase();
  const last = staff.lastName?.trim()?.[0]?.toUpperCase() || "";
  return last ? `${first}${last}` : first;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  on_leave: "bg-yellow-100 text-yellow-700",
  inactive: "bg-muted text-muted-foreground",
  suspended: "bg-red-100 text-red-700",
};

function parseSubjectList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
      }
    } catch {
      /* comma-separated fallback */
    }
  }
  return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
}

function StaffField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground leading-snug">{children}</div>
    </div>
  );
}

function formatRole(role: string) {
  if (!role) return "—";
  try {
    return getStaffRoleLabel(role as StaffRole);
  } catch {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

function formatStatus(status: string) {
  if (!status) return "—";
  try {
    return getStaffStatusLabel(status as StaffStatus);
  } catch {
    return status === "on_leave" ? "On Leave" : status;
  }
}

const AdminStaff = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StaffEditForm | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  const departmentOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.DEPARTMENT),
    [referenceValues]
  );
  const subjectOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.SUBJECT),
    [referenceValues]
  );

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true);
      try {
        const page = await pageService.getAdminStaffPage();
        setStaffData(
          (Array.isArray(page.staff) ? page.staff : []).map((row) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? ""),
              staffId: String(item.staffid ?? ""),
              firstName: String(item.firstname ?? ""),
              lastName: String(item.lastname ?? ""),
              fullName: String(item.fullname ?? ""),
              email: String(item.email ?? ""),
              phone: String(item.phone ?? ""),
              role: String(item.role ?? ""),
              department: String(item.department ?? ""),
              status: String(item.status ?? ""),
              subjects: parseSubjectList(item.subjects_json ?? item.subjects),
            } as Staff;
          })
        );
        setReferenceValues(mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]);
      } catch (error) {
        toast({
          title: "Failed to load staff",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [toast]);

  const getDepartmentName = (value?: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.DEPARTMENT, value);
  const getSubjectNames = (values?: string[]) =>
    (values || []).map((value) => resolveReferenceValueName(referenceValues, ReferenceValueCategory.SUBJECT, value)).filter(Boolean);

  const getDisplayName = (staff: Staff) =>
    staff.fullName || `${staff.firstName || ""} ${staff.lastName || ""}`.trim() || staff.email || "Staff";

  const filteredStaff = staffData.filter(staff =>
    getDisplayName(staff).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (staff.staffId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDepartmentName(staff.department).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (staff: Staff) => {
    setDepartmentError(null);
    setEditingStaffId(staff.id);
    setEditForm(staffToEditForm(staff, referenceValues));
  };

  const cancelEdit = () => {
    setEditingStaffId(null);
    setEditForm(null);
    setDepartmentError(null);
  };

  const saveEdit = async (staff: Staff) => {
    if (!editForm) return;
    const deptErr = departmentValidationMessage(editForm.department, departmentOptions);
    setDepartmentError(deptErr);
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.role || deptErr) {
      toast({
        title: "Missing fields",
        description: deptErr || "First name, last name, email, department, and role are required.",
        variant: "destructive",
      });
      return;
    }
    setSavingId(staff.id);
    try {
      const updated = await staffService.update({
        ...staff,
        ...editForm,
        id: staff.id,
        staffId: staff.staffId,
        fullName: `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim(),
      });
      setStaffData((prev) => prev.map((row) => (row.id === staff.id ? updated : row)));
      cancelEdit();
      toast({
        title: "Staff Updated",
        description: `${updated.fullName || editForm.firstName}'s information has been updated.`,
      });
    } catch {
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (staff: Staff) => {
    if (editingStaffId === staff.id) cancelEdit();
    setSelectedStaff(staff);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedStaff) {
      setLoading(true);
      try {
        await staffService.delete(selectedStaff.id);
        setStaffData(prev => prev.filter(staff => staff.id !== selectedStaff.id));
        setIsDeleteDialogOpen(false);
        setSelectedStaff(null);
        toast({
          title: "Staff Removed",
          description: `${getDisplayName(selectedStaff)} has been removed from the system.`,
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
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">
              Staff <span className="gradient-text">Management</span>
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Manage staff, roles, departments, and subjects</p>
          </div>
          <Button variant="hero" size="sm" className="shrink-0" onClick={() => navigate("/admin/staff/new")}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or department…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 border-zinc-400 bg-background pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="shrink-0 border-zinc-400 text-muted-foreground">
            <Filter className="mr-1.5 h-4 w-4" />
            Filters
          </Button>
        </div>

        {loading && staffData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading staff…</p>
        ) : filteredStaff.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No staff match your search.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStaff.map((staff, index) => {
              const isEditing = editingStaffId === staff.id && editForm;
              const departmentName = getDepartmentName(staff.department);
              const subjectNames = getSubjectNames(staff.subjects);
              const saving = savingId === staff.id;
              const accent = index % cardAccentBars.length;
              const roleKey = asRole(staff.role);
              const roleChip = roleChipColors[roleKey] || roleChipColors.other;

              return (
                <Card
                  key={staff.id}
                  className={cn(staffCardClass, isEditing && "border-primary ring-1 ring-primary/20")}
                >
                  <div className={cn("h-1 bg-gradient-to-r", cardAccentBars[accent])} aria-hidden />
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-semibold text-white shadow-sm",
                            avatarGradients[accent]
                          )}
                          aria-hidden
                        >
                          {staffInitials(staff)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className="truncate font-display text-base font-semibold text-foreground"
                            title={getDisplayName(staff)}
                          >
                            {getDisplayName(staff)}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", roleChip)}>
                              {formatRole(staff.role)}
                            </span>
                            {(staff.staffId || staff.id) ? (
                              <span className="truncate text-[11px] text-muted-foreground">{staff.staffId || staff.id}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {!isEditing ? (
                          <span
                            className={cn(
                              "mr-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                              statusColors[staff.status] || statusColors.active
                            )}
                          >
                            {formatStatus(staff.status)}
                          </span>
                        ) : null}
                        {isEditing ? (
                          <>
                            <Button variant="ghost" size="sm" className="h-8 px-2.5" onClick={cancelEdit} disabled={saving}>
                              Cancel
                            </Button>
                            <Button variant="hero" size="sm" className="h-8" onClick={() => saveEdit(staff)} disabled={saving}>
                              {saving ? "Saving…" : "Save"}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Edit"
                              onClick={() => startEdit(staff)}
                              disabled={!!editingStaffId}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete"
                              onClick={() => handleDelete(staff)}
                              disabled={!!editingStaffId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor={`fn-${staff.id}`} className="text-xs text-muted-foreground">
                              First Name
                            </Label>
                            <Input
                              id={`fn-${staff.id}`}
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`ln-${staff.id}`} className="text-xs text-muted-foreground">
                              Last Name
                            </Label>
                            <Input
                              id={`ln-${staff.id}`}
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor={`em-${staff.id}`} className="text-xs text-muted-foreground">
                              Email
                            </Label>
                            <Input
                              id={`em-${staff.id}`}
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`ph-${staff.id}`} className="text-xs text-muted-foreground">
                              Phone
                            </Label>
                            <Input
                              id={`ph-${staff.id}`}
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Role</Label>
                            <Select
                              value={editForm.role}
                              onValueChange={(value) => setEditForm({ ...editForm, role: value as StaffRole })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs text-muted-foreground">Department</Label>
                            <Select
                              value={editForm.department || undefined}
                              onValueChange={(value) => {
                                setEditForm({ ...editForm, department: value });
                                setDepartmentError(null);
                              }}
                            >
                              <SelectTrigger className={cn(departmentError && "border-destructive focus:ring-destructive")}>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departmentOptions.length === 0 ? (
                                  <SelectItem value="no-departments" disabled>
                                    No departments available
                                  </SelectItem>
                                ) : (
                                  departmentOptions.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {departmentError ? (
                              <p className="text-sm text-destructive">{departmentError}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Subjects</Label>
                          <Select
                            value=""
                            onValueChange={(value) => {
                              if (!value || value === "no-subjects") return;
                              if (editForm.subjects.includes(value)) return;
                              setEditForm({ ...editForm, subjects: [...editForm.subjects, value] });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject(s)" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjectOptions.length === 0 ? (
                                <SelectItem value="no-subjects" disabled>
                                  No subjects available
                                </SelectItem>
                              ) : (
                                subjectOptions.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {editForm.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {editForm.subjects.map((subjectId) => {
                                const name = resolveReferenceValueName(
                                  referenceValues,
                                  ReferenceValueCategory.SUBJECT,
                                  subjectId
                                );
                                return (
                                  <Badge
                                    key={subjectId}
                                    variant="outline"
                                    className={cn(
                                      "gap-1 py-1 pl-2 pr-1 font-normal",
                                      subjectBadgeColors[editForm.subjects.indexOf(subjectId) % subjectBadgeColors.length]
                                    )}
                                  >
                                    <span>{name || subjectId}</span>
                                    <button
                                      type="button"
                                      title={`Remove ${name || "subject"}`}
                                      onClick={() =>
                                        setEditForm({
                                          ...editForm,
                                          subjects: editForm.subjects.filter((id) => id !== subjectId),
                                        })
                                      }
                                      className="rounded-full p-0.5 hover:bg-destructive/15 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Select
                            value={editForm.status}
                            onValueChange={(value) => setEditForm({ ...editForm, status: value as StaffStatus })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                          <StaffField label="First Name">{staff.firstName || "—"}</StaffField>
                          <StaffField label="Last Name">{staff.lastName || "—"}</StaffField>
                          <StaffField label="Email">
                            <span className="break-all">{staff.email || "—"}</span>
                          </StaffField>
                          <StaffField label="Phone">{staff.phone || "—"}</StaffField>
                          <StaffField label="Role">{formatRole(staff.role)}</StaffField>
                          <StaffField label="Department">{departmentName || "—"}</StaffField>
                        </div>

                        <StaffField label="Subjects">
                          {subjectNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {subjectNames.map((name, subjectIndex) => (
                                <Badge
                                  key={`${name}-${subjectIndex}`}
                                  variant="outline"
                                  className={cn(
                                    "font-normal text-xs",
                                    subjectBadgeColors[subjectIndex % subjectBadgeColors.length]
                                  )}
                                >
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </StaffField>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove{" "}
                <span className="font-semibold">{selectedStaff ? getDisplayName(selectedStaff) : ""}</span> from the staff list.
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

export default AdminStaff;
