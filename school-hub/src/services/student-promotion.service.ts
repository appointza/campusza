import apiClient, { ActionRes } from "./api.service";
import type {
  StudentAcademicHistory,
  StudentPromotion,
} from "@/models/student-promotion.model";

class StudentPromotionService {
  private static instance: StudentPromotionService;
  private endpoint = "/campusza/studentpromotion";

  private constructor() {}

  public static getInstance(): StudentPromotionService {
    if (!StudentPromotionService.instance) {
      StudentPromotionService.instance = new StudentPromotionService();
    }
    return StudentPromotionService.instance;
  }

  // Get academic history for a student
  public async getAcademicHistory(
    studentId: string,
    organizationId: string
  ): Promise<StudentAcademicHistory[]> {
    const response = await apiClient.post<ActionRes<StudentAcademicHistory[]>>(
      `${this.endpoint}/GetAcademicHistory`,
      {
        item: {
          studentid: studentId,
          organizationid: organizationId,
          id: "",
          academicyear: "",
          grade: "",
          classid: "",
        },
      }
    );
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapAcademicHistoryFromServer(r));
  }

  // Get all promotions with optional filters
  public async selectPromotions(filters?: {
    organizationId?: string;
    studentId?: string;
    academicYear?: string;
  }): Promise<StudentPromotion[]> {
    const response = await apiClient.post<ActionRes<StudentPromotion[]>>(
      `${this.endpoint}/SelectPromotions`,
      {
        item: {
          organizationid: filters?.organizationId || "",
          studentid: filters?.studentId || "",
          academicyear: filters?.academicYear || "",
          id: "",
          grade: "",
          classid: "",
        },
      }
    );
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapFromServer(r));
  }

  private mapAcademicHistoryFromServer(data: any): StudentAcademicHistory {
    return {
      id: data?.id || "",
      organizationId: data?.organizationid || "",
      studentId: data?.studentid || "",
      academicYear: data?.academicyear || "",
      grade: data?.grade || "",
      classId: data?.classid || "",
      className: data?.classname || "",
      section: data?.section || "",
      rollNumber: data?.rollnumber ?? undefined,
      totalMarks: data?.totalmarks !== undefined && data?.totalmarks !== null ? Number(data.totalmarks) : undefined,
      percentage: data?.percentage !== undefined && data?.percentage !== null ? Number(data.percentage) : undefined,
      gpa: data?.gpa !== undefined && data?.gpa !== null ? Number(data.gpa) : undefined,
      gradeLetter: data?.gradeletter || "",
      promotionStatus: (data?.promotionstatus || "current") as StudentAcademicHistory["promotionStatus"],
      promotionDate: data?.promotiondate || undefined,
      isActive: data?.isactive ?? true,
      createdAt: data?.createdat || "",
      updatedAt: data?.updatedat || "",
      createdBy: data?.createdby || "",
      updatedBy: data?.updatedby || "",
    };
  }

  // Map from server snake_case to frontend camelCase
  private mapFromServer(data: any): StudentPromotion {
    return {
      id: data?.id || "",
      organizationId: data?.organizationid || "",
      studentId: data?.studentid || "",
      studentName: data?.studentname || "",
      fromGrade: data?.fromgrade || "",
      fromClassId: data?.fromclassid || "",
      fromClassName: data?.fromclassname || "",
      toGrade: data?.tograde || "",
      toClassId: data?.toclassid || "",
      toClassName: data?.toclassname || "",
      academicYearFrom: data?.academicyearfrom || "",
      academicYearTo: data?.academicyearto || "",
      finalPercentage: data?.finalpercentage,
      gpa: data?.gpa,
      promotionType: data?.promotiontype || "promoted",
      promotionDate: data?.promotiondate || "",
      promotedBy: data?.promotedby || "",
      notes: data?.notes || "",
      isActive: data?.isactive ?? true,
      createdAt: data?.createdat || "",
      updatedAt: data?.updatedat || "",
      createdBy: data?.createdby || "",
      updatedBy: data?.updatedby || "",
    };
  }
}

export const studentPromotionService =
  StudentPromotionService.getInstance();
