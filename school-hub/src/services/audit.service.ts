import apiClient, { ActionReq, ActionRes } from './api.service';
import { AuditLog, AuditFilter } from '@/models/audit.model';

class AuditService {
    private static instance: AuditService;
    private readonly endpoint = '/audit';

    private constructor() { }

    public static getInstance(): AuditService {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }

    public async getLogs(filter?: AuditFilter): Promise<AuditLog[]> {
        const response = await apiClient.post<ActionRes<AuditLog[]>>(`${this.endpoint}/Select`, {
            item: { ...filter, organizationid: 1 }
        });
        return response.data.item;
    }
}

export const auditService = AuditService.getInstance();
