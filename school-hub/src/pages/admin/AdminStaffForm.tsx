import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff.service";
import type { Staff, StaffRole, StaffStatus } from "@/models/staff.model";
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

type StaffFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  status: StaffStatus;
  subjects: string[];
};

const emptyForm = (): StaffFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "teacher",
  department: "",
  status: "active",
  subjects: [],
});

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

const AdminStaffForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [existing, setExisting] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffFormValues>(emptyForm);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [missing, setMissing] = useState(false);
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
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setMissing(false);
      try {
        const page = await pageService.getAdminStaffPage();
        const refs = mapReferenceValuesFromPage(
          Array.isArray(page.referencevalues) ? page.referencevalues : []
        ) as ReferenceValue[];
        if (cancelled) return;
        setReferenceValues(refs);

        if (mode !== "edit") return;
        if (!id) {
          setMissing(true);
          return;
        }
        const staff = await staffService.getById(id);
        if (cancelled) return;
        if (!staff?.id) {
          setMissing(true);
          return;
        }
        setExisting(staff);
        setForm({
          firstName: staff.firstName || "",
          lastName: staff.lastName || "",
          email: staff.email || "",
          phone: staff.phone || "",
          role: asRole(staff.role),
          department: resolveReferenceValueId(refs, ReferenceValueCategory.DEPARTMENT, staff.department),
          status: asStatus(staff.status),
          subjects: normalizeReferenceValueIds(
            refs,
            ReferenceValueCategory.SUBJECT,
            Array.isArray(staff.subjects) ? staff.subjects : []
          ),
        });
      } catch {
        if (!cancelled) {
          if (mode === "edit") setMissing(true);
          toast({
            title: mode === "edit" ? "Failed to load staff" : "Failed to load form",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, mode, toast]);

  const goBack = () => navigate("/admin/staff");

  const handleSave = async () => {
    const deptErr = departmentValidationMessage(form.department, departmentOptions);
    setDepartmentError(deptErr);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.role || deptErr) {
      toast({
        title: "Missing fields",
        description: deptErr || "First name, last name, email, department, and role are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const created = await staffService.create({
          ...form,
          staffId: `STF-${Date.now()}`,
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
          joiningDate: new Date().toISOString(),
          status: form.status || "active",
          subjects: form.subjects,
        });
        toast({
          title: "Staff Added",
          description: `${created.fullName || form.firstName} has been added. They will receive a setup email to choose a password (check spam).`,
        });
      } else if (existing) {
        const updated = await staffService.update({
          ...existing,
          ...form,
          id: existing.id,
          staffId: existing.staffId,
          fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        });
        toast({
          title: "Staff Updated",
          description: `${updated.fullName || form.firstName}'s information has been updated successfully.`,
        });
      }
      goBack();
    } catch {
      toast({
        title: mode === "create" ? "Add failed" : "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "create" ? "Add Staff" : "Edit Staff";

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" onClick={goBack} title="Back to staff">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-1">
              {mode === "create"
                ? "Enter the staff member details to add them to the system."
                : "Update the staff member's information."}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : missing ? (
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6 space-y-4">
              <p className="text-foreground">This staff member could not be found.</p>
              <Button variant="outline" onClick={goBack}>
                Back to staff
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-border/50">
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-first-name">First Name</Label>
                    <Input
                      id="staff-first-name"
                      placeholder="Sarah"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-last-name">Last Name</Label>
                    <Input
                      id="staff-last-name"
                      placeholder="Johnson"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="sarah.j@school.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-phone">Phone</Label>
                  <Input
                    id="staff-phone"
                    placeholder="+1 234 567 890"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-role">Role</Label>
                    <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as StaffRole })}>
                      <SelectTrigger id="staff-role">
                        <SelectValue placeholder="Select role" />
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
                  <div className="space-y-2">
                    <Label htmlFor="staff-department">Department</Label>
                    <Select
                      value={form.department || undefined}
                      onValueChange={(value) => {
                        setForm({ ...form, department: value });
                        setDepartmentError(null);
                      }}
                    >
                      <SelectTrigger
                        id="staff-department"
                        className={cn(departmentError && "border-destructive focus:ring-destructive")}
                      >
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
                    {departmentError ? <p className="text-sm text-destructive">{departmentError}</p> : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subjects</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!value || value === "no-subjects") return;
                      if (form.subjects.includes(value)) return;
                      setForm({ ...form, subjects: [...form.subjects, value] });
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
                  {form.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.subjects.map((subjectId) => {
                        const name = resolveReferenceValueName(
                          referenceValues,
                          ReferenceValueCategory.SUBJECT,
                          subjectId
                        );
                        return (
                          <Badge key={subjectId} variant="secondary" className="font-normal gap-1 pl-2 pr-1 py-1">
                            <span>{name || subjectId}</span>
                            <button
                              type="button"
                              title={`Remove ${name || "subject"}`}
                              onClick={() =>
                                setForm({
                                  ...form,
                                  subjects: form.subjects.filter((item) => item !== subjectId),
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
                {mode === "edit" && (
                  <div className="space-y-2">
                    <Label htmlFor="staff-status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => setForm({ ...form, status: value as StaffStatus })}
                    >
                      <SelectTrigger id="staff-status">
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
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={goBack} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : mode === "create" ? "Add Staff" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminStaffForm;
