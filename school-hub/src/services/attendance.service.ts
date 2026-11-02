import apiClient, { ActionRes } from './api.service';
import { Attendance } from '@/models/attendance.model';
import { staffService } from './staff.service';

export interface StudentWithAttendanceItem {
    id: string;
    studentid: string;
    firstname: string;
    lastname: string;
    fullname: string;
    rollnumber: number;
    classid: string;
    classname: string;
    attendancestatus: string;
    attendanceid: string;
}

export interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
    total: number;
}

export interface StaffAttendanceClassOption {
    id: string;
    name: string;
}

export interface StaffAttendancePage {
    staffid: string;
    date: string;
    selectedclassid: string;
    selectedclassname: string;
    classes: StaffAttendanceClassOption[];
    students: StudentWithAttendanceItem[];
    summary: AttendanceSummary;
}

function mapStudentFromServer(data: Record<string, unknown>): StudentWithAttendanceItem {
    return {
        id: String(data?.id ?? ''),
        studentid: String(data?.studentid ?? ''),
        firstname: String(data?.firstname ?? ''),
        lastname: String(data?.lastname ?? ''),
        fullname: String(data?.fullname ?? ''),
        rollnumber: Number(data?.rollnumber ?? 0),
        classid: String(data?.classid ?? ''),
        classname: String(data?.classname ?? ''),
        attendancestatus: String(data?.attendancestatus ?? ''),
        attendanceid: String(data?.attendanceid ?? ''),
    };
}

function mapPageFromServer(data: Record<string, unknown>): StaffAttendancePage {
    const summary = (data?.summary ?? {}) as Record<string, unknown>;
    return {
        staffid: String(data?.staffid ?? ''),
        date: String(data?.date ?? ''),
        selectedclassid: String(data?.selectedclassid ?? ''),
        selectedclassname: String(data?.selectedclassname ?? ''),
        classes: Array.isArray(data?.classes)
            ? data.classes.map((c) => {
                const row = c as Record<string, unknown>;
                return { id: String(row.id ?? ''), name: String(row.name ?? '') };
            })
            : [],
        students: Array.isArray(data?.students)
            ? data.students.map((s) => mapStudentFromServer(s as Record<string, unknown>))
            : [],
        summary: {
            present: Number(summary.present ?? 0),
            absent: Number(summary.absent ?? 0),
            late: Number(summary.late ?? 0),
            total: Number(summary.total ?? 0),
        },
    };
}

class AttendanceService {
    private static instance: AttendanceService;
    private readonly endpoint = '/campusza/attendance';

    private constructor() { }

    public static getInstance(): AttendanceService {
        if (!AttendanceService.instance) {
            AttendanceService.instance = new AttendanceService();
        }
        return AttendanceService.instance;
    }

    private getOrganizationId(): string {
        return staffService.getOrganizationId();
    }

    private getSessionEmail(): string {
        try {
            const raw = localStorage.getItem('campusza_user');
            if (!raw) return '';
            return String(JSON.parse(raw)?.email ?? '');
        } catch {
            return '';
        }
    }

    private getSessionStaffId(): string {
        try {
            const raw = localStorage.getItem('campusza_user');
            if (!raw) return '';
            const user = JSON.parse(raw) as { staffId?: string; staff_id?: string };
            return String(user?.staffId ?? user?.staff_id ?? '').trim();
        } catch {
            return '';
        }
    }

    private async resolveStaffIdForRequest(explicitStaffId = ''): Promise<string> {
        let staffid = explicitStaffId.trim();
        if (!staffid) staffid = this.getSessionStaffId();
        if (!staffid) staffid = await staffService.resolveStaffId();
        return staffid;
    }

