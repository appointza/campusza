import apiClient, { ActionRes } from './api.service';
import { Organization } from '@/models/organization.model';

export interface OrganizationRegistrationReq {
    organizationName: string;
    organizationType: string;
    address: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    website: string;
    studentCount: string;
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
}

export interface OrganizationRegistrationRes {
    organizationId: string;
    adminUserId: string;
    slug: string;
}

class OrganizationService {
    private static instance: OrganizationService;
    private readonly endpoint = '/organization';

    private constructor() { }

    public static getInstance(): OrganizationService {
        if (!OrganizationService.instance) {
            OrganizationService.instance = new OrganizationService();
        }
        return OrganizationService.instance;
    }

    public async getById(id: string): Promise<Organization> {
        const response = await apiClient.post<ActionRes<Organization[]>>(`${this.endpoint}/Select`, {
            item: { id: parseInt(id) }
        });
        return response.data.item[0];
    }

    public async create(data: Partial<Organization>): Promise<Organization> {
        const response = await apiClient.post<ActionRes<Organization>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }

    public async update(data: Partial<Organization>): Promise<Organization> {
        const response = await apiClient.post<ActionRes<Organization>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }

    public async register(data: OrganizationRegistrationReq): Promise<OrganizationRegistrationRes> {
        const response = await apiClient.post<ActionRes<OrganizationRegistrationRes>>(`${this.endpoint}/Register`, { item: data });
        return response.data.item;
    }
}

export const organizationService = OrganizationService.getInstance();
