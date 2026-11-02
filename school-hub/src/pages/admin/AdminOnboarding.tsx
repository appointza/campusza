import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";
import { referenceValueService } from "@/services/reference-value.service";
import { termService } from "@/services/term.service";
import { pageService, mapReferenceValuesFromPage } from "@/services/page.service";
import { onboardingService } from "@/services/onboarding.service";
import { staffService } from "@/services/staff.service";
import type { Staff } from "@/models/staff.model";
import type { ReferenceValue } from "@/models/referencevalue.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
} from "@/models/referencevalue.model";
import type { Term } from "@/models/term.model";
import {
  ONBOARDING_CATEGORIES,
  categoryHasValues,
  countByCategory,
  getOnboardingStatus,
  onboardingCategoryLabel,
  toReferenceCode,
  type OnboardingCategorySpec,
} from "@/models/onboarding.model";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const STAFF_STEP_CATEGORIES: ReferenceValueCategory[] = [
  ReferenceValueCategory.STAFF_ROLE,
  ReferenceValueCategory.DEPARTMENT,
  ReferenceValueCategory.LEAVE_TYPE,
];

const GROUPS: { title: string; description: string; categories: ReferenceValueCategory[] }[] = [
  {
    title: "Academic structure",
    description: "Years, grades, and sections used everywhere else.",
    categories: [
      ReferenceValueCategory.ACADEMIC_YEAR,
      ReferenceValueCategory.GRADE,
      ReferenceValueCategory.CLASS_SECTION,
    ],
  },
  {
    title: "Teaching setup",
    description: "Subjects, departments, and rooms for staff and timetable.",
    categories: [
      ReferenceValueCategory.SUBJECT,
      ReferenceValueCategory.DEPARTMENT,
    ],
  },
  {
    title: "Grading",
    description: "Exam types and mark-sheet columns for mark entry.",
    categories: [ReferenceValueCategory.ASSESSMENT, ReferenceValueCategory.ASSESSMENT_COMPONENT],
  },
];

const STEP_COUNT = GROUPS.length + 4; // welcome + staff + groups + term + done

