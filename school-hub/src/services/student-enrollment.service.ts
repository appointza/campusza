import apiClient, { ActionRes } from "./api.service";
import { staffService } from "./staff.service";
import { studentService } from "./student.service";
import type { Student } from "@/models/student.model";
import type {
  StudentEnrollment,
  StudentEnrollmentWithProfile,
  StudentTransfer,
  PromoteStudentsRequest,
  TransferStudentRequest,
  CreateStudentWithEnrollmentRequest,
} from "@/models/student-enrollment.model";

class StudentEnrollmentService {
  private static instance: StudentEnrollmentService;
  private readonly endpoint = "/campusza/studentenrollment";

  private constructor() {}

  public static getInstance(): StudentEnrollmentService {
    if (!StudentEnrollmentService.instance) {
      StudentEnrollmentService.instance = new StudentEnrollmentService();
    }
    return StudentEnrollmentService.instance;
  }

  private getOrganizationId(): string {
    return staffService.getOrganizationId();
  }

  private mapEnrollmentFromServer(data: Record<string, unknown>): StudentEnrollment {
    return {
      id: String(data?.id ?? ""),
      organizationId: String(data?.organizationid ?? ""),
      studentId: String(data?.studentid ?? ""),
      academicYear: String(data?.academicyear ?? ""),
      classId: String(data?.classid ?? ""),
      className: String(data?.classname ?? ""),
      grade: String(data?.grade ?? ""),
      section: String(data?.section ?? ""),
      rollNumber: data?.rollnumber != null ? Number(data.rollnumber) : undefined,
      enrollmentStatus: (data?.enrollmentstatus ?? "enrolled") as StudentEnrollment["enrollmentStatus"],
      joinedDate: data?.joineddate ? String(data.joineddate).split("T")[0] : undefined,
      leftDate: data?.leftdate ? String(data.leftdate).split("T")[0] : undefined,
      status: (data?.status ?? "current") as StudentEnrollment["status"],
      isCurrent: Boolean(data?.iscurrent),
      termId: data?.termid ? String(data.termid) : undefined,
      termName: data?.termname ? String(data.termname) : undefined,
      isActive: data?.isactive !== false,
      createdAt: data?.createdat ? String(data.createdat) : undefined,
      updatedAt: data?.updatedat ? String(data.updatedat) : undefined,
      createdBy: data?.createdby ? String(data.createdby) : undefined,
      updatedBy: data?.updatedby ? String(data.updatedby) : undefined,
    };
  }

  private mapProfileFromServer(data: Record<string, unknown>): StudentEnrollmentWithProfile {
    return {
      enrollmentId: String(data?.enrollmentid ?? ""),
      studentId: String(data?.studentid ?? ""),
      admissionNumber: String(data?.admissionnumber ?? ""),
      firstName: String(data?.firstname ?? ""),
      lastName: String(data?.lastname ?? ""),
      fullName: String(data?.fullname ?? ""),
      email: String(data?.email ?? ""),
      phone: String(data?.phone ?? ""),
      academicYear: String(data?.academicyear ?? ""),
      classId: String(data?.classid ?? ""),
      className: String(data?.classname ?? ""),
      grade: String(data?.grade ?? ""),
      section: String(data?.section ?? ""),
      rollNumber: data?.rollnumber != null ? Number(data.rollnumber) : undefined,
      enrollmentStatus: String(data?.enrollmentstatus ?? ""),
      status: String(data?.status ?? ""),
      isCurrent: Boolean(data?.iscurrent),
      studentStatus: String(data?.studentstatus ?? ""),
      admissionDate: data?.admissiondate ? String(data.admissiondate).split("T")[0] : undefined,
      joinedDate: data?.joineddate ? String(data.joineddate).split("T")[0] : undefined,
    };
  }

  private mapTransferFromServer(data: Record<string, unknown>): StudentTransfer {
    return {
      id: String(data?.id ?? ""),
      organizationId: String(data?.organizationid ?? ""),
      studentId: String(data?.studentid ?? ""),
      enrollmentId: String(data?.enrollmentid ?? ""),
      fromClassId: String(data?.fromclassid ?? ""),
      fromClassName: String(data?.fromclassname ?? ""),
      fromSection: String(data?.fromsection ?? ""),
      toClassId: String(data?.toclassid ?? ""),
      toClassName: String(data?.toclassname ?? ""),
      toSection: String(data?.tosection ?? ""),
      reason: String(data?.reason ?? ""),
      effectiveDate: data?.effectivedate ? String(data.effectivedate).split("T")[0] : "",
      createdBy: String(data?.createdby ?? ""),
      createdAt: data?.createdat ? String(data.createdat) : "",
      isActive: data?.isactive !== false,
    };
  }

