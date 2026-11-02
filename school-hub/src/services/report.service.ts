import apiClient, { ActionReq, ActionRes } from './api.service';
import { ReportCard } from '@/models/report.model';

class ReportService {
    private static instance: ReportService;
    private readonly endpoint = '/report';

    private constructor() { }

    public static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService();
        }
        return ReportService.instance;
    }

    public async generateReportCard(studentId: string, termId: string): Promise<ReportCard> {
        const response = await apiClient.post<ActionRes<ReportCard>>(`${this.endpoint}/Generate`, {
            item: { studentid: parseInt(studentId), termid: parseInt(termId), organizationid: 1 }
        });
        return response.data.item;
    }
}

export const reportService = ReportService.getInstance();
