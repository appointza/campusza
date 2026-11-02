import apiClient, { ActionRes } from "./api.service";

export interface StudentGradePayload {
  id?: string;
  organizationid?: string;
  classid: string;
  termid: string;
  assessmentrefid: string;
  studentid: string;
  componentsjson: string;  // JSON array: [{key, label, weight, score}]
  finalweightedscore: number;
  finalpercentage: number;
  lettergrade: string;
  isactive?: boolean;
  createdby?: string;
  updatedby?: string;
}

class StudentGradeService {
  private static instance: StudentGradeService;
  private endpoint = "/campusza/studentgrade";

  static getInstance(): StudentGradeService {
    if (!StudentGradeService.instance) {
      StudentGradeService.instance = new StudentGradeService();
    }
    return StudentGradeService.instance;
  }

  async select(request: {
    organizationid?: string;
    classid?: string;
    termid?: string;
    assessmentrefid?: string;
    studentid?: string;
  }): Promise<StudentGradePayload[]> {
    const response = await apiClient.post<ActionRes<StudentGradePayload[]>>(
      `${this.endpoint}/Select`,
      { item: request }
    );
    return response.data.item || [];
  }

  async saveMany(grades: StudentGradePayload[]): Promise<boolean> {
    const response = await apiClient.post<ActionRes<boolean>>(
      `${this.endpoint}/SaveMany`,
      { item: grades }
    );
    return response.data.item || false;
  }
}

export const studentGradeService = StudentGradeService.getInstance();
