import apiClient, { ActionRes } from './api.service';
import { staffService } from './staff.service';
import { localDateYmd } from '@/utils/date';

export interface StaffHomeworkItem {
    id: string;
    classid: string;
    classname: string;
    subject: string;
    title: string;
    description: string;
    assigneddate: string;
    duedate: string;
    status: string;
}

export interface StaffHomeworkSlot {
    classid: string;
    classname: string;
    subject: string;
    time: string;
    room: string;
    homework: StaffHomeworkItem[];
}

export interface StaffHomeworkPage {
    staffid: string;
    date: string;
    slots: StaffHomeworkSlot[];
}

export interface AdminHomeworkItem {
    id: string;
    subject: string;
    title: string;
    description: string;
    staffid: string;
    staffname: string;
    assigneddate: string;
    duedate: string;
    status: string;
}

export interface AdminHomeworkSubjectGroup {
    subject: string;
    homework: AdminHomeworkItem[];
}

export interface AdminHomeworkClassCard {
    classid: string;
    classname: string;
    grade: string;
    section: string;
    subjects: AdminHomeworkSubjectGroup[];
}

export interface AdminHomeworkPage {
    date: string;
    classes: AdminHomeworkClassCard[];
}

export interface StudentHomeworkPage {
    studentid: string;
    studentname: string;
    classid: string;
    classname: string;
    grade: string;
    section: string;
    date: string;
    subjects: AdminHomeworkSubjectGroup[];
}

function getSessionEmail(): string {
    try {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return '';
        return String(JSON.parse(raw)?.email ?? '');
    } catch {
        return '';
    }
}

function getSessionStaffId(): string {
    try {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return '';
        const user = JSON.parse(raw) as { staffId?: string; staff_id?: string };
        return String(user?.staffId ?? user?.staff_id ?? '').trim();
    } catch {
        return '';
    }
}

function getSessionStudentId(): string {
    try {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return '';
        const user = JSON.parse(raw) as { studentId?: string; student_id?: string };
        return String(user?.studentId ?? user?.student_id ?? '').trim();
    } catch {
        return '';
    }
}

async function resolveStaffId(): Promise<string> {
    let staffid = getSessionStaffId();
    if (!staffid) staffid = await staffService.resolveStaffId();
    return staffid;
}

function mapHomeworkItem(item: Record<string, unknown>): StaffHomeworkItem {
    return {
        id: String(item.id ?? ''),
        classid: String(item.classid ?? ''),
        classname: String(item.classname ?? ''),
        subject: String(item.subject ?? ''),
        title: String(item.title ?? ''),
        description: String(item.description ?? ''),
        assigneddate: String(item.assigneddate ?? ''),
        duedate: String(item.duedate ?? ''),
        status: String(item.status ?? ''),
    };
}

function mapPage(data: Record<string, unknown>): StaffHomeworkPage {
    return {
        staffid: String(data?.staffid ?? ''),
        date: String(data?.date ?? ''),
        slots: Array.isArray(data?.slots)
            ? data.slots.map((row) => {
                const slot = row as Record<string, unknown>;
                return {
                    classid: String(slot.classid ?? ''),
                    classname: String(slot.classname ?? ''),
                    subject: String(slot.subject ?? ''),
                    time: String(slot.time ?? ''),
                    room: String(slot.room ?? ''),
                    homework: Array.isArray(slot.homework)
                        ? slot.homework.map((h) => mapHomeworkItem(h as Record<string, unknown>))
                        : [],
                };
            })
            : [],
    };
}

class HomeworkService {
    private static instance: HomeworkService;
    private readonly endpoint = '/campusza/homework';

    static getInstance(): HomeworkService {
        if (!HomeworkService.instance) HomeworkService.instance = new HomeworkService();
        return HomeworkService.instance;
    }

