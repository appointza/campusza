import apiClient, { ActionReq, ActionRes } from './api.service';
import { GradeBook, StudentGrade } from '@/models/grade.model';

class GradeService {
    private static instance: GradeService;
    private readonly endpoint = '/grade';

    private constructor() { }

    public static getInstance(): GradeService {
        if (!GradeService.instance) {
            GradeService.instance = new GradeService();
        }
        return GradeService.instance;
    }

    public async getGradeBook(classId: string, subjectId: string): Promise<GradeBook> {
        // Return type might need adjustment based on valid API response
        const response = await apiClient.post<ActionRes<GradeBook>>(`${this.endpoint}/GetGradeBook`, {
            item: { classid: parseInt(classId), subjectid: parseInt(subjectId), organizationid: 1 }
        });
        return response.data.item;
    }

    public async saveGrades(grades: StudentGrade[]): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/SaveGrades`, { item: grades });
        return response.data.item;
    }
}

export const gradeService = GradeService.getInstance();
