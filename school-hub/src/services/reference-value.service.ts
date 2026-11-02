import apiClient, { ActionRes } from './api.service';
import { ReferenceValue, normalizeReferenceValueCategory } from '@/models/referencevalue.model';
import { staffService } from './staff.service';

class ReferenceValueService {
    private static instance: ReferenceValueService;
    private readonly endpoint = '/campusza/referencevalue';

    private constructor() { }

    public static getInstance(): ReferenceValueService {
        if (!ReferenceValueService.instance) {
            ReferenceValueService.instance = new ReferenceValueService();
        }
        return ReferenceValueService.instance;
    }

    private getStoredUser() {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as {
                organizationId?: string;
                userId?: string;
                userid?: string;
                user_id?: string;
                email?: string;
            };
        } catch {
            return null;
        }
    }

    private getOrganizationId(): string {
        return staffService.getOrganizationId();
    }

    private getUserId(): string {
        const user = this.getStoredUser();
        return (user?.userId || user?.userid || user?.user_id || '').trim();
    }

    private mapFromServer(data: any): ReferenceValue {
        const metadata = typeof data?.metadata_json === 'string'
            ? JSON.parse(data.metadata_json || '{}')
            : data?.metadata_json || undefined;

        return {
            id: data?.id,
            category: data?.category,
            code: data?.code,
            name: data?.name,
            shortName: data?.shortname ?? data?.shortName,
            description: data?.description,
            value: data?.value,
            displayOrder: data?.displayorder ?? data?.displayOrder ?? 0,
            parentId: (data?.parentid ?? data?.parentId) || undefined,
            metadata,
            isSystem:
                data?.issystem === true ||
                data?.isSystem === true ||
                data?.is_system === true ||
                data?.issystem === 'true' ||
                data?.isSystem === 'true',
            isDefault:
                data?.isdefault === true ||
                data?.isDefault === true ||
                data?.isdefault === 'true' ||
                data?.isDefault === 'true',
            status: data?.status,
            organizationId: (data?.organizationid ?? data?.organizationId) || undefined,
            isActive: data?.isactive ?? data?.isActive ?? true,
            createdAt: data?.createdat ?? data?.createdAt,
            updatedAt: data?.updatedat ?? data?.updatedAt,
            createdBy: data?.createdby ?? data?.createdBy,
            updatedBy: data?.updatedby ?? data?.updatedBy,
        } as ReferenceValue;
    }

    private mapToServer(data: Partial<ReferenceValue>, action: 'create' | 'update'): Record<string, unknown> {
        const userId = this.getUserId();
        const organizationId = data.isSystem ? '' : (data.organizationId || this.getOrganizationId());
        const cat = data.category || '';
        return {
            id: data.id || '',
            category: cat ? normalizeReferenceValueCategory(cat) : '',
            code: data.code || '',
            name: data.name || '',
            shortname: data.shortName || '',
            description: data.description || '',
            value: data.value || '',
            displayorder: data.displayOrder ?? 0,
            parentid: data.parentId || '',
            metadata_json: JSON.stringify(data.metadata || {}),
            issystem: action === 'create' ? false : (data.isSystem ?? false),
            isdefault: data.isDefault ?? false,
            status: data.status || 'active',
            organizationid: organizationId || '',
            isactive: data.isActive ?? true,
            createdby: action === 'create' ? userId : (data.createdBy || userId),
            updatedby: userId,
        };
    }

    public async getAll(): Promise<ReferenceValue[]> {
        const response = await apiClient.post<ActionRes<ReferenceValue[]>>(`${this.endpoint}/Select`, {
            item: {
                id: '',
                category: '',
                code: '',
                status: '',
                organizationid: this.getOrganizationId(),
            }
        });
        return response.data.item.map(this.mapFromServer);
    }

    public async getByCategory(category: string): Promise<ReferenceValue[]> {
        const response = await apiClient.post<ActionRes<ReferenceValue[]>>(`${this.endpoint}/Select`, {
            item: { category: category, organizationid: this.getOrganizationId() }
        });
        return response.data.item.map(this.mapFromServer);
    }

    public async create(data: Partial<ReferenceValue>): Promise<ReferenceValue> {
        const response = await apiClient.post<ActionRes<ReferenceValue>>(`${this.endpoint}/Save`, { item: this.mapToServer(data, 'create') });
        return this.mapFromServer(response.data.item);
    }

    public async update(data: Partial<ReferenceValue>): Promise<ReferenceValue> {
        if (data.isSystem) {
            throw new Error('System reference values cannot be changed.');
        }
        const response = await apiClient.post<ActionRes<ReferenceValue>>(`${this.endpoint}/Save`, { item: this.mapToServer(data, 'update') });
        return this.mapFromServer(response.data.item);
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: { id, organizationid: this.getOrganizationId(), updatedby: this.getUserId() }
        });
        return response.data.item;
    }
}

export const referenceValueService = ReferenceValueService.getInstance();