    async getAdminHomeworkPage(date = ''): Promise<AdminHomeworkPage> {
        const response = await apiClient.post<ActionRes<AdminHomeworkPage>>(`${this.endpoint}/GetAdminHomeworkPage`, {
            item: {
                organizationid: staffService.getOrganizationId(),
                date: date || localDateYmd(),
            },
        });
        const data = (response.data.item ?? {}) as Record<string, unknown>;
        return {
            date: String(data.date ?? ''),
            classes: Array.isArray(data.classes)
                ? data.classes.map((row) => {
                    const card = row as Record<string, unknown>;
                    return {
                        classid: String(card.classid ?? ''),
                        classname: String(card.classname ?? ''),
                        grade: String(card.grade ?? ''),
                        section: String(card.section ?? ''),
                        subjects: Array.isArray(card.subjects)
                            ? card.subjects.map((group) => {
                                const g = group as Record<string, unknown>;
                                return {
                                    subject: String(g.subject ?? ''),
                                    homework: Array.isArray(g.homework)
                                        ? g.homework.map((h) => {
                                            const item = h as Record<string, unknown>;
                                            return {
                                                id: String(item.id ?? ''),
                                                subject: String(item.subject ?? ''),
                                                title: String(item.title ?? ''),
                                                description: String(item.description ?? ''),
                                                staffid: String(item.staffid ?? ''),
                                                staffname: String(item.staffname ?? ''),
                                                assigneddate: String(item.assigneddate ?? ''),
                                                duedate: String(item.duedate ?? ''),
                                                status: String(item.status ?? ''),
                                            };
                                        })
                                        : [],
                                };
                            })
                            : [],
                    };
                })
                : [],
        };
    }

    async getStudentHomeworkPage(date = ''): Promise<StudentHomeworkPage> {
        const studentid = getSessionStudentId();
        const response = await apiClient.post<ActionRes<StudentHomeworkPage>>(`${this.endpoint}/GetStudentHomeworkPage`, {
            item: {
                organizationid: staffService.getOrganizationId(),
                studentid,
                date: date || localDateYmd(),
            },
        });
        const data = (response.data.item ?? {}) as Record<string, unknown>;
        return {
            studentid: String(data.studentid ?? ''),
            studentname: String(data.studentname ?? ''),
            classid: String(data.classid ?? ''),
            classname: String(data.classname ?? ''),
            grade: String(data.grade ?? ''),
            section: String(data.section ?? ''),
            date: String(data.date ?? ''),
            subjects: Array.isArray(data.subjects)
                ? data.subjects.map((group) => {
                    const g = group as Record<string, unknown>;
                    return {
                        subject: String(g.subject ?? ''),
                        homework: Array.isArray(g.homework)
                            ? g.homework.map((h) => {
                                const item = h as Record<string, unknown>;
                                return {
                                    id: String(item.id ?? ''),
                                    subject: String(item.subject ?? ''),
                                    title: String(item.title ?? ''),
                                    description: String(item.description ?? ''),
                                    staffid: String(item.staffid ?? ''),
                                    staffname: String(item.staffname ?? ''),
                                    assigneddate: String(item.assigneddate ?? ''),
                                    duedate: String(item.duedate ?? ''),
                                    status: String(item.status ?? ''),
                                };
                            })
                            : [],
                    };
                })
                : [],
        };
    }

    async getStaffHomeworkPage(date = ''): Promise<StaffHomeworkPage> {
        const staffid = await resolveStaffId();
        const response = await apiClient.post<ActionRes<StaffHomeworkPage>>(`${this.endpoint}/GetStaffHomeworkPage`, {
            item: {
                organizationid: staffService.getOrganizationId(),
                staffid,
                email: getSessionEmail(),
                date,
            },
        });
        return mapPage((response.data.item ?? {}) as Record<string, unknown>);
    }

    async save(data: {
        id?: string;
        classid: string;
        subject: string;
        title: string;
        description: string;
        assigneddate: string;
        duedate?: string;
    }): Promise<StaffHomeworkPage> {
        const staffid = await resolveStaffId();
        const response = await apiClient.post<ActionRes<StaffHomeworkPage>>(`${this.endpoint}/Save`, {
            item: {
                id: data.id ?? '',
                organizationid: staffService.getOrganizationId(),
                staffid,
                email: getSessionEmail(),
                classid: data.classid,
                subject: data.subject,
                title: data.title,
                description: data.description,
                assigneddate: data.assigneddate,
                duedate: data.duedate ?? '',
            },
        });
        return mapPage((response.data.item ?? {}) as Record<string, unknown>);
    }

    async delete(homeworkId: string, date: string): Promise<StaffHomeworkPage> {
        const staffid = await resolveStaffId();
        const response = await apiClient.post<ActionRes<StaffHomeworkPage>>(`${this.endpoint}/Delete`, {
            item: {
                delete: {
                    id: homeworkId,
                    organizationid: staffService.getOrganizationId(),
                },
                page: {
                    organizationid: staffService.getOrganizationId(),
                    staffid,
                    email: getSessionEmail(),
                    date,
                },
            },
        });
        return mapPage((response.data.item ?? {}) as Record<string, unknown>);
    }
}

export const homeworkService = HomeworkService.getInstance();
