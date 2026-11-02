import apiClient, { ActionReq, ActionRes } from './api.service';
import { Certificate } from '@/models/certificate.model';

class CertificateService {
    private static instance: CertificateService;
    private readonly endpoint = '/certificate';

    private constructor() { }

    public static getInstance(): CertificateService {
        if (!CertificateService.instance) {
            CertificateService.instance = new CertificateService();
        }
        return CertificateService.instance;
    }

    public async getAll(): Promise<Certificate[]> {
        const response = await apiClient.post<ActionRes<Certificate[]>>(`${this.endpoint}/Select`, {
            item: { organizationid: 1 }
        });
        return response.data.item;
    }

    public async save(data: Partial<Certificate>): Promise<Certificate> {
        const response = await apiClient.post<ActionRes<Certificate>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }
}

export const certificateService = CertificateService.getInstance();
