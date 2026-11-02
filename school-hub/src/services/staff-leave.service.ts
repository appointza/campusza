import apiClient, { ActionRes } from './api.service';
import { StaffLeave } from '@/models/staff.model';

type StoredUser = {
  userId?: string;
  email?: string;
  organizationId?: string;
  organizationid?: string;
  organization_id?: string;
};

class StaffLeaveService {
  private static instance: StaffLeaveService;
  private readonly endpoint = '/campusza/staffleave';

  private constructor() {}

  public static getInstance(): StaffLeaveService {
    if (!StaffLeaveService.instance) {
      StaffLeaveService.instance = new StaffLeaveService();
    }
    return StaffLeaveService.instance;
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

  private mapFromServer(data: any): StaffLeave {
    return {
      id: data?.id,
      staffId: data?.staffid,
      staffName: data?.staffname,
      leaveType: data?.leavetype,
      startDate: data?.startdate,
      endDate: data?.enddate,
      reason: data?.reason,
      status: data?.status,
      appliedDate: data?.applieddate,
      approvedBy: data?.approvedby || undefined,
      approvedDate: data?.approveddate || undefined,
      rejectedReason: data?.rejectedreason || undefined,
      totalDays: data?.totaldays ?? 0,
      organizationId: data?.organizationid,
      isActive: data?.isactive ?? true,
    } as StaffLeave;
  }

  private mapToServer(data: Partial<StaffLeave>): Record<string, unknown> {
    return {
      id: data.id || '',
      staffid: data.staffId || '',
      staffname: data.staffName || '',
      leavetype: data.leaveType || '',
      startdate: data.startDate || '',
      enddate: data.endDate || '',
      reason: data.reason || '',
      status: data.status || '',
      applieddate: data.appliedDate || '',
      approvedby: data.approvedBy || '',
      approveddate: data.approvedDate || null,
      rejectedreason: data.rejectedReason || '',
      totaldays: data.totalDays ?? 0,
      organizationid: data.organizationId || this.getOrganizationId(),
      isactive: data.isActive ?? true,
    };
  }

  public async getAll(): Promise<StaffLeave[]> {
    const response = await apiClient.post<ActionRes<StaffLeave[]>>(`${this.endpoint}/Select`, {
      item: {
        id: '',
        staffid: '',
        status: '',
        organizationid: this.getOrganizationId(),
      },
    });
    return response.data.item.map(this.mapFromServer);
  }

  public async create(data: Partial<StaffLeave>): Promise<StaffLeave> {
    const response = await apiClient.post<ActionRes<StaffLeave>>(`${this.endpoint}/Save`, {
      item: this.mapToServer(data),
    });
    return this.mapFromServer(response.data.item);
  }

  public async update(data: Partial<StaffLeave>): Promise<StaffLeave> {
    const response = await apiClient.post<ActionRes<StaffLeave>>(`${this.endpoint}/Save`, {
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

export const staffLeaveService = StaffLeaveService.getInstance();
