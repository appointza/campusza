import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import type { Class } from "@/models/class.model";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";
import { getTermStatusColor, getTermStatusLabel, type Term } from "@/models/term.model";
import { classService } from "@/services/class.service";
import { termService } from "@/services/term.service";
import {
  academicYearsMatch,
  formatAcademicYearLabel,
  termMatchesAcademicYear,
} from "@/utils/academic-year-match";
import { formatDisplayDate } from "@/utils/date";
import { cn } from "@/lib/utils";
import { BookOpen, CalendarRange, ExternalLink, Layers } from "lucide-react";

type Props = {
  referenceValues: ReferenceValue[];
  referenceValuesLoading?: boolean;
  /** Avoid URL/effect work while another settings tab is selected. */
  active?: boolean;
  selectedYearId?: string;
  onYearChange?: (yearId: string) => void;
};

export function SettingsAcademicYearStructurePanel({
  referenceValues,
  referenceValuesLoading,
  active = true,
  selectedYearId: selectedYearIdProp = "",
  onYearChange,
}: Props) {
  const { toast } = useToast();
  const [selectedYearIdLocal, setSelectedYearIdLocal] = useState(selectedYearIdProp);
  const didApplyDefaultYear = useRef(false);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );

  useEffect(() => {
    if (!active) {
      didApplyDefaultYear.current = false;
      return;
    }
    if (
      selectedYearIdProp &&
      academicYearOptions.some((y) => y.id === selectedYearIdProp)
    ) {
      setSelectedYearIdLocal(selectedYearIdProp);
      return;
    }
  }, [active, selectedYearIdProp, academicYearOptions]);

  const selectedYearId = selectedYearIdLocal;

  const setSelectedYearId = useCallback(
    (yearId: string) => {
      if (!active) return;
      setSelectedYearIdLocal(yearId);
      onYearChange?.(yearId);
    },
    [active, onYearChange]
  );

  useEffect(() => {
    if (!active || referenceValuesLoading || academicYearOptions.length === 0) return;
    if (selectedYearId && academicYearOptions.some((y) => y.id === selectedYearId)) return;
    if (didApplyDefaultYear.current) return;
    const defaultYear =
      academicYearOptions.find((y) => y.isDefault && y.status === "active") ??
      academicYearOptions.find((y) => y.status === "active") ??
      academicYearOptions[0];
    if (defaultYear) {
      didApplyDefaultYear.current = true;
      setSelectedYearId(defaultYear.id);
    }
  }, [
    active,
    academicYearOptions,
    referenceValuesLoading,
    selectedYearId,
    setSelectedYearId,
  ]);

  const loadCatalog = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [termList, classList] = await Promise.all([termService.getAll(), classService.getAll()]);
      setTerms(termList.filter((t) => t.isActive !== false));
      setClasses(classList.filter((c) => c.isActive !== false));
    } catch {
      toast({
        title: "Failed to load structure",
        description: "Could not load terms and classes.",
        variant: "destructive",
      });
      setTerms([]);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [active, toast]);

  useEffect(() => {
    if (!active) return;
    void loadCatalog();
  }, [active, loadCatalog]);

  const yearLabel = formatAcademicYearLabel(selectedYearId, referenceValues);

  const termsForYear = useMemo(() => {
    if (!selectedYearId) return [];
    return terms
      .filter((term) => termMatchesAcademicYear(term, selectedYearId, referenceValues))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [terms, selectedYearId, referenceValues]);

  const classesForYear = useMemo(() => {
    if (!selectedYearId) return [];
    return classes.filter((c) => academicYearsMatch(c.academicYear, selectedYearId, referenceValues));
  }, [classes, selectedYearId, referenceValues]);

  const classesByTermId = useMemo(() => {
    const map = new Map<string, Class[]>();
    for (const cls of classesForYear) {
      const key = cls.termId?.trim() || "__none__";
      const bucket = map.get(key) ?? [];
      bucket.push(cls);
      map.set(key, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [classesForYear]);

  const unassignedClasses = classesByTermId.get("__none__") ?? [];

  const gradeLabel = (gradeRef: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.GRADE, gradeRef) || gradeRef || "—";

  const sectionLabel = (sectionRef: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.CLASS_SECTION, sectionRef) ||
    sectionRef ||
    "—";

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Academic structure
          </CardTitle>
          <CardDescription>
            Pick an academic year to see its terms and the classes linked to each term.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 sm:max-w-sm sm:flex-1">
              <Label htmlFor="structure-year">Academic year</Label>
              <Select
                value={selectedYearId || undefined}
                onValueChange={setSelectedYearId}
                disabled={referenceValuesLoading || academicYearOptions.length === 0}
              >
                <SelectTrigger id="structure-year">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYearOptions.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      Add years under References → Academic year
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
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/settings?tab=references&ref=terms">
                  Manage terms
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/classes">Manage classes</Link>
              </Button>
            </div>
          </div>

          {selectedYearId && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-normal">
                {yearLabel}
              </Badge>
              <span>
                {termsForYear.length} term{termsForYear.length === 1 ? "" : "s"} ·{" "}
                {classesForYear.length} class{classesForYear.length === 1 ? "" : "es"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {referenceValuesLoading || loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : !selectedYearId ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Select an academic year to view terms and classes.
        </p>
      ) : academicYearOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No academic years in References. Add an Academic year lookup first.
        </p>
      ) : (
        <div className="space-y-6">
          {termsForYear.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No terms for {yearLabel}.{" "}
                <Link
                  to="/admin/settings?tab=references&ref=terms"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Add a term
                </Link>{" "}
                and set its academic year to match.
              </CardContent>
            </Card>
          ) : (
            termsForYear.map((term) => {
              const termClasses = classesByTermId.get(term.id) ?? [];
              return (
                <Card key={term.id} className="border-border/60 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-display flex items-center gap-2">
                          <CalendarRange className="h-4 w-4 text-primary" />
                          {term.name}
                        </CardTitle>
                        <CardDescription>
                          {formatDisplayDate(term.startDate)} – {formatDisplayDate(term.endDate)}
                        </CardDescription>
                      </div>
                      <Badge className={cn("shrink-0", getTermStatusColor(term.status))}>
                        {getTermStatusLabel(term.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {termClasses.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-muted-foreground">
                        No classes assigned to this term yet.{" "}
                        <Link to="/admin/classes" className="text-primary underline-offset-4 hover:underline">
                          Create a class
                        </Link>{" "}
                        with this term and {yearLabel}.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Class</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead className="text-right">Students</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {termClasses.map((cls) => (
                            <TableRow key={cls.id}>
                              <TableCell className="font-medium">{cls.name}</TableCell>
                              <TableCell>{gradeLabel(cls.grade)}</TableCell>
                              <TableCell>{sectionLabel(cls.section)}</TableCell>
                              <TableCell>{cls.classTeacherName || "—"}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {cls.currentEnrollment ?? 0}
                                {cls.capacity ? ` / ${cls.capacity}` : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {unassignedClasses.length > 0 && (
            <Card className="border-amber-200/80 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Classes in {yearLabel} without a term
                </CardTitle>
                <CardDescription>
                  Assign a term on each class so they appear under the right term above.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedClasses.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{gradeLabel(cls.grade)}</TableCell>
                        <TableCell>{cls.classTeacherName || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
