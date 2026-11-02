import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff.service";
import { staffScheduleService } from "@/services/staff-schedule.service";
import { classService } from "@/services/class.service";
import { termService } from "@/services/term.service";
import { referenceValueService } from "@/services/reference-value.service";
import { ReferenceValueCategory } from "@/models/referencevalue.model";
import { studentService } from "@/services/student.service";
import { studentGradeService } from "@/services/student-grade.service";
import type { Class } from "@/models/class.model";
import type { Term } from "@/models/term.model";
import type { ReferenceValue } from "@/models/referencevalue.model";

type GradeRow = {
  id: string;
  studentId: string;
  name: string;
  /** Scores keyed by assessment component code (e.g. QUIZ1, EXTRA). */
  scores: Record<string, number | null>;
};

type AssessmentComponentConfig = {
  key: string;
  label: string;
  weight: number;
  refId?: string;
};

/** Shown until the first save to reference values (no assessment_component rows yet). */
const DEFAULT_COMPONENT_TEMPLATE: AssessmentComponentConfig[] = [
  { key: "QUIZ1", label: "Quiz 1", weight: 10 },
  { key: "QUIZ2", label: "Quiz 2", weight: 10 },
  { key: "MIDTERM", label: "Midterm", weight: 25 },
  { key: "ASSIGNMENT", label: "Assignment", weight: 15 },
  { key: "FINAL", label: "Final", weight: 25 },
  { key: "EXTRA", label: "Extra", weight: 15 },
];

function mapRefsToComponents(componentRefs: ReferenceValue[]): AssessmentComponentConfig[] {
  return componentRefs
    .filter((r) => r.code?.trim())
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((r) => ({
      key: r.code!.trim().toUpperCase(),
      label: r.name || r.code || "Column",
      weight: parseFloat(r.value || "") || 0,
      refId: r.id,
    }));
}

function nextComponentCode(existing: AssessmentComponentConfig[]): string {
  const used = new Set(existing.map((c) => c.key.toUpperCase()));
  let i = existing.length + 1;
  let code = `SUBJ_${i}`;
  while (used.has(code)) {
    i += 1;
    code = `SUBJ_${i}`;
  }
  return code;
}