function CategoryBlock({
  spec,
  existing,
  busy,
  dismissedSuggestionCodes,
  onAdd,
  onAddSuggested,
  onRemove,
  onDismissSuggestion,
}: {
  spec: OnboardingCategorySpec;
  existing: ReferenceValue[];
  busy: boolean;
  dismissedSuggestionCodes: string[];
  onAdd: (name: string, code: string) => Promise<void>;
  onAddSuggested: (items: { code: string; name: string }[]) => Promise<void>;
  onRemove: (id: string, name: string) => Promise<void>;
  onDismissSuggestion: (code: string) => void;
}) {
  const [name, setName] = useState("");
  const dismissed = new Set(dismissedSuggestionCodes.map((c) => c.toUpperCase()));
  const missingSuggested = spec.suggestions.filter(
    (s) =>
      !dismissed.has(s.code.toUpperCase()) &&
      !existing.some(
        (e) =>
          e.code.toUpperCase() === s.code.toUpperCase() ||
          e.name.toLowerCase() === s.name.toLowerCase()
      )
  );

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onAdd(trimmed, toReferenceCode(trimmed));
    setName("");
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{onboardingCategoryLabel(spec.category)}</h3>
            {spec.required ? (
              <Badge variant="secondary" className="text-[10px]">Required</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Optional</Badge>
            )}
            {existing.length > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : spec.required ? (
              <Circle className="h-4 w-4 text-muted-foreground" />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{spec.why}</p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground shrink-0">{existing.length} value{existing.length === 1 ? "" : "s"}</span>
      </div>

      {existing.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {existing.map((v) => (
            <Badge
              key={v.id}
              variant="outline"
              className="font-normal gap-1 pl-2 pr-1 py-1 max-w-full"
            >
              <span className="truncate">{v.name}</span>
              {!v.isSystem ? (
                <button
                  type="button"
                  disabled={busy}
                  title={`Remove ${v.name}`}
                  onClick={() => void onRemove(v.id, v.name)}
                  className="rounded-full p-0.5 hover:bg-destructive/15 hover:text-destructive shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-2 py-1">None yet — add at least one to continue.</p>
      )}

      <div className="flex gap-2">
        <Input
          placeholder={`Add ${onboardingCategoryLabel(spec.category).toLowerCase()}…`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={busy}
        />
        <Button type="button" variant="hero" size="sm" className="shrink-0" onClick={() => void submit()} disabled={busy || !name.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {missingSuggested.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={busy}
            onClick={() => void onAddSuggested(missingSuggested)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Add suggested
          </Button>
          {missingSuggested.slice(0, 12).map((s) => (
            <span
              key={s.code}
              className="inline-flex items-center text-xs rounded-full border border-dashed overflow-hidden"
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => void onAdd(s.name, s.code)}
                className="px-2 py-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
              >
                + {s.name}
              </button>
              <button
                type="button"
                disabled={busy}
                title={`Hide suggestion ${s.name}`}
                onClick={() => onDismissSuggestion(s.code)}
                className="px-1.5 py-0.5 border-l border-dashed text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const AdminOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refs, setRefs] = useState<ReferenceValue[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [termForm, setTermForm] = useState({
    name: "Term 1",
    startDate: "",
    endDate: "",
    academicYear: "",
    description: "",
  });
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, string[]>>({});
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffForm, setStaffForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "teacher" as Staff["role"],
    department: "",
  });

  const reload = useCallback(async () => {
    const page = await pageService.getAdminOnboardingPage();
    const values = mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[];
    const termList = (Array.isArray(page.terms) ? page.terms : []).map((row) => {
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
    });
    setRefs(values);
    setTerms(termList);
    try {
      const staff = await staffService.getAll();
      setStaffList(staff);
    } catch {
      setStaffList([]);
    }
    return { values, termList, isComplete: Boolean(page.iscomplete) };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { values, termList, isComplete } = await reload();
        const status = getOnboardingStatus(values, termList.length);
        if (isComplete || status.complete) {
          onboardingService.markCompleteLocally();
          navigate("/admin", { replace: true });
        }
      } catch {
        toast({
          title: "Could not load setup data",
          description: "Check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [navigate, reload, toast]);

  const counts = useMemo(() => countByCategory(refs), [refs]);
  const status = useMemo(() => getOnboardingStatus(refs, terms.length), [refs, terms.length]);
  const academicYears = useMemo(
    () => getReferenceValuesByCategory(refs, ReferenceValueCategory.ACADEMIC_YEAR),
    [refs]
  );
  const departmentOptions = useMemo(
    () => getReferenceValuesByCategory(refs, ReferenceValueCategory.DEPARTMENT),
    [refs]
  );

  const progress = Math.round(((step + 1) / STEP_COUNT) * 100);

  const addValue = async (spec: OnboardingCategorySpec, name: string, code: string) => {
    const exists = getReferenceValuesByCategory(refs, spec.category).some(
      (e) => e.code.toUpperCase() === code.toUpperCase() || e.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      toast({ title: "Already added", description: `${name} is already in this list.` });
      return;
    }
    setBusy(true);
    try {
      const created = await referenceValueService.create({
        category: spec.category,
        name,
        code: code || toReferenceCode(name),
        displayOrder: (counts[spec.category] ?? 0) + 1,
        isSystem: false,
        isDefault: false,
        status: "active",
        isActive: true,
      });
      setRefs((prev) => [...prev, created]);
    } catch {
      toast({
        title: "Could not add value",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const removeValue = async (id: string, name: string) => {
    const item = refs.find((r) => r.id === id);
    if (item?.isSystem) {
      toast({
        title: "Cannot remove",
        description: "System values cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      await referenceValueService.delete(id);
      setRefs((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Removed", description: `${name} was removed from this list.` });
    } catch {
      toast({
        title: "Could not remove",
        description: "This value may be in use elsewhere.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const dismissSuggestion = (category: ReferenceValueCategory, code: string) => {
    setDismissedSuggestions((prev) => {
      const key = category;
      const codes = prev[key] ?? [];
      if (codes.some((c) => c.toUpperCase() === code.toUpperCase())) return prev;
      return { ...prev, [key]: [...codes, code] };
    });
  };

  const addSuggested = async (spec: OnboardingCategorySpec, items: { code: string; name: string }[]) => {
    setBusy(true);
    try {
      let order = counts[spec.category] ?? 0;
      const created: ReferenceValue[] = [];
      for (const item of items) {
        order += 1;
        try {
          const row = await referenceValueService.create({
            category: spec.category,
            name: item.name,
            code: item.code,
            displayOrder: order,
            isSystem: false,
            isDefault: false,
            status: "active",
            isActive: true,
          });
          created.push(row);
        } catch {
          /* skip duplicates */
        }
      }
      if (created.length) setRefs((prev) => [...prev, ...created]);
      toast({
        title: created.length ? "Suggested values added" : "Nothing new to add",
        description: created.length ? `${created.length} item(s) created.` : "They may already exist.",
      });
    } finally {
      setBusy(false);
    }
  };

  const groupReady = (groupIndex: number) => {
    const group = GROUPS[groupIndex];
    return group.categories.every((cat) => {
      const spec = ONBOARDING_CATEGORIES.find((c) => c.category === cat);
      if (!spec?.required) return true;
      return categoryHasValues(counts, cat);
    });
  };

  const staffStepReady = () =>
    [ReferenceValueCategory.STAFF_ROLE, ReferenceValueCategory.DEPARTMENT].every((cat) =>
      categoryHasValues(counts, cat)
    );

  const addStaffMember = async () => {
    if (
      !staffForm.firstName.trim() ||
      !staffForm.lastName.trim() ||
      !staffForm.email.trim() ||
      !staffForm.department
    ) {
      toast({
        title: "Missing fields",
        description: "First name, last name, email, and department are required.",
        variant: "destructive",
      });
      return;
    }
    if (!staffStepReady()) {
      toast({
        title: "Add roles and departments first",
        description: "Use the lists above so each staff member can pick a department.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const created = await staffService.create({
        firstName: staffForm.firstName.trim(),
        lastName: staffForm.lastName.trim(),
        email: staffForm.email.trim(),
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        department: staffForm.department,
        staffId: `STF-${Date.now()}`,
        fullName: `${staffForm.firstName.trim()} ${staffForm.lastName.trim()}`,
        joiningDate: new Date().toISOString(),
        status: "active",
        subjects: [],
      });
      setStaffList((prev) => [created, ...prev]);
      setStaffForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "teacher",
        department: "",
      });
      toast({
        title: "Staff added",
        description: `${created.fullName || created.firstName} can sign in with the email you provided.`,
      });
      if (created.generatedPassword) {
        toast({
          title: "Temporary password",
          description: created.generatedPassword,
        });
      }
    } catch {
      toast({
        title: "Could not add staff",
        description: "Check the email is unique and try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const saveTerm = async () => {
    if (!termForm.name || !termForm.startDate || !termForm.endDate || !termForm.academicYear) {
      toast({
        title: "Missing fields",
        description: "Name, academic year, start date, and end date are required.",
        variant: "destructive",
      });
      return;
    }
    if (new Date(termForm.endDate) < new Date(termForm.startDate)) {
      toast({
        title: "Invalid dates",
        description: "End date must be on or after start date.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const yearName =
        academicYears.find((y) => y.id === termForm.academicYear)?.name || termForm.academicYear;
      const saved = await termService.save({
        name: termForm.name,
        startDate: termForm.startDate,
        endDate: termForm.endDate,
        status: "active",
        academicYear: yearName,
        description: termForm.description,
      });
      setTerms((prev) => [saved, ...prev.filter((t) => t.id !== saved.id)]);
      toast({ title: "Term created", description: `${saved.name} is ready to use.` });
    } catch {
      toast({
        title: "Could not save term",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    const latest = getOnboardingStatus(refs, terms.length);
    if (!latest.complete) {
      toast({
        title: "Setup is incomplete",
        description: "Add the required lists and at least one term first.",
        variant: "destructive",
      });
      return;
    }
    onboardingService.markCompleteLocally();
    navigate("/admin", { replace: true });
  };

  const goNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!staffStepReady()) {
        toast({
          title: "Staff lists missing",
          description: "Add at least one staff role and one department before continuing.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
      return;
    }
    if (step >= 2 && step <= GROUPS.length + 1) {
      if (!groupReady(step - 2)) {
        toast({
          title: "Required lists missing",
          description: "Add at least one value to each required category on this step.",
          variant: "destructive",
        });
        return;
      }
      setStep(step + 1);
      return;
    }
    if (step === GROUPS.length + 2) {
      if (terms.length === 0) {
        toast({
          title: "Create a term",
          description: "The app needs at least one academic term.",
          variant: "destructive",
        });
        return;
      }
      onboardingService.markCompleteLocally();
      setStep(step + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking school setup…
      </div>
    );
  }

  const isStaffStep = step === 1;
  const groupIndex = step >= 2 && step <= GROUPS.length + 1 ? step - 2 : -1;
  const isTermStep = step === GROUPS.length + 2;
  const isDoneStep = step === GROUPS.length + 3;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Campusza" className="h-10 w-10 rounded-xl object-cover shadow" />
          <div>
            <p className="text-sm text-muted-foreground">Campusza</p>
            <h1 className="text-xl font-display font-bold">School setup</h1>
          </div>
        </div>

        <Progress value={progress} className="h-2 mb-6" />

        {step === 0 && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Welcome — let’s set up your school</CardTitle>
              <CardDescription>
                Start with staff, then the lookup lists and first term the rest of Campusza uses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm">
                  {staffList.length > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">Staff team</span>
                    <span className="text-xs text-muted-foreground"> · start here</span>
                    <p className="text-muted-foreground text-xs">
                      Add roles, departments, and your first teachers or admin users.
                    </p>
                  </div>
                </li>
                {ONBOARDING_CATEGORIES.map((c) => {
                  const ok = categoryHasValues(counts, c.category);
                  return (
                    <li key={c.category} className="flex gap-3 text-sm">
                      {ok ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <span className="font-medium">{onboardingCategoryLabel(c.category)}</span>
                        {c.required ? (
                          <span className="text-xs text-muted-foreground"> · required</span>
                        ) : (
                          <span className="text-xs text-muted-foreground"> · optional</span>
                        )}
                        <p className="text-muted-foreground text-xs">{c.why}</p>
                      </div>
                    </li>
                  );
                })}
                <li className="flex gap-3 text-sm">
                  {status.hasTerm ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <span className="font-medium">First academic term</span>
                    <span className="text-xs text-muted-foreground"> · required</span>
                    <p className="text-muted-foreground text-xs">
                      Classes, attendance, fees, and grades attach to a term.
                    </p>
                  </div>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Gender, blood group, attendance status, and similar system lists are already provided.
              </p>
              <Button variant="hero" className="w-full h-11" onClick={goNext}>
                Start setup
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {isStaffStep && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Add staff
              </CardTitle>
              <CardDescription>
                Set up staff roles and departments, then invite your team. You can add more later under Staff.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {STAFF_STEP_CATEGORIES.map((cat) => {
                const spec = ONBOARDING_CATEGORIES.find((c) => c.category === cat)!;
                return (
                  <CategoryBlock
                    key={cat}
                    spec={spec}
                    existing={getReferenceValuesByCategory(refs, cat)}
                    busy={busy}
                    dismissedSuggestionCodes={dismissedSuggestions[cat] ?? []}
                    onAdd={(name, code) => addValue(spec, name, code)}
                    onAddSuggested={(items) => addSuggested(spec, items)}
                    onRemove={removeValue}
                    onDismissSuggestion={(code) => dismissSuggestion(cat, code)}
                  />
                );
              })}

              <div className="rounded-lg border border-border/60 p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">Staff member</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional now — add at least one role and department above to enable this form.
                  </p>
                </div>
                {staffList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {staffList.map((s) => (
                      <Badge key={s.id} variant="secondary" className="font-normal">
                        {s.fullName || `${s.firstName} ${s.lastName}`.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>First name</Label>
                    <Input
                      value={staffForm.firstName}
                      onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                      placeholder="Sarah"
                      disabled={busy || !staffStepReady()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last name</Label>
                    <Input
                      value={staffForm.lastName}
                      onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                      placeholder="Johnson"
                      disabled={busy || !staffStepReady()}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="sarah@school.edu"
                    disabled={busy || !staffStepReady()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={staffForm.role}
                      onValueChange={(v) => setStaffForm({ ...staffForm, role: v as Staff["role"] })}
                      disabled={busy || !staffStepReady()}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="librarian">Librarian</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={staffForm.department}
                      onValueChange={(v) => setStaffForm({ ...staffForm, department: v })}
                      disabled={busy || !staffStepReady()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={busy || !staffStepReady()}
                  onClick={() => void addStaffMember()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add staff member
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="hero" onClick={goNext} disabled={busy}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {groupIndex >= 0 && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="font-display">{GROUPS[groupIndex].title}</CardTitle>
              <CardDescription>{GROUPS[groupIndex].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {GROUPS[groupIndex].categories.map((cat) => {
                const spec = ONBOARDING_CATEGORIES.find((c) => c.category === cat)!;
                return (
                  <CategoryBlock
                    key={cat}
                    spec={spec}
                    existing={getReferenceValuesByCategory(refs, cat)}
                    busy={busy}
                    dismissedSuggestionCodes={dismissedSuggestions[cat] ?? []}
                    onAdd={(name, code) => addValue(spec, name, code)}
                    onAddSuggested={(items) => addSuggested(spec, items)}
                    onRemove={removeValue}
                    onDismissSuggestion={(code) => dismissSuggestion(cat, code)}
                  />
                );
              })}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="hero" onClick={goNext} disabled={busy}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isTermStep && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Create your first term
              </CardTitle>
              <CardDescription>
                Example: Term 1 for the current academic year. You can add more later under Terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {terms.length > 0 ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  {terms.length} term{terms.length === 1 ? "" : "s"} already created
                  {terms[0] ? ` (latest: ${terms[0].name})` : ""}.
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Term name</Label>
                <Input
                  value={termForm.name}
                  onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                  placeholder="Term 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Academic year</Label>
                <Select
                  value={termForm.academicYear}
                  onValueChange={(v) => setTermForm({ ...termForm, academicYear: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={termForm.startDate}
                    onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End date</Label>
                  <Input
                    type="date"
                    value={termForm.endDate}
                    onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  rows={2}
                  value={termForm.description}
                  onChange={(e) => setTermForm({ ...termForm, description: e.target.value })}
                />
              </div>
              <Button variant="hero" className="w-full" onClick={() => void saveTerm()} disabled={busy}>
                <Plus className="h-4 w-4 mr-2" />
                Save term
              </Button>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="hero" onClick={goNext} disabled={busy || terms.length === 0}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isDoneStep && (
          <Card className="shadow-xl border-border/50">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Check className="h-7 w-7 text-green-700" />
              </div>
              <CardTitle className="font-display text-center">You’re ready to use Campusza</CardTitle>
              <CardDescription className="text-center">
                Reference lists and a term are in place. Next, add classes, staff, and students.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="hero" className="w-full h-11" onClick={finish}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Go to dashboard
              </Button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" asChild>
                  <Link to="/admin/staff">Add staff</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/classes">Add classes</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/admin/students">Add students</Link>
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                You can change these lists anytime under Settings → References.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminOnboarding;
