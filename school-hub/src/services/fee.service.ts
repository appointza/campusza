import apiClient, { ActionReq, ActionRes } from './api.service';
import { FeeStructure, StudentFee } from '@/models/fee.model';

class FeeService {
    private static instance: FeeService;
    private readonly endpoint = '/fee';

    private constructor() { }

    public static getInstance(): FeeService {
        if (!FeeService.instance) {
            FeeService.instance = new FeeService();
        }
        return FeeService.instance;
    }

    public async getFeeStructures(): Promise<FeeStructure[]> {
        const response = await apiClient.post<ActionRes<FeeStructure[]>>(`${this.endpoint}/SelectStructures`, {
            item: { organizationid: 1 }
        });
        return response.data.item;
    }

    public async getStudentFees(studentId: string): Promise<StudentFee[]> {
        const response = await apiClient.post<ActionRes<StudentFee[]>>(`${this.endpoint}/SelectStudentFees`, {
            item: { studentid: parseInt(studentId), organizationid: 1 }
        });
        return response.data.item;
    }

    public async saveStructure(data: Partial<FeeStructure>): Promise<FeeStructure> {
        const response = await apiClient.post<ActionRes<FeeStructure>>(`${this.endpoint}/SaveStructure`, { item: data });
        return response.data.item;
    }
}

export const feeService = FeeService.getInstance();