  public async select(filters?: {
    studentId?: string;
    academicYear?: string;
    classId?: string;
    section?: string;
    status?: string;
    isCurrent?: boolean;
  }): Promise<StudentEnrollment[]> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.endpoint}/Select`,
      {
        item: {
          organizationid: this.getOrganizationId(),
          studentid: filters?.studentId ?? "",
          academicyear: filters?.academicYear ?? "",
          classid: filters?.classId ?? "",
          section: filters?.section ?? "",
          status: filters?.status ?? "",
          iscurrent: filters?.isCurrent,
          id: "",
        },
      }
    );
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapEnrollmentFromServer(r));
  }

  public async selectWithProfile(filters?: {
    studentId?: string;
    academicYear?: string;
    classId?: string;
    section?: string;
    status?: string;
    isCurrent?: boolean;
  }): Promise<StudentEnrollmentWithProfile[]> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.endpoint}/SelectWithProfile`,
      {
        item: {
          organizationid: this.getOrganizationId(),
          studentid: filters?.studentId ?? "",
          academicyear: filters?.academicYear ?? "",
          classid: filters?.classId ?? "",
          section: filters?.section ?? "",
          status: filters?.status ?? "",
          iscurrent: filters?.isCurrent,
          id: "",
        },
      }
    );
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapProfileFromServer(r));
  }

  public async getCurrent(studentId: string): Promise<StudentEnrollment | null> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/GetCurrent`,
      {
        item: {
          organizationid: this.getOrganizationId(),
          studentid: studentId,
          id: "",
          academicyear: "",
          classid: "",
          section: "",
          status: "",
        },
      }
    );
    const raw = response.data.item;
    if (!raw) return null;
    return this.mapEnrollmentFromServer(raw);
  }

  public async getHistory(studentId: string): Promise<StudentEnrollment[]> {
    return this.select({ studentId });
  }

  public async getTransferHistory(studentId: string): Promise<StudentTransfer[]> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.endpoint}/GetTransferHistory`,
      {
        item: {
          organizationid: this.getOrganizationId(),
          studentid: studentId,
          id: "",
          academicyear: "",
          classid: "",
          section: "",
          status: "",
        },
      }
    );
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapTransferFromServer(r));
  }

  public async updateEnrollment(payload: {
    enrollmentId: string;
    rollNumber?: number;
  }): Promise<StudentEnrollment> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/UpdateEnrollment`,
      {
        item: {
          id: payload.enrollmentId,
          organizationid: this.getOrganizationId(),
          email: staffService.getSessionEmail(),
          rollnumber: payload.rollNumber,
        },
      }
    );
    return this.mapEnrollmentFromServer(response.data.item);
  }

  public async createStudentWithEnrollment(
    request: CreateStudentWithEnrollmentRequest
  ): Promise<Student> {
    const studentPayload = studentService.toServerPayload(request.student);
    const enrollmentPayload = {
      academicyear: request.enrollment.academicYear ?? "",
      classid: request.enrollment.classId ?? "",
      classname: request.enrollment.className ?? "",
      grade: request.enrollment.grade ?? "",
      section: request.enrollment.section ?? "",
      rollnumber: request.enrollment.rollNumber ?? 1,
      termid: request.enrollment.termId ?? "",
      termname: request.enrollment.termName ?? "",
      joineddate:
        request.enrollment.joinedDate ??
        request.student.admissionDate ??
        new Date().toISOString().split("T")[0],
      organizationid: this.getOrganizationId(),
    };

    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/CreateStudentWithEnrollment`,
      {
        item: {
          student: studentPayload,
          enrollment: enrollmentPayload,
          email: staffService.getSessionEmail(),
        },
      }
    );
    return studentService.parseFromServer(response.data.item);
  }

  public async promoteStudents(request: PromoteStudentsRequest): Promise<StudentEnrollment[]> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.endpoint}/PromoteStudents`,
      {
        item: {
          organizationid: request.organizationId || this.getOrganizationId(),
          fromacademicyear: request.fromAcademicYear,
          fromclassid: request.fromClassId,
          fromsection: request.fromSection,
          toacademicyear: request.toAcademicYear,
          toclassid: request.toClassId,
          toclassname: request.toClassName,
          tograde: request.toGrade,
          tosection: request.toSection,
          newtermid: request.newTermId ?? "",
          newtermname: request.newTermName ?? "",
          promotedby: request.promotedBy,
          notes: request.notes ?? "",
          students: request.students.map((s) => ({
            studentid: s.studentId,
            outcome: s.outcome,
            rollnumber: s.rollNumber,
          })),
        },
      }
    );
    const raw = response.data.item;
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.mapEnrollmentFromServer(r));
  }

  public async transferStudent(request: TransferStudentRequest): Promise<StudentEnrollment> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      `${this.endpoint}/TransferStudent`,
      {
        item: {
          organizationid: request.organizationId || this.getOrganizationId(),
          studentid: request.studentId,
          enrollmentid: request.enrollmentId,
          toclassid: request.toClassId,
          toclassname: request.toClassName,
          tograde: request.toGrade,
          tosection: request.toSection,
          rollnumber: request.rollNumber,
          reason: request.reason,
          effectivedate: request.effectiveDate,
        },
      }
    );
    return this.mapEnrollmentFromServer(response.data.item);
  }
}

export const studentEnrollmentService = StudentEnrollmentService.getInstance();
