import apiClient, { ActionRes } from "./api.service";
import type {
  SchoolCalendarDayOverride,
  SchoolCalendarPage,
  SchoolCalendarWeeklyRule,
} from "@/models/school-calendar.model";
import type { Term } from "@/models/term.model";

type StoredUser = {
  organizationId?: string;
  organizationid?: string;
};

class SchoolCalendarService {
  private static instance: SchoolCalendarService;
  private readonly endpoint = "/campusza/schoolcalendar";

  public static getInstance(): SchoolCalendarService {
    if (!SchoolCalendarService.instance) {
      SchoolCalendarService.instance = new SchoolCalendarService();
    }
    return SchoolCalendarService.instance;
  }

  private getOrganizationId(): string {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) return "";
    try {
      const u = JSON.parse(raw) as StoredUser;
      return u.organizationId || u.organizationid || "";
    } catch {
      return "";
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

  private mapPage(data: Record<string, unknown>): SchoolCalendarPage {
    const termRaw = (data.term ?? {}) as Record<string, unknown>;
    const weekly = (data.weeklyrules ?? data.weekly_rules ?? []) as Record<string, unknown>[];
    const overrides = (data.dayoverrides ?? data.day_overrides ?? []) as Record<string, unknown>[];
    return {
      term: this.mapTerm(termRaw),
      weeklyRules: weekly.map((r) => this.mapWeeklyRule(r)),
      dayOverrides: overrides.map((o) => this.mapDayOverride(o)),
    };
  }

  public async getPage(termId: string): Promise<SchoolCalendarPage> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.endpoint}/GetPage`, {
      item: { termid: termId, organizationid: this.getOrganizationId() },
    });
    return this.mapPage((response.data.item ?? {}) as Record<string, unknown>);
  }

  public async saveWeeklyRule(payload: {
    id?: string;
    termId: string;
    weekday: number;
    dayType: "closed" | "half_day";
    reason: string;
  }): Promise<SchoolCalendarPage> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/SaveWeeklyRule`,
      {
        item: {
          id: payload.id ?? "",
          termid: payload.termId,
          organizationid: this.getOrganizationId(),
          weekday: payload.weekday,
          daytype: payload.dayType,
          reason: payload.reason,
        },
      }
    );
    return this.mapPage((response.data.item ?? {}) as Record<string, unknown>);
  }

  public async deleteWeeklyRule(id: string, termId: string): Promise<SchoolCalendarPage> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/DeleteWeeklyRule`,
      {
        item: { id, termid: termId, organizationid: this.getOrganizationId() },
      }
    );
    return this.mapPage((response.data.item ?? {}) as Record<string, unknown>);
  }

  public async saveDayOverride(payload: {
    id?: string;
    termId: string;
    calendarDate: string;
    dayType: "closed" | "half_day" | "open";
    reason: string;
  }): Promise<SchoolCalendarPage> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/SaveDayOverride`,
      {
        item: {
          id: payload.id ?? "",
          termid: payload.termId,
          organizationid: this.getOrganizationId(),
          calendardate: payload.calendarDate,
          daytype: payload.dayType,
          reason: payload.reason,
        },
      }
    );
    return this.mapPage((response.data.item ?? {}) as Record<string, unknown>);
  }

  public async deleteDayOverride(id: string, termId: string): Promise<SchoolCalendarPage> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/DeleteDayOverride`,
      {
        item: { id, termid: termId, organizationid: this.getOrganizationId() },
      }
    );
    return this.mapPage((response.data.item ?? {}) as Record<string, unknown>);
  }
}

export const schoolCalendarService = SchoolCalendarService.getInstance();
