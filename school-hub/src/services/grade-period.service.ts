import apiClient, { ActionRes } from "./api.service";
import type { GradePeriod } from "@/models/grade-period.model";
import { toApiTime } from "@/models/grade-period.model";
import { staffService } from "./staff.service";

class GradePeriodService {
  private static instance: GradePeriodService;
  private readonly endpoint = "/campusza/gradeperiod";

  private constructor() {}

  public static getInstance(): GradePeriodService {
    if (!GradePeriodService.instance) {
      GradePeriodService.instance = new GradePeriodService();
    }
    return GradePeriodService.instance;
  }

  private getOrganizationId(): string {
    return staffService.getOrganizationId();
  }

  private getUserId(): string {
    try {
      const raw = localStorage.getItem("campusza_user");
      if (!raw) return "";
      const u = JSON.parse(raw) as { userId?: string; userid?: string };
      return (u.userId || u.userid || "").trim();
    } catch {
      return "";
    }
  }

  private mapFromServer(data: any): GradePeriod {
    const start =
      data?.starttime ?? data?.startTime ?? data?.start_time ?? "";
    const end = data?.endtime ?? data?.endTime ?? data?.end_time ?? "";
    return {
      id: data?.id || "",
      organizationId: data?.organizationid ?? data?.organizationId ?? "",
      gradeId: data?.gradeid ?? data?.gradeId ?? "",
      gradeName: data?.gradename ?? data?.gradeName ?? "",
      periodCode: data?.periodcode ?? data?.periodCode ?? "",
      periodName: data?.periodname ?? data?.periodName ?? "",
      startTime: typeof start === "string" ? start : String(start ?? ""),
      endTime: typeof end === "string" ? end : String(end ?? ""),
      displayOrder: data?.displayorder ?? data?.displayOrder ?? 0,
      isActive: data?.isactive ?? data?.isActive ?? true,
      createdAt: data?.createdat ?? data?.createdAt,
      updatedAt: data?.updatedat ?? data?.updatedAt,
      createdBy: data?.createdby ?? data?.createdBy,
      updatedBy: data?.updatedby ?? data?.updatedBy,
    };
  }

  private mapToServer(data: Partial<GradePeriod>): Record<string, unknown> {
    const userId = this.getUserId();
    return {
      id: data.id || "",
      organizationid: data.organizationId || this.getOrganizationId(),
      gradeid: data.gradeId || "",
      gradename: data.gradeName || "",
      periodcode: data.periodCode || "",
      periodname: data.periodName || "",
      starttime: toApiTime(data.startTime || ""),
      endtime: toApiTime(data.endTime || ""),
      displayorder: data.displayOrder ?? 0,
      isactive: data.isActive ?? true,
      createdby: data.createdBy || userId,
      updatedby: userId,
    };
  }

  public async getByGrade(gradeId: string): Promise<GradePeriod[]> {
    if (!gradeId) return [];
    const response = await apiClient.post<ActionRes<GradePeriod[]>>(`${this.endpoint}/Select`, {
      item: {
        id: "",
        organizationid: this.getOrganizationId(),
        gradeid: gradeId,
      },
    });
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapFromServer(r)).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async getAll(): Promise<GradePeriod[]> {
    const response = await apiClient.post<ActionRes<GradePeriod[]>>(`${this.endpoint}/Select`, {
      item: {
        id: "",
        organizationid: this.getOrganizationId(),
        gradeid: "",
      },
    });
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapFromServer(r));
  }

  public async save(data: Partial<GradePeriod>): Promise<GradePeriod> {
    const response = await apiClient.post<ActionRes<GradePeriod>>(`${this.endpoint}/Save`, {
      item: this.mapToServer(data),
    });
    return this.mapFromServer(response.data.item);
  }

  public async delete(id: string): Promise<boolean> {
    const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
      item: { id, organizationid: this.getOrganizationId() },
    });
    return response.data.item;
  }

  public async replaceSchedule(
    gradeId: string,
    gradeName: string,
    periods: Array<{
      periodCode: string;
      periodName: string;
      startTime: string;
      endTime: string;
      displayOrder: number;
    }>
  ): Promise<GradePeriod[]> {
    const response = await apiClient.post<ActionRes<GradePeriod[]>>(`${this.endpoint}/ReplaceSchedule`, {
      item: {
        organizationid: this.getOrganizationId(),
        gradeid: gradeId,
        gradename: gradeName,
        periods: periods.map((p) => ({
          periodcode: p.periodCode,
          periodname: p.periodName,
          starttime: toApiTime(p.startTime),
          endtime: toApiTime(p.endTime),
          displayorder: p.displayOrder,
        })),
      },
    });
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapFromServer(r)).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async copyToGrade(fromGradeId: string, toGradeId: string, toGradeName: string): Promise<GradePeriod[]> {
    const response = await apiClient.post<ActionRes<GradePeriod[]>>(`${this.endpoint}/CopyToGrade`, {
      item: {
        organizationid: this.getOrganizationId(),
        fromgradeid: fromGradeId,
        togradeid: toGradeId,
        togradename: toGradeName,
      },
    });
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapFromServer(r));
  }
}

export const gradePeriodService = GradePeriodService.getInstance();