    private mapFromServer(data: Record<string, unknown>): Attendance {
        return {
            id: String(data?.id ?? ''),
            type: data?.type as Attendance['type'],
            date: String(data?.date ?? ''),
            classId: data?.classid ? String(data.classid) : undefined,
            className: data?.classname ? String(data.classname) : undefined,
            studentId: data?.studentid ? String(data.studentid) : undefined,
            studentName: data?.studentname ? String(data.studentname) : undefined,
            staffId: data?.staffid ? String(data.staffid) : undefined,
            staffName: data?.staffname ? String(data.staffname) : undefined,
            status: data?.status as Attendance['status'],
            checkInTime: data?.checkintime ? String(data.checkintime) : undefined,
            checkOutTime: data?.checkouttime ? String(data.checkouttime) : undefined,
            remarks: data?.remarks ? String(data.remarks) : undefined,
            markedBy: String(data?.markedby ?? ''),
            markedAt: String(data?.markedat ?? ''),
            organizationId: String(data?.organizationid ?? ''),
            isActive: Boolean(data?.isactive ?? true),
            createdAt: String(data?.createdat ?? ''),
            updatedAt: String(data?.updatedat ?? ''),
        };
    }

    public async getStaffAttendancePage(classId: string, date: string, staffId?: string): Promise<StaffAttendancePage> {
        const resolvedStaffId = await this.resolveStaffIdForRequest(staffId ?? '');
        const response = await apiClient.post<ActionRes<StaffAttendancePage>>(
            `${this.endpoint}/GetStaffAttendancePage`,
            {
                item: {
                    organizationid: this.getOrganizationId(),
                    staffid: resolvedStaffId,
                    email: this.getSessionEmail(),
                    classid: classId,
                    date,
                },
            }
        );
        return mapPageFromServer((response.data.item ?? {}) as Record<string, unknown>);
    }

    public async saveBulk(classId: string, date: string, items: { studentid: string; status: string }[]): Promise<StaffAttendancePage> {
        const resolvedStaffId = await this.resolveStaffIdForRequest('');
        const response = await apiClient.post<ActionRes<StaffAttendancePage>>(
            `${this.endpoint}/SaveBulk`,
            {
                item: {
                    organizationid: this.getOrganizationId(),
                    staffid: resolvedStaffId,
                    email: this.getSessionEmail(),
                    classid: classId,
                    date,
                    items,
                },
            }
        );
        return mapPageFromServer((response.data.item ?? {}) as Record<string, unknown>);
    }

    /** @deprecated Use getStaffAttendancePage for staff UI */
    public async getStudentsWithAttendance(classId: string, date: string): Promise<StudentWithAttendanceItem[]> {
        const page = await this.getStaffAttendancePage(classId, date);
        return page.students;
    }

    public async getByTypeAndDate(type: Attendance['type'], date: string, classId?: string): Promise<Attendance[]> {
        const response = await apiClient.post<ActionRes<Attendance[]>>(`${this.endpoint}/Select`, {
            item: {
                id: '',
                organizationid: this.getOrganizationId(),
                classid: classId || '',
                studentid: '',
                staffid: '',
                type,
                fromdate: date,
                todate: date,
            }
        });
        return (response.data.item || []).map((row) => this.mapFromServer(row as Record<string, unknown>));
    }

    public async save(data: Partial<Attendance>): Promise<Attendance> {
        const item: Record<string, unknown> = {
            id: data.id || '',
            type: data.type || '',
            date: data.date || '',
            classid: data.classId || '',
            classname: data.className || '',
            studentid: data.studentId || '',
            studentname: data.studentName || '',
            staffid: data.staffId || '',
            staffname: data.staffName || '',
            status: data.status || '',
            checkintime: data.checkInTime || '',
            checkouttime: data.checkOutTime || '',
            remarks: data.remarks || '',
            markedby: data.markedBy || '',
            organizationid: data.organizationId || this.getOrganizationId(),
            isactive: data.isActive ?? true,
        };
        // Omit empty datetime fields — backend rejects "" for DateTime properties
        if (data.markedAt) item.markedat = data.markedAt;

        const response = await apiClient.post<ActionRes<Attendance>>(`${this.endpoint}/Save`, { item });
        return this.mapFromServer((response.data.item ?? {}) as Record<string, unknown>);
    }
}

export const attendanceService = AttendanceService.getInstance();
