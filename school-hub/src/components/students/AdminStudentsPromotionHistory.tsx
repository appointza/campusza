import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { GraduationCap, RefreshCw, TrendingUp } from "lucide-react";
import type { StudentPromotion } from "@/models/student-promotion.model";
import { studentPromotionService } from "@/services/student-promotion.service";
import { staffService } from "@/services/staff.service";
import {
  ReferenceValueCategory,
  getReferenceValuesByCategory,
  resolveReferenceValueName,
  type ReferenceValue,
} from "@/models/referencevalue.model";

type AdminStudentsPromotionHistoryProps = {
  referenceValues: ReferenceValue[];
  active: boolean;
};

export function AdminStudentsPromotionHistory({
  referenceValues,
  active,
}: AdminStudentsPromotionHistoryProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [promotions, setPromotions] = useState<StudentPromotion[]>([]);

  const academicYearOptions = useMemo(
    () => getReferenceValuesByCategory(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR),
    [referenceValues]
  );

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const orgId = staffService.getOrganizationId();
      const rows = await studentPromotionService.selectPromotions({
        organizationId: orgId,
        academicYear: yearFilter === "all" ? undefined : yearFilter,
      });
      setPromotions(
        [...rows].sort((a, b) =>
          (b.promotionDate || b.createdAt || "").localeCompare(a.promotionDate || a.createdAt || "")
        )
      );
    } catch {
      toast({
        title: "Could not load promotion history",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, yearFilter]);

  useEffect(() => {
    if (active) void loadPromotions();
  }, [active, loadPromotions]);

  const formatYear = (value: string) =>
    resolveReferenceValueName(referenceValues, ReferenceValueCategory.ACADEMIC_YEAR, value) ||
    value ||
    "—";

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="font-display flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Promotion history
          </CardTitle>
          <CardDescription>
            Records from bulk promote on{" "}
            <Link to="/admin/promotion" className="text-primary underline-offset-4 hover:underline">
              Promotion &amp; transfer
            </Link>
            . Open a student profile for full enrollment, transfer, and promotion tabs.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {academicYearOptions.map((y) => (
                <SelectItem key={y.id} value={y.name}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadPromotions()} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link to="/admin/promotion">
              <TrendingUp className="h-4 w-4 mr-1" />
              Promote
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Loading…
                </TableCell>
              </TableRow>
            ) : promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No promotion records yet.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/admin/students/${p.studentId}`}
                      className="text-primary hover:underline underline-offset-4"
                    >
                      {p.studentName || p.studentId}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{p.promotionType}</TableCell>
                  <TableCell>
                    {p.fromClassName || p.fromGrade
                      ? `${p.fromClassName || p.fromGrade}${p.fromGrade && p.fromClassName ? ` (${p.fromGrade})` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {p.toClassName || p.toGrade
                      ? `${p.toClassName || p.toGrade}${p.toGrade && p.toClassName ? ` (${p.toGrade})` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatYear(p.academicYearFrom)} → {formatYear(p.academicYearTo)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {p.promotionDate ? new Date(p.promotionDate).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
