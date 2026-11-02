import apiClient, { ActionReq, ActionRes } from './api.service';
import { Subject } from '@/models/subject.model';

class SubjectService {
    private static instance: SubjectService;
    private readonly endpoint = '/subject';

    private constructor() { }

    public static getInstance(): SubjectService {
        if (!SubjectService.instance) {
            SubjectService.instance = new SubjectService();
        }
        return SubjectService.instance;
    }

    public async getAll(): Promise<Subject[]> {
        const response = await apiClient.post<ActionRes<Subject[]>>(`${this.endpoint}/Select`, {
            item: { organizationid: 1 }
        });
        return response.data.item;
    }

    public async save(data: Partial<Subject>): Promise<Subject> {
        const response = await apiClient.post<ActionRes<Subject>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }
}

export const subjectService = SubjectService.getInstance();
