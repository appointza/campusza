import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, BellRing, CalendarDays, Megaphone, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NOTICE_AUDIENCE_LABELS,
  type NotificationsReaderAudience,
  type SchoolNoticeAudience,
  type SchoolNotificationsPage,
} from "@/models/school-notice.model";
import { schoolNoticeService } from "@/services/school-notice.service";
import { schoolCalendarDayTypeLabel } from "@/models/school-calendar.model";
import { resolveSchoolCalendarDay } from "@/utils/school-calendar-resolve";
import { formatDisplayDate, localDateYmd, shiftYmd } from "@/utils/date";

const emptyPage = (): SchoolNotificationsPage => ({
  term: null,
  weeklyRules: [],
  dayOverrides: [],
  notices: [],
  canManage: false,
});

const dayTypeBadgeClass: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/20",
  closed: "bg-destructive/10 text-destructive border-destructive/20",
  half_day: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/25",
  outside_term: "bg-muted text-muted-foreground border-border",
};

const dayTypeDotClass: Record<string, string> = {
  open: "bg-emerald-500",
  closed: "bg-destructive",
  half_day: "bg-amber-500",
  outside_term: "bg-muted-foreground",
};

type SchoolNotificationsViewProps = {
  layoutRole: UserRole;
  audience: NotificationsReaderAudience;
  pageTitle?: string;
};

