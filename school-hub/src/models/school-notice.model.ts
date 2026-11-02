export type SchoolNoticeAudience = "all" | "staff" | "student";

export type SchoolNotice = {
  id: string;
  title: string;
  body: string;
  audience: SchoolNoticeAudience;
  publishFrom: string;
  publishTo: string;
  createdAt: string;
};

export type SchoolNotificationsPage = {
  term: import("@/models/term.model").Term | null;
  weeklyRules: import("@/models/school-calendar.model").SchoolCalendarWeeklyRule[];
  dayOverrides: import("@/models/school-calendar.model").SchoolCalendarDayOverride[];
  notices: SchoolNotice[];
  canManage: boolean;
};

export type NotificationsReaderAudience = "staff" | "student" | "admin";

export const NOTICE_AUDIENCE_LABELS: Record<SchoolNoticeAudience, string> = {
  all: "Everyone",
  staff: "Staff only",
  student: "Students only",
};
