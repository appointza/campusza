import apiClient, { ActionRes } from './api.service';
// Assuming class.model.ts export definition roughly matches. 
// If specific types cause issues, we might need 'any' temporarily or strict type alignment.
// Using 'any' for imported model to avoid build breaks if model is slightly different, 
// but generally should point to '@/models/class.model'
import { Class } from '@/models/class.model';
import {
  classMatchesGradeRef,
  type ReferenceValue,
} from '@/models/referencevalue.model';

class ClassService {
    private static instance: ClassService;
    private readonly endpoint = '/campusza/class';

    private constructor() { }

    public static getInstance(): ClassService {
        if (!ClassService.instance) {
            ClassService.instance = new ClassService();
        }
        return ClassService.instance;
    }

    private getStoredUser() {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as {
                organizationId?: string;
                organizationid?: string;
                organization_id?: string;
                userId?: string;
                email?: string;
            };
        } catch {
            return null;
        }
    }

    private getOrganizationId(): string {
        const user = this.getStoredUser();
        return user?.organizationId || user?.organizationid || user?.organization_id || '';
    }

    private getActor(): string {
        const user = this.getStoredUser();
        return user?.userId || user?.email || 'system';
    }

    private mapFromServer(data: any): Class {
        return {
            id: data?.id,
            name: data?.name,
            grade: data?.grade,
            section: data?.section,
            academicYear: data?.academicyear,
            termId: data?.termid,
            capacity: data?.capacity,
            currentEnrollment: data?.currentenrollment,
            room: data?.room,
            classTeacherId: data?.classteacherid,
            classTeacherName: data?.classteachername,
            assistantMentorId: data?.assistantmentorid,
            assistantMentorName: data?.assistantmentorname,
            subjects: data?.subjects_json ? JSON.parse(data.subjects_json) : [],
            schedule: data?.schedule_json ? JSON.parse(data.schedule_json) : [],
            status: data?.status,
            organizationId: data?.organizationid,
            isActive: data?.isactive,
            createdAt: data?.createdat,
            updatedAt: data?.updatedat,
            createdBy: data?.createdby,
            updatedBy: data?.updatedby,
        } as Class;
    }

    private mapToServer(data: Partial<Class>): Record<string, unknown> {
        const actor = this.getActor();
        return {
            id: data.id || '',
            name: data.name || '',
            grade: data.grade || '',
            section: data.section || '',
            academicyear: data.academicYear || '',
            termid: data.termId || '',
            capacity: data.capacity ?? 0,
            currentenrollment: data.currentEnrollment ?? 0,
            room: data.room || '',
            classteacherid: data.classTeacherId || '',
            classteachername: data.classTeacherName || '',
            assistantmentorid: data.assistantMentorId || '',
            assistantmentorname: data.assistantMentorName || '',
            subjects_json: JSON.stringify(data.subjects || []),
            schedule_json: JSON.stringify(data.schedule || []),
            status: data.status || 'active',
            organizationid: data.organizationId || this.getOrganizationId(),
            createdby: data.createdBy || actor,
            updatedby: data.updatedBy || actor,
        };
    }

    public async getAll(req?: { organizationid?: string }): Promise<Class[]> {
        const response = await apiClient.post<ActionRes<Class[]>>(`${this.endpoint}/Select`, {
            item: {
                id: '',
                organizationid: req?.organizationid || this.getOrganizationId(),
                academicyear: '',
                termid: '',
                classteacherid: '',
                status: '',
            }
        });
        return response.data.item.map(this.mapFromServer);
    }

    public async getByGrade(
        gradeId: string,
        organizationid?: string,
        gradeRefs?: ReferenceValue[]
    ): Promise<Class[]> {
        const org = organizationid || this.getOrganizationId();
        const allClasses = await this.getAll({ organizationid: org });
        if (gradeRefs?.length) {
            return allClasses.filter((c) => classMatchesGradeRef(c.grade, gradeId, gradeRefs));
        }
        return allClasses.filter((c) => c.grade === gradeId);
    }

    public async getByTeacher(staffId: string): Promise<Class[]> {
        const response = await apiClient.post<ActionRes<Class[]>>(`${this.endpoint}/Select`, {
            item: {
                id: '',
                organizationid: this.getOrganizationId(),
                academicyear: '',
                termid: '',
                classteacherid: staffId,
                status: '',
            }
        });
        return response.data.item.map(this.mapFromServer);
    }

    /** Classes where staff is class teacher or assistant mentor (matches /staff/classes). */
    public async getAssignedToStaff(staffId: string): Promise<Class[]> {
        const response = await apiClient.post<ActionRes<Class[]>>(`${this.endpoint}/GetAssignedToStaff`, {
            item: {
                organizationid: this.getOrganizationId(),
                staffid: staffId,
            },
        });
        return response.data.item.map(this.mapFromServer);
    }

    public async getById(id: string): Promise<Class> {
        const response = await apiClient.post<ActionRes<Class[]>>(`${this.endpoint}/Select`, {
            item: {
                id,
                organizationid: this.getOrganizationId(),
                academicyear: '',
                termid: '',
                classteacherid: '',
                status: '',
            }
        });
        return this.mapFromServer(response.data.item[0]);
    }

    public async create(data: Partial<Class>): Promise<Class> {
        const response = await apiClient.post<ActionRes<Class>>(`${this.endpoint}/Save`, { item: this.mapToServer(data) });
        return this.mapFromServer(response.data.item);
    }

    public async update(data: Partial<Class>): Promise<Class> {
        const response = await apiClient.post<ActionRes<Class>>(`${this.endpoint}/Save`, { item: this.mapToServer(data) });
        return this.mapFromServer(response.data.item);
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: { id, organizationid: this.getOrganizationId() }
        });
        return response.data.item;
    }
}

export const classService = ClassService.getInstance();
