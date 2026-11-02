import apiClient, { ActionRes } from "./api.service";
import { staffService } from "./staff.service";
import type {
  NotificationsReaderAudience,
  SchoolNotice,
  SchoolNoticeAudience,
  SchoolNotificationsPage,
} from "@/models/school-notice.model";
import type {
  SchoolCalendarDayOverride,
  SchoolCalendarWeeklyRule,
} from "@/models/school-calendar.model";
import type { Term } from "@/models/term.model";

type StoredUser = {
  organizationId?: string;
  organizationid?: string;
};

class SchoolNoticeService {
  private static instance: SchoolNoticeService;
  private readonly endpoint = "/campusza/schoolnotice";

  static getInstance(): SchoolNoticeService {
    if (!SchoolNoticeService.instance) {
      SchoolNoticeService.instance = new SchoolNoticeService();
    }
    return SchoolNoticeService.instance;
  }

  private getOrganizationId(): string {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) return staffService.getOrganizationId();
    try {
      const u = JSON.parse(raw) as StoredUser;
      return u.organizationId || u.organizationid || staffService.getOrganizationId();
    } catch {
      return staffService.getOrganizationId();
    }
  }

  private mapTerm(data: Record<string, unknown>): Term {
    return {
      id: String(data.id ?? ""),
      name: String(data.name ?? ""),
      startDate: String(data.startdate ?? data.start_date ?? ""),
      endDate: String(data.enddate ?? data.end_date ?? ""),
      status: (data.status as Term["status"]) ?? "active",
      academicYear: String(data.academicyear ?? data.academic_year ?? ""),
      organizationId: String(data.organizationid ?? data.organization_id ?? ""),
      isActive: Boolean(data.isactive ?? data.is_active ?? true),
      createdAt: String(data.createdat ?? ""),
      updatedAt: String(data.updatedat ?? ""),
      createdBy: String(data.createdby ?? ""),
    };
  }

  private mapWeeklyRule(data: Record<string, unknown>): SchoolCalendarWeeklyRule {
    return {
      id: String(data.id ?? ""),
      termId: String(data.termid ?? data.term_id ?? ""),
      weekday: Number(data.weekday ?? 0),
      dayType: (data.daytype ?? data.day_type ?? "closed") as SchoolCalendarWeeklyRule["dayType"],
      reason: String(data.reason ?? ""),
    };
  }

  private mapDayOverride(data: Record<string, unknown>): SchoolCalendarDayOverride {
    return {
      id: String(data.id ?? ""),
      termId: String(data.termid ?? data.term_id ?? ""),
      calendarDate: String(data.calendardate ?? data.calendar_date ?? "").slice(0, 10),
      dayType: (data.daytype ?? data.day_type ?? "closed") as SchoolCalendarDayOverride["dayType"],
      reason: String(data.reason ?? ""),
    };
  }

  private mapNotice(data: Record<string, unknown>): SchoolNotice {
    return {
      id: String(data.id ?? ""),
      title: String(data.title ?? ""),
      body: String(data.body ?? ""),
      audience: (data.audience ?? "all") as SchoolNoticeAudience,
      publishFrom: String(data.publishfrom ?? data.publish_from ?? "").slice(0, 10),
      publishTo: String(data.publishto ?? data.publish_to ?? "").slice(0, 10),
      createdAt: String(data.createdat ?? data.created_at ?? ""),
    };
  }

  mapNotificationsPage(data: Record<string, unknown>): SchoolNotificationsPage {
    const termRaw = data.term as Record<string, unknown> | null | undefined;
    const weekly = (data.weeklyrules ?? data.weekly_rules ?? []) as Record<string, unknown>[];
    const overrides = (data.dayoverrides ?? data.day_overrides ?? []) as Record<string, unknown>[];
    const notices = (data.notices ?? []) as Record<string, unknown>[];
    return {
      term: termRaw && Object.keys(termRaw).length ? this.mapTerm(termRaw) : null,
      weeklyRules: weekly.map((r) => this.mapWeeklyRule(r)),
      dayOverrides: overrides.map((o) => this.mapDayOverride(o)),
      notices: notices.map((n) => this.mapNotice(n)),
      canManage: Boolean(data.canmanage ?? data.can_manage ?? false),
    };
  }

  async getNotificationsPage(audience: NotificationsReaderAudience): Promise<SchoolNotificationsPage> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      "/campusza/page/GetSchoolNotificationsPage",
      {
        item: {
          organizationid: this.getOrganizationId(),
          audience,
        },
      }
    );
    return this.mapNotificationsPage((response.data.item ?? {}) as Record<string, unknown>);
  }

  async saveNotice(payload: {
    id?: string;
    title: string;
    body: string;
    audience: SchoolNoticeAudience;
    publishFrom?: string;
    publishTo?: string;
  }): Promise<SchoolNotice> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.endpoint}/Save`, {
      item: {
        id: payload.id ?? "",
        organizationid: this.getOrganizationId(),
        title: payload.title,
        body: payload.body,
        audience: payload.audience,
        publishfrom: payload.publishFrom ?? "",
        publishto: payload.publishTo ?? "",
      },
    });
    return this.mapNotice((response.data.item ?? {}) as Record<string, unknown>);
  }

  async deleteNotice(id: string): Promise<void> {
    await apiClient.post(`${this.endpoint}/Delete`, {
      item: { id, organizationid: this.getOrganizationId() },
    });
  }
}

export const schoolNoticeService = SchoolNoticeService.getInstance();
