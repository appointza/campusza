import apiClient, { ActionRes } from './api.service';
import { Term } from '@/models/term.model';

class TermService {
    private static instance: TermService;
    private readonly endpoint = '/campusza/term';

    private constructor() { }

    public static getInstance(): TermService {
        if (!TermService.instance) {
            TermService.instance = new TermService();
        }
        return TermService.instance;
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

    private mapToServer(data: Partial<Term>): Record<string, unknown> {
        return {
            id: data.id || '',
            name: data.name || '',
            startdate: data.startDate || '',
            enddate: data.endDate || '',
            status: data.status || 'active',
            academicyear: data.academicYear || '',
            description: data.description || '',
            organizationid: data.organizationId || this.getOrganizationId(),
        };
    }

    private mapFromServer(data: any): Term {
        return {
            id: data?.id,
            name: data?.name,
            startDate: data?.startdate ?? data?.start_date,
            endDate: data?.enddate ?? data?.end_date,
            status: data?.status,
            academicYear: data?.academicyear ?? data?.academic_year,
            organizationId: data?.organizationid ?? data?.organization_id,
            description: data?.description,
            isActive: data?.isactive ?? data?.is_active ?? true,
            createdAt: data?.createdat ?? data?.created_at,
            updatedAt: data?.updatedat ?? data?.updated_at,
            createdBy: data?.createdby ?? data?.created_by,
            updatedBy: data?.updatedby ?? data?.updated_by,
        } as Term;
    }

    public async getAll(): Promise<Term[]> {
        const response = await apiClient.post<ActionRes<Term[]>>(`${this.endpoint}/Select`, {
            item: { organizationid: this.getOrganizationId() }
        });
        return response.data.item.map((item) => this.mapFromServer(item));
    }

    public async save(data: Partial<Term>): Promise<Term> {
        const response = await apiClient.post<ActionRes<Term>>(`${this.endpoint}/Save`, { item: this.mapToServer(data) });
        return this.mapFromServer(response.data.item);
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: { id, organizationid: this.getOrganizationId() }
        });
        return response.data.item;
    }
}

export const termService = TermService.getInstance();
