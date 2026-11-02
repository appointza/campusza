import apiClient, { ActionRes } from './api.service';
import { StaffReplacement } from '@/models/staff.model';

type StoredUser = {
  userId?: string;
  email?: string;
  organizationId?: string;
  organizationid?: string;
  organization_id?: string;
};

class StaffReplacementService {
  private static instance: StaffReplacementService;
  private readonly endpoint = '/campusza/staffreplacement';

  private constructor() {}

  public static getInstance(): StaffReplacementService {
    if (!StaffReplacementService.instance) {
      StaffReplacementService.instance = new StaffReplacementService();
    }
    return StaffReplacementService.instance;
  }

  private getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem('campusza_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }

  private getOrganizationId(): string {
    const user = this.getStoredUser();
    return user?.organizationId || user?.organizationid || user?.organization_id || '';
  }

  private mapFromServer(data: any): StaffReplacement {
    return {
      id: data?.id,
      scheduleId: data?.scheduleid,
      originalTeacherId: data?.originalteacherid,
      originalTeacherName: data?.originalteachername,
      replacementTeacherId: data?.replacementteacherid,
      replacementTeacherName: data?.replacementteachername,
      subjectId: data?.subjectid || undefined,
      subject: data?.subject || undefined,
      date: data?.date,
      reason: data?.reason,
      assignedBy: data?.assignedby,
      assignedDate: data?.assigneddate,
      status: data?.status,
      organizationId: data?.organizationid,
      isActive: data?.isactive ?? true,
    } as StaffReplacement;
  }

  private mapToServer(data: Partial<StaffReplacement>): Record<string, unknown> {
    return {
      id: data.id || '',
      scheduleid: data.scheduleId || '',
      originalteacherid: data.originalTeacherId || '',
      originalteachername: data.originalTeacherName || '',
      replacementteacherid: data.replacementTeacherId || '',
      replacementteachername: data.replacementTeacherName || '',
      subjectid: data.subjectId || '',
      subject: data.subject || '',
      date: data.date || '',
      reason: data.reason || '',
      assignedby: data.assignedBy || '',
      assigneddate: data.assignedDate || '',
      status: data.status || '',
      organizationid: data.organizationId || this.getOrganizationId(),
      isactive: data.isActive ?? true,
    };
  }

  public async getAll(): Promise<StaffReplacement[]> {
    const response = await apiClient.post<ActionRes<StaffReplacement[]>>(`${this.endpoint}/Select`, {
      item: {
        id: '',
        scheduleid: '',
        status: '',
        organizationid: this.getOrganizationId(),
      },
    });
    return response.data.item.map(this.mapFromServer);
  }

  public async create(data: Partial<StaffReplacement>): Promise<StaffReplacement> {
    const response = await apiClient.post<ActionRes<StaffReplacement>>(`${this.endpoint}/Save`, {
      item: this.mapToServer(data),
    });
    return this.mapFromServer(response.data.item);
  }

  public async update(data: Partial<StaffReplacement>): Promise<StaffReplacement> {
    const response = await apiClient.post<ActionRes<StaffReplacement>>(`${this.endpoint}/Save`, {
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
}

export const staffReplacementService = StaffReplacementService.getInstance();
