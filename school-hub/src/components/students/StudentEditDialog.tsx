import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Student, StudentStatus } from "@/models/student.model";
import {
  defaultExtendedProfile,
  type StudentExtendedProfile,
} from "@/models/student-profile.model";
import { studentService } from "@/services/student.service";
import { studentEnrollmentService } from "@/services/student-enrollment.service";
import { getStudentStatusLabel } from "@/models/student.model";

export type StudentEnrollmentContext = {
  /** Empty when only the student profile exists (no enrollment row). */
  enrollmentId?: string;
  academicYear: string;
  classId: string;
  className: string;
  grade: string;
  section: string;
  rollNumber?: number;
};

type StudentEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentInternalId: string;
  enrollment: StudentEnrollmentContext;
  classLabel?: string;
  onSaved?: () => void;
  /** dialog = modal; panel = inline right-side full view */
  variant?: "dialog" | "panel";
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const STUDENT_STATUSES: StudentStatus[] = ["active", "inactive", "transferred", "graduated", "suspended"];
const DOCUMENT_TYPES = [
  "Birth Certificate",
  "Transfer Certificate",
  "Aadhaar Copy",
  "Photo",
  "Address Proof",
  "Medical Certificate",
  "Previous Mark Sheet",
];

export function StudentEditDialog({
  open,
  onOpenChange,
  studentInternalId,
  enrollment,
  classLabel,
  onSaved,
  variant = "dialog",
}: StudentEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [extended, setExtended] = useState<StudentExtendedProfile>(defaultExtendedProfile());

  useEffect(() => {
    if (!open || !studentInternalId) return;
    setLoading(true);
    studentService
      .getById(studentInternalId)
      .then((data) => {
        setStudent({
          ...data,
          rollNumber: enrollment.rollNumber ?? data.rollNumber,
          currentAcademicYear: enrollment.academicYear || data.currentAcademicYear,
          classId: enrollment.classId,
          className: enrollment.className,
          grade: enrollment.grade,
          section: enrollment.section,
          parentGuardian: data.parentGuardian ?? {
            name: "",
            relationship: "guardian",
            phone: data.phone ?? "",
            email: "",
          },
          address: data.address ?? { street: "", city: "", state: "", zipCode: "", country: "" },
        });
        setExtended(data.extendedProfile ?? defaultExtendedProfile());
      })
      .catch(() => {
        toast({
          title: "Could not load student",
          description: "Try again or refresh the page.",
          variant: "destructive",
        });
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, studentInternalId, enrollment, toast, onOpenChange]);

  const updateStudent = (patch: Partial<Student>) => {
    setStudent((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!student) return;
    if (!student.studentId?.trim() || !student.firstName?.trim() || !student.gender) {
      toast({ title: "Missing fields", description: "Admission no, first name, and gender are required.", variant: "destructive" });
      return;
    }
    if (!student.parentGuardian?.name?.trim() || !student.parentGuardian.phone?.trim()) {
      toast({ title: "Guardian required", description: "Guardian name and phone are required.", variant: "destructive" });
      return;
    }
    if (enrollment.enrollmentId && (student.rollNumber == null || student.rollNumber < 1)) {
      toast({ title: "Roll number required", description: "Enter a valid class roll number.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const display = extended.displayName?.trim()
        || `${student.firstName} ${student.lastName}`.trim();
      let payload: Student = {
        ...student,
        fullName: display,
        extendedProfile: extended,
        medicalConditions: [student.medicalConditions, extended.allergies ? `Allergies: ${extended.allergies}` : ""]
          .filter(Boolean)
          .join("; ") || student.medicalConditions,
        emergencyContact: {
          name: student.parentGuardian.name,
          relationship: student.parentGuardian.relationship,
          phone: student.parentGuardian.phone,
        },
      };
      if (enrollment.enrollmentId) {
        const latest = await studentService.getById(studentInternalId);
        payload = {
          ...payload,
          classId: latest.classId,
          className: latest.className,
          grade: latest.grade,
          section: latest.section,
          currentAcademicYear: latest.currentAcademicYear,
          rollNumber: latest.rollNumber,
        };
      }
      await studentService.update(payload);
      if (enrollment.enrollmentId) {
        await studentEnrollmentService.updateEnrollment({
          enrollmentId: enrollment.enrollmentId,
          rollNumber: student.rollNumber,
        });
      }
      toast({
        title: "Student updated",
        description: enrollment.enrollmentId ? "Profile and enrollment saved." : "Profile saved.",
      });
      if (variant === "dialog") onOpenChange(false);
      onSaved?.();
    } catch {
      toast({ title: "Save failed", description: "Could not update student.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const description = `Profile fields are stored on the student record. Class, section, and roll number apply to the current enrollment${classLabel ? ` (${classLabel})` : ""}.`;

  const formBody = loading || !student ? (
    <div className="py-12 text-center text-muted-foreground">Loading student…</div>
  ) : (
    <Tabs defaultValue="basic" className="flex flex-col min-h-0">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto gap-1 shrink-0">
              <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
              <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
              <TabsTrigger value="parents" className="text-xs">Parents</TabsTrigger>
              <TabsTrigger value="address" className="text-xs">Address</TabsTrigger>
              <TabsTrigger value="medical" className="text-xs">Medical</TabsTrigger>
              <TabsTrigger value="transport" className="text-xs">Transport</TabsTrigger>
              <TabsTrigger value="fee" className="text-xs">Fee</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Docs</TabsTrigger>
            </TabsList>

      <div className="flex-1 overflow-y-auto py-4 min-h-[320px] max-h-[calc(100vh-16rem)]">
              <TabsContent value="basic" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Admission No *</Label>
                    <Input value={student.studentId} onChange={(e) => updateStudent({ studentId: e.target.value })} />
                  </div>
                  <div>
                    <Label>Roll Number *</Label>
                    <Input type="number" min={1} value={student.rollNumber ?? ""} onChange={(e) => updateStudent({ rollNumber: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={student.firstName} onChange={(e) => updateStudent({ firstName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={student.lastName} onChange={(e) => updateStudent({ lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={extended.displayName}
                    onChange={(e) => setExtended({ ...extended, displayName: e.target.value })}
                    placeholder="Optional — defaults to first + last name"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Gender *</Label>
                    <Select value={student.gender} onValueChange={(v) => updateStudent({ gender: v as Student["gender"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={student.dateOfBirth ?? ""} onChange={(e) => updateStudent({ dateOfBirth: e.target.value })} />
                  </div>
                  <div>
                    <Label>Blood Group</Label>
                    <Select value={student.bloodGroup || "Unknown"} onValueChange={(v) => updateStudent({ bloodGroup: v === "Unknown" ? "" : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone</Label>
                    <Input value={student.phone ?? ""} onChange={(e) => updateStudent({ phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={student.email ?? ""} onChange={(e) => updateStudent({ email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Photo URL</Label>
                  <Input value={student.photoUrl ?? ""} onChange={(e) => updateStudent({ photoUrl: e.target.value })} placeholder="Link to student photo" />
                </div>
                <div>
                  <Label>Student Status</Label>
                  <Select value={(student.status as StudentStatus) || "active"} onValueChange={(v) => updateStudent({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STUDENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{getStudentStatusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-0 space-y-4">
                {!enrollment.enrollmentId ? (
                  <p className="text-xs text-amber-700 rounded-md border border-amber-200 bg-amber-50 p-3">
                    No enrollment record found — academic fields show the student profile. Class changes need an enrollment (add via class roster or contact admin).
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground rounded-md border bg-muted/40 p-3">
                  Class placement is stored on the enrollment record (not duplicated on the student). Use Transfer to change class; history is kept per academic year.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Academic Year</Label>
                    <Input value={enrollment.academicYear} readOnly className="bg-muted/50" />
                  </div>
                  <div>
                    <Label>Class</Label>
                    <Input value={enrollment.className || enrollment.grade} readOnly className="bg-muted/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Section</Label>
                    <Input value={enrollment.section} readOnly className="bg-muted/50" />
                  </div>
                  <div>
                    <Label>Class Roll Number *</Label>
                    <Input type="number" min={1} value={student.rollNumber ?? ""} onChange={(e) => updateStudent({ rollNumber: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>House / Group</Label>
                    <Input value={extended.house} onChange={(e) => setExtended({ ...extended, house: e.target.value })} placeholder="e.g. Blue" />
                  </div>
                  <div>
                    <Label>Admission Date</Label>
                    <Input type="date" value={student.admissionDate ?? ""} onChange={(e) => updateStudent({ admissionDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Previous School</Label>
                    <Input value={extended.previousSchool} onChange={(e) => setExtended({ ...extended, previousSchool: e.target.value })} />
                  </div>
                  <div>
                    <Label>Student Category</Label>
                    <Select
                      value={extended.studentCategory || "none"}
                      onValueChange={(v) => setExtended({ ...extended, studentCategory: v === "none" ? "" : v as StudentExtendedProfile["studentCategory"] })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="new_admission">New Admission</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="scholarship">Scholarship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parents" className="mt-0 space-y-4">
                <p className="text-sm font-medium">Father</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={extended.father.name} onChange={(e) => setExtended({ ...extended, father: { ...extended.father, name: e.target.value } })} /></div>
                  <div><Label>Phone</Label><Input value={extended.father.phone} onChange={(e) => setExtended({ ...extended, father: { ...extended.father, phone: e.target.value } })} /></div>
                  <div><Label>Email</Label><Input value={extended.father.email} onChange={(e) => setExtended({ ...extended, father: { ...extended.father, email: e.target.value } })} /></div>
                  <div><Label>Occupation</Label><Input value={extended.father.occupation} onChange={(e) => setExtended({ ...extended, father: { ...extended.father, occupation: e.target.value } })} /></div>
                </div>
                <p className="text-sm font-medium pt-2">Mother</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={extended.mother.name} onChange={(e) => setExtended({ ...extended, mother: { ...extended.mother, name: e.target.value } })} /></div>
                  <div><Label>Phone</Label><Input value={extended.mother.phone} onChange={(e) => setExtended({ ...extended, mother: { ...extended.mother, phone: e.target.value } })} /></div>
                  <div><Label>Email</Label><Input value={extended.mother.email} onChange={(e) => setExtended({ ...extended, mother: { ...extended.mother, email: e.target.value } })} /></div>
                  <div><Label>Occupation</Label><Input value={extended.mother.occupation} onChange={(e) => setExtended({ ...extended, mother: { ...extended.mother, occupation: e.target.value } })} /></div>
                </div>
                <p className="text-sm font-medium pt-2 border-t">Primary Guardian *</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={student.parentGuardian?.name ?? ""}
                      onChange={(e) => updateStudent({ parentGuardian: { ...student.parentGuardian!, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Relationship *</Label>
                    <Select
                      value={student.parentGuardian?.relationship ?? "guardian"}
                      onValueChange={(v) => updateStudent({ parentGuardian: { ...student.parentGuardian!, relationship: v as Student["parentGuardian"]["relationship"] } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={student.parentGuardian?.phone ?? ""}
                      onChange={(e) => updateStudent({ parentGuardian: { ...student.parentGuardian!, phone: e.target.value } })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={student.parentGuardian?.email ?? ""}
                      onChange={(e) => updateStudent({ parentGuardian: { ...student.parentGuardian!, email: e.target.value } })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Occupation</Label>
                    <Input
                      value={student.parentGuardian?.occupation ?? ""}
                      onChange={(e) => updateStudent({ parentGuardian: { ...student.parentGuardian!, occupation: e.target.value } })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-3">
                <div><Label>Address Line 1</Label><Input value={student.address?.street ?? ""} onChange={(e) => updateStudent({ address: { ...student.address, street: e.target.value } })} /></div>
                <div><Label>Address Line 2</Label><Input value={extended.addressLine2} onChange={(e) => setExtended({ ...extended, addressLine2: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input value={student.address?.city ?? ""} onChange={(e) => updateStudent({ address: { ...student.address, city: e.target.value } })} /></div>
                  <div><Label>State</Label><Input value={student.address?.state ?? ""} onChange={(e) => updateStudent({ address: { ...student.address, state: e.target.value } })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Country</Label><Input value={student.address?.country ?? ""} onChange={(e) => updateStudent({ address: { ...student.address, country: e.target.value } })} /></div>
                  <div><Label>Pincode</Label><Input value={student.address?.zipCode ?? ""} onChange={(e) => updateStudent({ address: { ...student.address, zipCode: e.target.value } })} /></div>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="mt-0 space-y-3">
                <div><Label>Allergies</Label><Input value={extended.allergies} onChange={(e) => setExtended({ ...extended, allergies: e.target.value })} /></div>
                <div><Label>Medical Conditions</Label><Textarea value={student.medicalConditions ?? ""} onChange={(e) => updateStudent({ medicalConditions: e.target.value })} rows={2} /></div>
                <div><Label>Doctor Name</Label><Input value={extended.doctorName} onChange={(e) => setExtended({ ...extended, doctorName: e.target.value })} /></div>
                <div><Label>Emergency Notes</Label><Textarea value={extended.emergencyNotes} onChange={(e) => setExtended({ ...extended, emergencyNotes: e.target.value })} rows={2} /></div>
              </TabsContent>

              <TabsContent value="transport" className="mt-0 space-y-3">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <Label>Transport required</Label>
                  <Switch checked={extended.transport.required} onCheckedChange={(c) => setExtended({ ...extended, transport: { ...extended.transport, required: c } })} />
                </div>
                {extended.transport.required ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Route</Label><Input value={extended.transport.route} onChange={(e) => setExtended({ ...extended, transport: { ...extended.transport, route: e.target.value } })} /></div>
                    <div><Label>Pickup Point</Label><Input value={extended.transport.pickupPoint} onChange={(e) => setExtended({ ...extended, transport: { ...extended.transport, pickupPoint: e.target.value } })} /></div>
                    <div><Label>Vehicle</Label><Input value={extended.transport.vehicle} onChange={(e) => setExtended({ ...extended, transport: { ...extended.transport, vehicle: e.target.value } })} /></div>
                    <div><Label>Driver</Label><Input value={extended.transport.driver} onChange={(e) => setExtended({ ...extended, transport: { ...extended.transport, driver: e.target.value } })} /></div>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="fee" className="mt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Fee Plan</Label><Input value={extended.fee.plan} onChange={(e) => setExtended({ ...extended, fee: { ...extended.fee, plan: e.target.value } })} /></div>
                  <div><Label>Scholarship</Label><Input value={extended.fee.scholarship} onChange={(e) => setExtended({ ...extended, fee: { ...extended.fee, scholarship: e.target.value } })} /></div>
                  <div><Label>Discount %</Label><Input type="number" min={0} max={100} value={extended.fee.discountPercent} onChange={(e) => setExtended({ ...extended, fee: { ...extended.fee, discountPercent: Number(e.target.value) || 0 } })} /></div>
                  <div><Label>Fee Category</Label><Input value={extended.fee.category} onChange={(e) => setExtended({ ...extended, fee: { ...extended.fee, category: e.target.value } })} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Fee billing integration can be connected later.</p>
                <div className="border-t pt-3 space-y-3">
                  <p className="text-sm font-medium">App login (optional)</p>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <Label>Parent login</Label>
                    <Switch checked={extended.login.parentLoginEnabled} onCheckedChange={(c) => setExtended({ ...extended, login: { ...extended.login, parentLoginEnabled: c } })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <Label>Student login</Label>
                    <Switch checked={extended.login.studentLoginEnabled} onCheckedChange={(c) => setExtended({ ...extended, login: { ...extended.login, studentLoginEnabled: c } })} />
                  </div>
                  <div><Label>Username</Label><Input value={extended.login.username} onChange={(e) => setExtended({ ...extended, login: { ...extended.login, username: e.target.value } })} /></div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-3">
                <p className="text-sm text-muted-foreground">Document uploads will be linked here. Required types for your school:</p>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  {DOCUMENT_TYPES.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <p className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30">
                  Upload workflow: use Documents module when enabled, or attach files in a future release.
                </p>
              </TabsContent>
      </div>
    </Tabs>
  );

  const footer = (
    <div className="flex justify-end gap-2">
      {variant === "dialog" ? (
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
      ) : null}
      <Button onClick={handleSave} disabled={saving || loading || !student}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );

  if (variant === "panel") {
    if (!open) return null;
    return (
      <Card className="shadow-lg border-border/50 h-full flex flex-col min-h-[calc(100vh-10rem)]">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="font-display">Edit student</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden pt-0">{formBody}</CardContent>
        <CardFooter className="border-t pt-4 shrink-0">{footer}</CardFooter>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Edit student</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 flex-1 min-h-0 overflow-hidden">{formBody}</div>
        <DialogFooter className="px-6 py-4 border-t">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Inline right-panel edit (admin students page). */
export function StudentEditPanel(props: Omit<StudentEditDialogProps, "variant">) {
  return <StudentEditDialog {...props} variant="panel" />;
}