const StaffGrades = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classOptions, setClassOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [assessments, setAssessments] = useState<Array<{ id: string; name: string; code?: string }>>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [newAssessmentCode, setNewAssessmentCode] = useState("");
  const [components, setComponents] =
    useState<AssessmentComponentConfig[]>(DEFAULT_COMPONENT_TEMPLATE);
  const [isEditComponentsOpen, setIsEditComponentsOpen] = useState(false);
  const [editComponents, setEditComponents] = useState<AssessmentComponentConfig[]>([]);
  const editSnapshotRef = useRef<{ refIds: string[] }>({ refIds: [] });

  // Load classes assigned to this staff and assessment periods (terms)
  useEffect(() => {
    const loadData = async () => {
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

        // Prefer staffId from login (business staff code, e.g. STF-...); fallback to userId
        const rawId =
          user?.staffId ?? user?.staff_id ?? user?.userId ?? user?.userid ?? user?.user_id;
        let staffId =
          rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";

        // Fallback: resolve staff by email if not present in login payload
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

        // Get schedules for this staff member to know which classes they teach
        const schedules = await staffScheduleService.getByStaff(staffId);
        const classIds = [...new Set(schedules.map((s) => s.classId).filter(Boolean))];

        // Also include classes where this staff is class teacher
        const teacherClasses = await classService.getByTeacher(staffId);
        const classesById: Record<string, Class> = {};
        teacherClasses.forEach((cls) => {
          if (cls.id) classesById[cls.id] = cls;
        });
        for (const classId of classIds) {
          if (!classId || classesById[classId]) continue;
          try {
            const cls = await classService.getById(classId);
            if (cls?.id) classesById[cls.id] = cls;
          } catch {
            // ignore individual failures
          }
        }

        const assignedClasses = Object.values(classesById);
        setClasses(assignedClasses);
        setClassOptions(assignedClasses.map((c) => ({ id: c.id, name: c.name })));
        if (assignedClasses.length > 0 && !selectedClassId) {
          setSelectedClassId(assignedClasses[0].id);
        }

        // Load assessment periods from terms
        const allTerms = await termService.getAll();
        setTerms(allTerms);
        if (allTerms.length > 0 && !selectedTermId) {
          setSelectedTermId(allTerms[0].id);
        }

        // Load assessments from reference values (category: assessment)
        const assessmentRefs = await referenceValueService.getByCategory(ReferenceValueCategory.ASSESSMENT);
        setAssessments(
          assessmentRefs.map((r) => ({ id: r.id, name: r.name, code: r.code }))
        );
        if (assessmentRefs.length > 0 && !selectedAssessmentId) {
          setSelectedAssessmentId(assessmentRefs[0].id);
        }

        const componentRefs = await referenceValueService.getByCategory(
          ReferenceValueCategory.ASSESSMENT_COMPONENT
        );
        const mapped = mapRefsToComponents(componentRefs);
        if (mapped.length > 0) {
          setComponents(mapped);
        }
      } catch (error) {
        console.error("Failed to load grades context:", error);
        toast({
          title: "Error",
          description: "Failed to load classes or assessment periods.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Load real students for the selected class and initialize grade rows
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId || !selectedTermId || !selectedAssessmentId) {
        setGrades([]);
        return;
      }
      try {
        const students = await studentService.getByClass(selectedClassId);
        const orgId = staffService.getOrganizationId();
        
        // Fetch saved grades from database
        let savedGradesMap: Record<string, any> = {};
        if (orgId) {
          try {
            const savedGrades = await studentGradeService.select({
              organizationid: orgId,
              classid: selectedClassId,
              termid: selectedTermId,
              assessmentrefid: selectedAssessmentId,
            });
            // Create a map by student_id for easy lookup
            savedGradesMap = Object.fromEntries(
              savedGrades.map(g => [g.studentid, g])
            );
          } catch (e) {
            console.error("Failed to load saved grades:", e);
          }
        }

        const emptyScores = (): Record<string, number | null> =>
          Object.fromEntries(components.map((c) => [c.key, null]));

        const rows: GradeRow[] = students.map((s) => {
          const base: GradeRow = {
            id: s.id,
            studentId: s.studentId,
            name: s.fullName || `${s.firstName} ${s.lastName}`.trim() || s.studentId || "Student",
            scores: emptyScores(),
          };
          const saved = savedGradesMap[s.id];
          if (saved && saved.componentsjson) {
            try {
              const arr = JSON.parse(saved.componentsjson) as Array<{ key?: string; score?: number | null }>;
              const next = { ...base.scores };
              for (const c of components) {
                const hit = arr.find((x) => x.key === c.key);
                next[c.key] = hit?.score ?? null;
              }
              return { ...base, scores: next };
            } catch {
              return base;
            }
          }
          return base;
        });
        setGrades(rows);
      } catch (error) {
        console.error("Failed to load students for grades:", error);
        setGrades([]);
        toast({
          title: "Error",
          description: "Failed to load students for this class.",
          variant: "destructive",
        });
      }
    };

    loadStudents();
  }, [selectedClassId, selectedTermId, selectedAssessmentId, components, toast]);

  const handleGradeChange = (studentId: string, componentKey: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    const score =
      numValue !== null && Number.isFinite(numValue) ? numValue : null;
    setGrades((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, scores: { ...student.scores, [componentKey]: score } }
          : student
      )
    );
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedTermId || !selectedAssessmentId) {
      toast({
        title: "Error",
        description: "Please select Class, Term, and Assessment before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orgId = staffService.getOrganizationId();
      if (!orgId) {
        toast({
          title: "Error",
          description: "Organization ID not found.",
          variant: "destructive",
        });
        return;
      }

      // Calculate letter grade based on percentage
      const calculateLetterGrade = (percentage: number): string => {
        if (percentage >= 90) return "A";
        if (percentage >= 80) return "B";
        if (percentage >= 70) return "C";
        if (percentage >= 60) return "D";
        return "F";
      };

      // Build payload for all students
      const payload = grades.map(student => {
        // Build components JSON with scores
        const componentScores = components.map((comp) => ({
          key: comp.key,
          label: comp.label,
          weight: comp.weight,
          score: student.scores[comp.key] ?? null,
        }));

        // Calculate weighted score based on components
        const used = componentScores.filter(c => c.score !== null && c.weight > 0);
        let finalWeightedScore = 0;
        let finalPercentage = 0;

        if (used.length > 0) {
          const totalWeight = used.reduce((sum, c) => sum + c.weight, 0);
          if (totalWeight > 0) {
            const weightedSum = used.reduce((sum, c) => sum + (c.score! * c.weight), 0);
            finalWeightedScore = weightedSum / totalWeight;
            finalPercentage = (finalWeightedScore / 100) * 100;
          }
        }

        return {
          classid: selectedClassId,
          termid: selectedTermId,
          assessmentrefid: selectedAssessmentId,
          studentid: student.id,
          componentsjson: JSON.stringify(componentScores),
          finalweightedscore: finalWeightedScore,
          finalpercentage: finalPercentage,
          lettergrade: calculateLetterGrade(finalPercentage),
          organizationid: orgId,
        };
      });

      // Save to backend
      const success = await studentGradeService.saveMany(payload);
      if (success) {
        toast({
          title: "Success",
          description: "All grade changes have been saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save grades. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving grades.",
        variant: "destructive",
      });
    }
  };

  const calculateAverage = (student: GradeRow) => {
    const parts = components.map((c) => ({
      score: student.scores[c.key] ?? null,
      weight: c.weight ?? 0,
    }));

    const used = parts.filter((p) => p.score !== null && p.weight > 0) as { score: number; weight: number }[];
    if (used.length === 0) return "-";
    const totalWeight = used.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return "-";
    const weightedSum = used.reduce((sum, p) => sum + p.score * p.weight, 0);
    const avg = weightedSum / totalWeight;
    return avg.toFixed(1);
  };

  const getLetterGrade = (avg: string) => {
    if (avg === "-") return "-";
    const num = parseFloat(avg);
    if (num >= 90) return "A";
    if (num >= 80) return "B";
    if (num >= 70) return "C";
    if (num >= 60) return "D";
    return "F";
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedClassName = selectedClass?.name || "Selected Class";
  const selectedTerm = terms.find((t) => t.id === selectedTermId);
  const selectedTermLabel = selectedTerm
    ? `${selectedTerm.name}${selectedTerm.academicYear ? ` (${selectedTerm.academicYear})` : ""}`
    : "";

  if (loading) {
    return (
      <DashboardLayout role="staff" userName="Staff Member">
        <div className="space-y-6">
          <p>Loading grades...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="staff" userName="Staff Member">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Grades</h1>
            <p className="text-muted-foreground mt-1">Enter and manage student grades</p>
          </div>
          <div className="flex gap-2">
            <Button variant="hero" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Grades
            </Button>
          </div>
        </div>

        {/* Class / assessment selection */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="space-y-1">
                <Label>Select Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.length === 0 ? (
                      <SelectItem value="no-classes" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assessment Period</Label>
                <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.length === 0 ? (
                      <SelectItem value="no-periods" disabled>
                        No periods available
                      </SelectItem>
                    ) : (
                      terms.map((term) => (
                        <SelectItem key={term.id} value={term.id}>
                          {term.name}
                          {term.academicYear ? ` (${term.academicYear})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assessment</Label>
                <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.length === 0 ? (
                      <SelectItem value="no-assessments" disabled>
                        No assessments — add in Settings → Reference values (Assessment)
                      </SelectItem>
                    ) : (
                      assessments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}{a.code ? ` (${a.code})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-auto flex gap-2">
                <Dialog open={isAddAssessmentOpen} onOpenChange={setIsAddAssessmentOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Assessment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Assessment</DialogTitle>
                      <DialogDescription>
                        Create a new assessment option for this school (stored in reference values).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-1">
                        <Label>Name *</Label>
                        <Input
                          value={newAssessmentName}
                          onChange={(e) => setNewAssessmentName(e.target.value)}
                          placeholder="e.g. Quiz 1, Midterm, Final"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Code</Label>
                        <Input
                          value={newAssessmentCode}
                          onChange={(e) => setNewAssessmentCode(e.target.value.toUpperCase())}
                          placeholder="e.g. QUIZ1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddAssessmentOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        onClick={async () => {
                          if (!newAssessmentName.trim()) {
                            toast({
                              title: "Name required",
                              description: "Please enter an assessment name.",
                              variant: "destructive",
                            });
                            return;
                          }
                          try {
                            const created = await referenceValueService.create({
                              category: ReferenceValueCategory.ASSESSMENT,
                              name: newAssessmentName.trim(),
                              code:
                                newAssessmentCode.trim() ||
                                newAssessmentName.trim().toUpperCase().replace(/\s+/g, "_"),
                              displayOrder: assessments.length + 1,
                              isSystem: false,
                              isDefault: false,
                              status: "active",
                              isActive: true,
                            });
                            // Refresh local list
                            setAssessments((prev) => [
                              ...prev,
                              { id: created.id, name: created.name, code: created.code },
                            ]);
                            setSelectedAssessmentId(created.id);
                            setNewAssessmentName("");
                            setNewAssessmentCode("");
                            setIsAddAssessmentOpen(false);
                            toast({
                              title: "Assessment added",
                              description: "New assessment has been created.",
                            });
                          } catch (error) {
                            console.error("Failed to add assessment", error);
                            toast({
                              title: "Failed to add assessment",
                              description: "Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={isEditComponentsOpen}
                  onOpenChange={(open) => {
                    setIsEditComponentsOpen(open);
                    if (open) {
                      setEditComponents(components.map((c) => ({ ...c })));
                      editSnapshotRef.current = {
                        refIds: components
                          .map((c) => c.refId)
                          .filter((id): id is string => Boolean(id)),
                      };
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Edit Columns
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Grade Columns</DialogTitle>
                      <DialogDescription>
                        Add or remove subjects (columns). Set each weight (%); components you use for averages
                        should usually total 100. New rows get a code you can edit until the first save. Codes
                        cannot be changed after they are saved (existing grades use them as keys).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2 pr-1">
                      {editComponents.map((c, idx) => (
                        <div key={c.refId ?? `new-${idx}`} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                          {c.refId ? (
                            <div className="w-[88px] shrink-0 text-sm font-medium text-muted-foreground truncate" title={c.key}>
                              {c.key}
                            </div>
                          ) : (
                            <Input
                              className="w-[88px] shrink-0 font-mono text-sm"
                              value={c.key}
                              onChange={(e) => {
                                const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                                const next = [...editComponents];
                                next[idx] = { ...next[idx], key: raw };
                                setEditComponents(next);
                              }}
                              placeholder="CODE"
                              maxLength={32}
                            />
                          )}
                          <Input
                            className="flex-1 min-w-[120px]"
                            value={c.label}
                            onChange={(e) => {
                              const next = [...editComponents];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setEditComponents(next);
                            }}
                            placeholder="Column name"
                          />
                          <Input
                            className="w-20 shrink-0"
                            type="number"
                            value={Number.isFinite(c.weight) ? String(c.weight) : ""}
                            onChange={(e) => {
                              const w = parseFloat(e.target.value || "0") || 0;
                              const next = [...editComponents];
                              next[idx] = { ...next[idx], weight: w };
                              setEditComponents(next);
                            }}
                            placeholder="%"
                          />
                          <span className="text-xs text-muted-foreground shrink-0">%</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            disabled={editComponents.length <= 1}
                            onClick={() => {
                              setEditComponents((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            aria-label="Remove column"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setEditComponents((prev) => [
                            ...prev,
                            {
                              key: nextComponentCode(prev),
                              label: "New subject",
                              weight: 0,
                            },
                          ]);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add column
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditComponentsOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        onClick={async () => {
                          try {
                            const normalized = editComponents.map((c) => ({
                              ...c,
                              key: c.key.trim().toUpperCase(),
                              label: (c.label || c.key).trim(),
                            }));
                            if (normalized.some((c) => !c.key)) {
                              toast({
                                title: "Code required",
                                description: "Each column needs a non-empty code.",
                                variant: "destructive",
                              });
                              return;
                            }
                            const keySet = new Set<string>();
                            for (const c of normalized) {
                              if (keySet.has(c.key)) {
                                toast({
                                  title: "Duplicate code",
                                  description: `Code "${c.key}" is used more than once.`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              keySet.add(c.key);
                            }

                            const keptRefIds = new Set(
                              normalized.map((c) => c.refId).filter((id): id is string => Boolean(id))
                            );
                            const toDelete = editSnapshotRef.current.refIds.filter(
                              (id) => !keptRefIds.has(id)
                            );
                            await Promise.all(toDelete.map((id) => referenceValueService.delete(id)));

                            await Promise.all(
                              normalized.map((c, index) => {
                                const payload = {
                                  id: c.refId,
                                  category: ReferenceValueCategory.ASSESSMENT_COMPONENT,
                                  code: c.key,
                                  name: c.label || c.key,
                                  value: String(c.weight || 0),
                                  displayOrder: index + 1,
                                  isSystem: false,
                                  isDefault: false,
                                  status: "active" as const,
                                  isActive: true,
                                };
                                if (c.refId) {
                                  return referenceValueService.update(payload);
                                }
                                return referenceValueService.create(payload);
                              })
                            );
                            const refreshed = await referenceValueService.getByCategory(
                              ReferenceValueCategory.ASSESSMENT_COMPONENT
                            );
                            setComponents(mapRefsToComponents(refreshed));
                            setIsEditComponentsOpen(false);
                            const weightSum = normalized.reduce((s, c) => s + (c.weight || 0), 0);
                            toast({
                              title: "Columns updated",
                              description:
                                Math.abs(weightSum - 100) > 0.01
                                  ? `Saved. Weights total ${weightSum}% (not 100 — averages still use the weights you set).`
                                  : "Grade columns and weights have been saved.",
                            });
                          } catch (error) {
                            console.error("Failed to save column settings", error);
                            toast({
                              title: "Failed to save",
                              description: "Could not update grade columns.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Grades table */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">
              {selectedClassName}
              {selectedTermLabel ? ` - ${selectedTermLabel}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-card z-10">Student</TableHead>
                  {components.map((c) => (
                    <TableHead key={c.key} className="text-center min-w-[100px]">
                      {c.label}
                      <br />
                      <span className="text-xs font-normal">({c.weight ?? 0}%)</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((student) => {
                  const avg = calculateAverage(student);
                  const letterGrade = getLetterGrade(avg);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      {components.map((c) => (
                        <TableCell key={c.key} className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={student.scores[c.key] ?? ""}
                            onChange={(e) => handleGradeChange(student.id, c.key, e.target.value)}
                            className="w-16 text-center mx-auto"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{avg}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          letterGrade === "A" ? "bg-green-100 text-green-700" :
                          letterGrade === "B" ? "bg-blue-100 text-blue-700" :
                          letterGrade === "C" ? "bg-yellow-100 text-yellow-700" :
                          letterGrade === "D" ? "bg-orange-100 text-orange-700" :
                          letterGrade === "F" ? "bg-red-100 text-red-700" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {letterGrade}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grade distribution */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {["A", "B", "C", "D", "F"].map((grade) => {
                const count = grades.filter(s => getLetterGrade(calculateAverage(s)) === grade).length;
                const percentage = (count / grades.length) * 100;
                return (
                  <div key={grade} className="text-center">
                    <div className="h-32 bg-muted rounded-lg relative overflow-hidden">
                      <div 
                        className={`absolute bottom-0 w-full transition-all ${
                          grade === "A" ? "bg-green-500" :
                          grade === "B" ? "bg-blue-500" :
                          grade === "C" ? "bg-yellow-500" :
                          grade === "D" ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ height: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 font-bold text-lg">{grade}</div>
                    <div className="text-sm text-muted-foreground">{count} students</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffGrades;
