import apiClient, { ActionRes } from './api.service';
import type { ClassFeeConfiguration, DocumentRequirement } from '@/models/class-configuration.model';

class ClassConfigurationService {
    private static instance: ClassConfigurationService;
    private readonly endpoint = '/campusza/classconfiguration';

    private constructor() { }

    public static getInstance(): ClassConfigurationService {
        if (!ClassConfigurationService.instance) {
            ClassConfigurationService.instance = new ClassConfigurationService();
        }
        return ClassConfigurationService.instance;
    }

    private getStoredUser() {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as { organizationId?: string; userId?: string; email?: string };
        } catch {
            return null;
        }
    }

    private getOrganizationId(): string {
        return this.getStoredUser()?.organizationId || '';
    }

    private getActor(): string {
        const user = this.getStoredUser();
        return user?.userId || user?.email || 'system';
    }

    private mapFeeFromServer(data: any): ClassFeeConfiguration {
        return {
            id: data?.id?.toString() || '',
            grade: data?.grade || '',
            classId: data?.classid || undefined,
            className: data?.classname || undefined,
            semesterType: data?.semestertype || 'semester_1',
            termId: data?.termid || undefined,
            termName: data?.termname || undefined,
            feeStructures: data?.feestructures_json ? JSON.parse(data.feestructures_json) : [],
            totalAmount: data?.totalamount ?? 0,
            currency: data?.currency || 'USD',
            dueDate: data?.duedate || undefined,
            paymentSchedule: data?.paymentschedule || 'one_time',
            numberOfInstallments: data?.numberofinstallments ?? 1,
            isActive: data?.isactive ?? true,
            organizationId: data?.organizationid || '',
            createdAt: data?.createdat || '',
            updatedAt: data?.updatedat || '',
            createdBy: data?.createdby || '',
            updatedBy: data?.updatedby || undefined,
        };
    }

    private mapFeeToServer(data: Partial<ClassFeeConfiguration>): Record<string, unknown> {
        const actor = this.getActor();
        const organizationId = data.organizationId || this.getOrganizationId();
        const now = new Date().toISOString();

        const dueDate = data.dueDate ? new Date(data.dueDate).toISOString() : null;
        return {
            id: data.id || '',
            grade: data.grade || '',
            classid: data.classId || '',
            classname: data.className || '',
            semestertype: data.semesterType || 'semester_1',
            termid: data.termId || '',
            termname: data.termName || '',
            feestructures_json: JSON.stringify(data.feeStructures || []),
            totalamount: data.totalAmount ?? 0,
            currency: data.currency || 'USD',
            duedate: dueDate,
            paymentschedule: data.paymentSchedule || 'one_time',
            numberofinstallments: data.numberOfInstallments ?? 1,
            organizationid: organizationId,
            isactive: data.isActive ?? true,
            createdat: data.createdAt || now,
            updatedat: data.updatedAt || now,
            createdby: data.createdBy || actor,
            updatedby: data.updatedBy || actor,
        };
    }

    private mapDocumentFromServer(data: any): DocumentRequirement {
        return {
            id: data?.id?.toString() || '',
            grade: data?.grade || '',
            classId: data?.classid || undefined,
            className: data?.classname || undefined,
            semesterType: data?.semestertype || 'semester_1',
            termId: data?.termid || undefined,
            termName: data?.termname || undefined,
            documentType: data?.documenttype || 'other',
            action: data?.action || 'collect',
            isRequired: data?.isrequired ?? false,
            requiredAt: data?.requiredat || 'admission',
            assignedStaffId: data?.assignedstaffid || undefined,
            assignedStaffName: data?.assignedstaffname || undefined,
            description: data?.description || undefined,
            status: data?.status || 'pending',
            organizationId: data?.organizationid || '',
            isActive: data?.isactive ?? true,
            createdAt: data?.createdat || '',
            updatedAt: data?.updatedat || '',
            createdBy: data?.createdby || '',
            updatedBy: data?.updatedby || undefined,
        };
    }

    private mapDocumentToServer(data: Partial<DocumentRequirement>): Record<string, unknown> {
        const actor = this.getActor();
        const organizationId = data.organizationId || this.getOrganizationId();
        const now = new Date().toISOString();

        return {
            id: data.id || '',
            grade: data.grade || '',
            classid: data.classId || '',
            classname: data.className || '',
            semestertype: data.semesterType || 'semester_1',
            termid: data.termId || '',
            termname: data.termName || '',
            documenttype: data.documentType || 'other',
            action: data.action || 'collect',
            isrequired: data.isRequired ?? false,
            requiredat: data.requiredAt || 'admission',
            assignedstaffid: data.assignedStaffId || '',
            assignedstaffname: data.assignedStaffName || '',
            description: data.description || '',
            status: data.status || 'pending',
            organizationid: organizationId,
            isactive: data.isActive ?? true,
            createdat: data.createdAt || now,
            updatedat: data.updatedAt || now,
            createdby: data.createdBy || actor,
            updatedby: data.updatedBy || actor,
        };
    }

    public async getFeeConfigs(filters?: {
        grade?: string;
        classId?: string;
        termId?: string;
        semesterType?: string;
    }): Promise<ClassFeeConfiguration[]> {
        const response = await apiClient.post<ActionRes<any[]>>(`${this.endpoint}/SelectFeeConfig`, {
            item: {
                id: '',
                organizationid: this.getOrganizationId(),
                grade: filters?.grade || '',
                classid: filters?.classId || '',
                semestertype: filters?.semesterType || '',
                termid: filters?.termId || '',
            }
        });
        return response.data.item.map((item) => this.mapFeeFromServer(item));
    }

    public async saveFeeConfig(data: Partial<ClassFeeConfiguration>): Promise<ClassFeeConfiguration> {
        const response = await apiClient.post<ActionRes<any>>(`${this.endpoint}/SaveFeeConfig`, {
            item: this.mapFeeToServer(data)
        });
        return this.mapFeeFromServer(response.data.item);
    }

    public async deleteFeeConfig(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/DeleteFeeConfig`, {
            item: { id, organizationid: this.getOrganizationId() }
        });
        return response.data.item;
    }

    public async getDocumentRequirements(filters?: {
        grade?: string;
        classId?: string;
        termId?: string;
        semesterType?: string;
    }): Promise<DocumentRequirement[]> {
        const response = await apiClient.post<ActionRes<any[]>>(`${this.endpoint}/SelectDocumentRequirement`, {
            item: {
                id: '',
                organizationid: this.getOrganizationId(),
                grade: filters?.grade || '',
                classid: filters?.classId || '',
                semestertype: filters?.semesterType || '',
                termid: filters?.termId || '',
            }
        });
        return response.data.item.map((item) => this.mapDocumentFromServer(item));
    }

    public async saveDocumentRequirement(data: Partial<DocumentRequirement>): Promise<DocumentRequirement> {
        const response = await apiClient.post<ActionRes<any>>(`${this.endpoint}/SaveDocumentRequirement`, {
            item: this.mapDocumentToServer(data)
        });
        return this.mapDocumentFromServer(response.data.item);
    }

    public async deleteDocumentRequirement(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/DeleteDocumentRequirement`, {
            item: { id, organizationid: this.getOrganizationId() }
        });
        return response.data.item;
    }

    public async updateDocumentRequirementStatus(id: string, status: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(
            `${this.endpoint}/UpdateDocumentRequirementStatus`,
            { item: { id, status } }
        );
        return response.data.item;
    }
}

export const classConfigurationService = ClassConfigurationService.getInstance();
