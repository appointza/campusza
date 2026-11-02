import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { termService } from "@/services/term.service";
import { schoolCalendarService } from "@/services/school-calendar.service";
import type { Term } from "@/models/term.model";
import type { SchoolCalendarPage } from "@/models/school-calendar.model";
import {
  WEEKDAY_LABELS,
  schoolCalendarDayTypeLabel,
} from "@/models/school-calendar.model";
import { computeTermCalendarSummary, resolveSchoolCalendarDay } from "@/utils/school-calendar-resolve";
import { TermCalendarGrid } from "@/pages/admin/school-calendar/TermCalendarGrid";
import { describeApiError } from "@/utils/api-error";
import { formatDisplayDate, isDateInRange, localDateYmd } from "@/utils/date";

const AdminSchoolCalendar = () => {
  const { toast } = useToast();
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState("");
  const [page, setPage] = useState<SchoolCalendarPage | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayType, setDayType] = useState<"closed" | "half_day" | "open">("closed");
  const [dayReason, setDayReason] = useState("");
  const [weeklyWeekday, setWeeklyWeekday] = useState("0");
  const [weeklyType, setWeeklyType] = useState<"closed" | "half_day">("closed");
  const [weeklyReason, setWeeklyReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    termService
      .getAll()
      .then((items) => {
        const active = items.filter((t) => t.isActive);
        setTerms(active);
        const preferred =
          active.find((t) => t.status === "active") ?? active[0];
        if (preferred) setTermId(preferred.id);
      })
      .catch(() => toast({ title: "Failed to load terms", variant: "destructive" }));
  }, [toast]);

  const loadPage = useCallback(
    async (id: string) => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await schoolCalendarService.getPage(id);
        setPage(data);
      } catch (error) {
        toast({
          title: "Failed to load calendar",
          description: describeApiError(error),
          variant: "destructive",
        });
        setPage(null);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (termId) loadPage(termId);
  }, [termId, loadPage]);

  const term = page?.term;
  const termStart = term?.startDate?.slice(0, 10) ?? "";
  const termEnd = term?.endDate?.slice(0, 10) ?? "";

  const termSummary = useMemo(() => {
    if (!page) return null;
    return computeTermCalendarSummary(page.term, page.weeklyRules, page.dayOverrides);
  }, [page]);

  const selectedYmd = selectedDate ? localDateYmd(selectedDate) : "";
  const selectedResolved = useMemo(() => {
    if (!selectedYmd || !page) return null;
    return resolveSchoolCalendarDay(
      selectedYmd,
      page.term,
      page.weeklyRules,
      page.dayOverrides
    );
  }, [selectedYmd, page]);

  const existingOverride = useMemo(() => {
    if (!selectedYmd || !page) return undefined;
    return page.dayOverrides.find((o) => o.calendarDate.slice(0, 10) === selectedYmd);
  }, [selectedYmd, page]);

  const openDayDialog = (date: Date) => {
    const ymd = localDateYmd(date);
    if (!term || !isDateInRange(ymd, termStart, termEnd)) return;
    setSelectedDate(date);
    const ov = page?.dayOverrides.find((o) => o.calendarDate.slice(0, 10) === ymd);
    const resolved = resolveSchoolCalendarDay(
      ymd,
      page?.term,
      page?.weeklyRules ?? [],
      page?.dayOverrides ?? []
    );
    if (ov) {
      setDayType(ov.dayType);
      setDayReason(ov.reason);
    } else if (resolved.type === "half_day") {
      setDayType("half_day");
      setDayReason(resolved.reason ?? "");
    } else if (resolved.type === "closed") {
      setDayType("closed");
      setDayReason(resolved.reason ?? "");
    } else {
      setDayType("closed");
      setDayReason("");
    }
    setDayDialogOpen(true);
  };

  const handleSaveDay = async () => {
    if (!page || !selectedYmd) return;
    setSaving(true);
    try {
      const data = await schoolCalendarService.saveDayOverride({
        id: existingOverride?.id,
        termId: page.term.id,
        calendarDate: selectedYmd,
        dayType,
        reason: dayReason.trim(),
      });
      setPage(data);
      setDayDialogOpen(false);
      toast({ title: "Day updated" });
    } catch (error) {
      toast({
        title: "Save failed",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearDayOverride = async () => {
    if (!page || !existingOverride) return;
    setSaving(true);
    try {
      const data = await schoolCalendarService.deleteDayOverride(
        existingOverride.id,
        page.term.id
      );
      setPage(data);
      setDayDialogOpen(false);
      toast({ title: "Date reset to weekly pattern" });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWeekly = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const weekday = Number(weeklyWeekday);
      const existing = page.weeklyRules.find((r) => r.weekday === weekday);
      const data = await schoolCalendarService.saveWeeklyRule({
        id: existing?.id,
        termId: page.term.id,
        weekday,
        dayType: weeklyType,
        reason: weeklyReason.trim(),
      });
      setPage(data);
      setWeeklyReason("");
      toast({ title: "Weekly pattern saved", description: `Applies to every ${WEEKDAY_LABELS[weekday]} in this term.` });
    } catch (error) {
      toast({
        title: "Save failed",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWeekly = async (id: string) => {
    if (!page) return;
    setSaving(true);
    try {
      const data = await schoolCalendarService.deleteWeeklyRule(id, page.term.id);
      setPage(data);
      toast({ title: "Weekly pattern removed" });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-8 h-8 text-primary" />
              School calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              Mark holidays, half days, and weekly off days for the full term
            </p>
          </div>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.academicYear})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {term && termSummary ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{term.name}</CardTitle>
              <CardDescription>
                {formatDisplayDate(termStart)} — {formatDisplayDate(termEnd)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg border bg-green-50/80 border-green-200 px-3 py-2">
                  <div className="text-2xl font-bold text-green-800">{termSummary.workingDays}</div>
                  <div className="text-xs text-green-900/80">Working days</div>
                </div>
                <div className="rounded-lg border bg-red-50/80 border-red-200 px-3 py-2">
                  <div className="text-2xl font-bold text-red-800">{termSummary.leaveDays}</div>
                  <div className="text-xs text-red-900/80">Leave / closed</div>
                </div>
                <div className="rounded-lg border bg-amber-50/80 border-amber-200 px-3 py-2">
                  <div className="text-2xl font-bold text-amber-900">{termSummary.halfDays}</div>
                  <div className="text-xs text-amber-950/80">Half days</div>
                </div>
                <div className="rounded-lg border bg-muted/50 px-3 py-2">
                  <div className="text-2xl font-bold text-foreground">{termSummary.totalDays}</div>
                  <div className="text-xs text-muted-foreground">Days in term</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {termSummary.workingDays} working · {termSummary.leaveDays} leave ·{" "}
                {termSummary.halfDays} half day — across {termSummary.totalDays} days
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full term calendar</CardTitle>
              <CardDescription>
                All months from term start to end — click a day to edit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !page ? (
                <p className="text-muted-foreground">Loading calendar…</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      Working
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      Leave / closed
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
                      Half day
                    </Badge>
                  </div>
                  <TermCalendarGrid
                    page={page}
                    termStart={termStart}
                    termEnd={termEnd}
                    selectedYmd={selectedYmd}
                    onDayClick={openDayDialog}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Weekly pattern</CardTitle>
                <CardDescription>
                  e.g. every Sunday closed for the whole term
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Weekday</Label>
                  <Select value={weeklyWeekday} onValueChange={setWeeklyWeekday}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAY_LABELS.map((label, idx) => (
                        <SelectItem key={label} value={String(idx)}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={weeklyType}
                    onValueChange={(v) => setWeeklyType(v as "closed" | "half_day")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed">Leave / closed</SelectItem>
                      <SelectItem value="half_day">Half day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    value={weeklyReason}
                    onChange={(e) => setWeeklyReason(e.target.value)}
                    placeholder="e.g. Weekly holiday"
                    rows={2}
                  />
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={saving || !page}
                  onClick={() => void handleSaveWeekly()}
                >
                  Save weekly rule
                </Button>
                {page?.weeklyRules.length ? (
                  <ul className="space-y-2 pt-2 border-t">
                    {page.weeklyRules.map((rule) => (
                      <li
                        key={rule.id}
                        className="flex items-start justify-between gap-2 text-sm rounded-lg border p-2"
                      >
                        <div>
                          <span className="font-medium">{WEEKDAY_LABELS[rule.weekday]}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {rule.dayType === "half_day" ? "Half day" : "Closed"}
                          </span>
                          {rule.reason ? (
                            <p className="text-muted-foreground text-xs mt-0.5">{rule.reason}</p>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive"
                          disabled={saving}
                          onClick={() => void handleDeleteWeekly(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No weekly rules yet.</p>
                )}
              </CardContent>
            </Card>

            {selectedYmd && selectedResolved ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Selected day</CardTitle>
                  <CardDescription>{formatDisplayDate(selectedYmd)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    Status:{" "}
                    <span className="font-medium">
                      {schoolCalendarDayTypeLabel(selectedResolved.type)}
                    </span>
                  </p>
                  {selectedResolved.reason ? (
                    <p className="text-muted-foreground">{selectedResolved.reason}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedYmd ? formatDisplayDate(selectedYmd) : "Day"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label>Day type</Label>
                <Select value={dayType} onValueChange={(v) => setDayType(v as typeof dayType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed">Leave / closed</SelectItem>
                    <SelectItem value="half_day">Half day</SelectItem>
                    <SelectItem value="open">School open</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={dayReason}
                  onChange={(e) => setDayReason(e.target.value)}
                  placeholder="Reason for schedule change"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {existingOverride ? (
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => void handleClearDayOverride()}
                >
                  Remove date override
                </Button>
              ) : null}
              <Button variant="hero" disabled={saving} onClick={() => void handleSaveDay()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminSchoolCalendar;