export function SchoolNotificationsView({
  layoutRole,
  audience,
  pageTitle = "Notifications",
}: SchoolNotificationsViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<SchoolNotificationsPage>(emptyPage);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formAudience, setFormAudience] = useState<SchoolNoticeAudience>("all");
  const [formPublishFrom, setFormPublishFrom] = useState("");
  const [formPublishTo, setFormPublishTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await schoolNoticeService.getNotificationsPage(audience);
      setPage(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications.",
        variant: "destructive",
      });
      setPage(emptyPage());
    } finally {
      setLoading(false);
    }
  }, [audience, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const todayYmd = localDateYmd();

  const todayStatus = useMemo(() => {
    return resolveSchoolCalendarDay(
      todayYmd,
      page.term,
      page.weeklyRules,
      page.dayOverrides
    );
  }, [todayYmd, page]);

  const upcomingDays = useMemo(() => {
    const rows: { ymd: string; label: string; reason?: string; type: string }[] = [];
    for (let i = 1; i <= 21; i++) {
      const ymd = shiftYmd(todayYmd, i);
      const resolved = resolveSchoolCalendarDay(
        ymd,
        page.term,
        page.weeklyRules,
        page.dayOverrides
      );
      if (resolved.type === "outside_term") break;
      if (resolved.type === "open") continue;
      rows.push({
        ymd,
        type: resolved.type,
        reason: resolved.reason,
        label: schoolCalendarDayTypeLabel(resolved.type),
      });
    }
    return rows;
  }, [todayYmd, page]);

  const resetForm = () => {
    setFormTitle("");
    setFormBody("");
    setFormAudience("all");
    setFormPublishFrom("");
    setFormPublishTo("");
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSaveNotice = async () => {
    if (!formBody.trim() && !formTitle.trim()) {
      toast({
        title: "Missing message",
        description: "Enter a title or message body.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await schoolNoticeService.saveNotice({
        title: formTitle,
        body: formBody,
        audience: formAudience,
        publishFrom: formPublishFrom || undefined,
        publishTo: formPublishTo || undefined,
      });
      toast({ title: "Published", description: "Notice saved." });
      setDialogOpen(false);
      await load();
    } catch (error) {
      console.error("Save notice failed:", error);
      toast({
        title: "Error",
        description: "Could not save notice.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await schoolNoticeService.deleteNotice(id);
      toast({ title: "Removed", description: "Notice deleted." });
      await load();
    } catch (error) {
      console.error("Delete notice failed:", error);
      toast({
        title: "Error",
        description: "Could not delete notice.",
        variant: "destructive",
      });
    }
  };

  const isStudentPortal = layoutRole === "student";

  const statusBadgeClass = (type: string) =>
    cn(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
      dayTypeBadgeClass[type] ?? dayTypeBadgeClass.outside_term
    );

  const noticeCards = page.notices.map((notice) => (
    <article
      key={notice.id}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow",
        isStudentPortal
          ? "border-l-[3px] border-l-primary pl-5 pr-4 py-4 shadow-sm hover:shadow-md"
          : "p-4 space-y-2"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-2">
          {notice.title ? (
            <h3 className={cn("font-semibold text-foreground", isStudentPortal && "font-display text-base")}>
              {notice.title}
            </h3>
          ) : null}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{notice.body}</p>
        </div>
        {page.canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Delete notice"
            onClick={() => handleDeleteNotice(notice.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
        {page.canManage && (
          <Badge variant="outline" className="font-normal">
            {NOTICE_AUDIENCE_LABELS[notice.audience]}
          </Badge>
        )}
        {notice.createdAt ? (
          <span className="inline-flex items-center gap-1">
            {isStudentPortal ? <Sparkles className="h-3 w-3 text-primary/70" /> : null}
            Posted {formatDisplayDate(notice.createdAt.slice(0, 10))}
          </span>
        ) : null}
      </div>
    </article>
  ));

  return (
    <DashboardLayout role={layoutRole} userName={isStudentPortal ? "Student" : undefined}>
      <div className={cn("space-y-6", isStudentPortal && "max-w-3xl mx-auto w-full")}>
        {isStudentPortal ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.07] via-background to-secondary/[0.06] px-5 py-6 sm:px-8 sm:py-7">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
                  <BellRing className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
                    {pageTitle}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    School calendar updates and messages from your administration
                    {page.term?.name ? (
                      <>
                        {" "}
                        · <span className="text-foreground/80">{page.term.name}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground text-sm">
                School calendar status and official notices
                {page.term?.name ? ` · ${page.term.name}` : ""}
              </p>
            </div>
            {page.canManage && (
              <Button onClick={openCreateDialog}>
                <Megaphone className="mr-2 h-4 w-4" />
                New notice
              </Button>
            )}
          </div>
        )}

        {loading ? (
          isStudentPortal ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )
        ) : (
          <>
            {isStudentPortal ? (
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                    <div className="flex items-center gap-3 border-b sm:border-b-0 sm:border-r border-border/60 bg-muted/30 px-5 py-4 sm:w-[42%]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
                        <p className="font-display text-lg font-semibold text-foreground">
                          {formatDisplayDate(todayYmd)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-3 px-5 py-4">
                      <span className={statusBadgeClass(todayStatus.type)}>
                        {schoolCalendarDayTypeLabel(todayStatus.type)}
                      </span>
                      {todayStatus.reason ? (
                        <p className="text-sm text-muted-foreground">{todayStatus.reason}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Regular school day</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Today — {formatDisplayDate(todayYmd)}
                  </CardTitle>
                  <CardDescription>From the school calendar for the active term</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={dayTypeBadgeClass[todayStatus.type] ?? ""}>
                      {schoolCalendarDayTypeLabel(todayStatus.type)}
                    </Badge>
                    {todayStatus.reason ? (
                      <span className="text-sm text-muted-foreground">{todayStatus.reason}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {upcomingDays.length > 0 &&
              (isStudentPortal ? (
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg">Upcoming holidays & half days</CardTitle>
                    <CardDescription>Next few weeks on the school calendar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="relative space-y-0 pl-1">
                      {upcomingDays.map((row, index) => (
                        <li key={row.ymd} className="relative flex gap-4 pb-6 last:pb-0">
                          {index < upcomingDays.length - 1 ? (
                            <span
                              className="absolute left-[7px] top-3 h-[calc(100%-4px)] w-px bg-border"
                              aria-hidden
                            />
                          ) : null}
                          <span
                            className={cn(
                              "relative z-[1] mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-background",
                              dayTypeDotClass[row.type] ?? dayTypeDotClass.outside_term
                            )}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium text-foreground">{formatDisplayDate(row.ymd)}</p>
                              <span className={statusBadgeClass(row.type)}>{row.label}</span>
                            </div>
                            {row.reason ? (
                              <p className="text-sm text-muted-foreground">{row.reason}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Upcoming closed / half days</CardTitle>
                    <CardDescription>Next three weeks (non-working days only)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingDays.map((row) => (
                      <div
                        key={row.ymd}
                        className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{formatDisplayDate(row.ymd)}</p>
                          {row.reason ? (
                            <p className="text-sm text-muted-foreground">{row.reason}</p>
                          ) : null}
                        </div>
                        <Badge className={dayTypeBadgeClass[row.type] ?? ""}>{row.label}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

            <Card className={cn(isStudentPortal && "border-border/60 shadow-sm")}>
              <CardHeader className={cn("pb-2", isStudentPortal && "pb-3")}>
                <CardTitle
                  className={cn(
                    "flex items-center gap-2 text-lg",
                    isStudentPortal && "font-display"
                  )}
                >
                  <Bell className="h-5 w-5 text-primary" />
                  School notices
                </CardTitle>
                <CardDescription>
                  {isStudentPortal
                    ? "Important updates shared with students"
                    : "Messages from school administration"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.notices.length === 0 ? (
                  isStudentPortal ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Bell className="h-7 w-7 text-primary/80" />
                      </div>
                      <p className="font-display font-medium text-foreground">You&apos;re all caught up</p>
                      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                        New notices from school will show up here.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notices right now.</p>
                  )
                ) : (
                  noticeCards
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notice-title">Title (optional)</Label>
              <Input
                id="notice-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Sports day"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-body">Message</Label>
              <Textarea
                id="notice-body"
                rows={5}
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Write the notice for staff and/or students…"
              />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={formAudience}
                onValueChange={(v) => setFormAudience(v as SchoolNoticeAudience)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="staff">Staff only</SelectItem>
                  <SelectItem value="student">Students only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="publish-from">Show from (optional)</Label>
                <Input
                  id="publish-from"
                  type="date"
                  value={formPublishFrom}
                  onChange={(e) => setFormPublishFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publish-to">Show until (optional)</Label>
                <Input
                  id="publish-to"
                  type="date"
                  value={formPublishTo}
                  onChange={(e) => setFormPublishTo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotice} disabled={saving}>
              {saving ? "Saving…" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default SchoolNotificationsView;
