import apiClient, { ActionRes } from './api.service';
import { StaffSchedule } from '@/models/staff.model';

type StoredUser = {
  userId?: string;
  email?: string;
  organizationId?: string;
  organizationid?: string;
  organization_id?: string;
};

class StaffScheduleService {
  private static instance: StaffScheduleService;
  private readonly endpoint = '/campusza/staffschedule';

  private constructor() {}

  public static getInstance(): StaffScheduleService {
    if (!StaffScheduleService.instance) {
      StaffScheduleService.instance = new StaffScheduleService();
    }
    return StaffScheduleService.instance;
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

  private mapFromServer(data: any): StaffSchedule {
    return {
      id: data?.id,
      staffId: data?.staffid,
      staffName: data?.staffname,
      day: data?.day,
      startTime: data?.starttime,
      endTime: data?.endtime,
      subject: data?.subject,
      subjectId: data?.subjectid,
      classId: data?.classid,
      className: data?.classname,
      room: data?.room,
      isReplacement: data?.isreplacement ?? false,
      originalTeacherId: data?.originalteacherid,
      originalTeacherName: data?.originalteachername,
      replacementTeacherId: data?.replacementteacherid,
      replacementTeacherName: data?.replacementteachername,
      organizationId: data?.organizationid,
      isActive: data?.isactive ?? true,
    } as StaffSchedule;
  }

  private mapToServer(data: Partial<StaffSchedule>): Record<string, unknown> {
    return {
      id: data.id || '',
      staffid: data.staffId || '',
      staffname: data.staffName || '',
      day: data.day || '',
      starttime: data.startTime || '',
      endtime: data.endTime || '',
      subject: data.subject || '',
      subjectid: data.subjectId || '',
      classid: data.classId || '',
      classname: data.className || '',
      room: data.room || '',
      isreplacement: data.isReplacement ?? false,
      originalteacherid: data.originalTeacherId || '',
      originalteachername: data.originalTeacherName || '',
      replacementteacherid: data.replacementTeacherId || '',
      replacementteachername: data.replacementTeacherName || '',
      organizationid: data.organizationId || this.getOrganizationId(),
      isactive: data.isActive ?? true,
    };
  }

  public async getAll(): Promise<StaffSchedule[]> {
    const response = await apiClient.post<ActionRes<StaffSchedule[]>>(`${this.endpoint}/Select`, {
      item: {
        id: '',
        staffid: '',
        classid: '',
        day: '',
        organizationid: this.getOrganizationId(),
      },
    });
    return response.data.item.map(this.mapFromServer);
  }

  public async getByStaff(staffId: string): Promise<StaffSchedule[]> {
    const response = await apiClient.post<ActionRes<StaffSchedule[]>>(`${this.endpoint}/Select`, {
      item: {
        id: '',
        staffid: staffId,
        classid: '',
        day: '',
        organizationid: this.getOrganizationId(),
      },
    });
    return response.data.item.map(this.mapFromServer);
  }

  public async getByClass(classId: string): Promise<StaffSchedule[]> {
    const response = await apiClient.post<ActionRes<StaffSchedule[]>>(`${this.endpoint}/Select`, {
      item: {
        id: '',
        staffid: '',
        classid: classId,
        day: '',
        organizationid: this.getOrganizationId(),
      },
    });
    return response.data.item.map(this.mapFromServer);
  }

  public async create(data: Partial<StaffSchedule>): Promise<StaffSchedule> {
    const response = await apiClient.post<ActionRes<StaffSchedule>>(`${this.endpoint}/Save`, {
      item: this.mapToServer(data),
    });
    return this.mapFromServer(response.data.item);
  }

  public async update(data: Partial<StaffSchedule>): Promise<StaffSchedule> {
    const response = await apiClient.post<ActionRes<StaffSchedule>>(`${this.endpoint}/Save`, {
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

export const staffScheduleService = StaffScheduleService.getInstance();
