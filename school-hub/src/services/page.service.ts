import apiClient, { ActionRes } from './api.service';
import { staffService } from './staff.service';
import { localDateYmd } from '@/utils/date';

export interface PageReq {
    organizationid?: string;
    staffid?: string;
    email?: string;
    /** yyyy-MM-dd — effective timetable for this date */
    date?: string;
}

export interface ReferenceValueItem {
    id: string;
    category: string;
    code: string;
    name: string;
    displayorder: number;
    status: string;
}

export function getSessionEmail(): string {
    try {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return '';
        const user = JSON.parse(raw) as Record<string, unknown>;
        return String(user?.email ?? user?.Email ?? '');
    } catch {
        return '';
    }
}

function orgReq(staffId = ''): PageReq {
    return {
        organizationid: staffService.getOrganizationId(),
        staffid: staffId,
        email: getSessionEmail(),
    };
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

async function staffPageReq(explicitStaffId = ''): Promise<PageReq> {
    let staffid = explicitStaffId.trim();
    if (!staffid) staffid = getSessionStaffId();
    if (!staffid) staffid = await staffService.resolveStaffId();
    return {
        organizationid: staffService.getOrganizationId(),
        staffid,
        email: getSessionEmail(),
    };
}

export function orgPageReq(staffId = ''): PageReq {
    return orgReq(staffId);
}

async function fetchPage<T>(endpoint: string, req: PageReq = orgReq()): Promise<T> {
    const response = await apiClient.post<ActionRes<T>>(`/campusza/page/${endpoint}`, { item: req });
    return response.data.item;
}

class PageService {
    private static instance: PageService;

    static getInstance(): PageService {
        if (!PageService.instance) PageService.instance = new PageService();
        return PageService.instance;
    }

    getStaffDashboardPage(staffId = '') {
        return staffPageReq(staffId).then((req) =>
            fetchPage<Record<string, unknown>>('GetStaffDashboardPage', req)
        );
    }

    getStaffClassesPage(staffId = '') {
        return staffPageReq(staffId).then((req) =>
            fetchPage<Record<string, unknown>>('GetStaffClassesPage', req)
        );
    }

    getStaffStudentsPage(staffId = '') {
        return staffPageReq(staffId).then((req) =>
            fetchPage<Record<string, unknown>>('GetStaffStudentsPage', req)
        );
    }

    getStaffSchedulePage(staffId = '', date = '') {
        return staffPageReq(staffId).then((req) =>
            fetchPage<Record<string, unknown>>('GetStaffSchedulePage', {
                ...req,
                date: date || localDateYmd(),
            })
        );
    }

    async getStudentTimetablePage(date = '') {
        let studentid = '';
        try {
            const raw = localStorage.getItem('campusza_user');
            if (raw) {
                const user = JSON.parse(raw) as { studentId?: string; student_id?: string };
                studentid = String(user?.studentId ?? user?.student_id ?? '').trim();
            }
        } catch {
            studentid = '';
        }
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            '/campusza/page/GetStudentTimetablePage',
            {
                item: {
                    organizationid: staffService.getOrganizationId(),
                    studentid,
                    date: date || localDateYmd(),
                },
            }
        );
        return response.data.item;
    }

    getAdminStudentsPage() {
        return fetchPage<Record<string, unknown>>('GetAdminStudentsPage', orgReq());
    }

    getAdminStaffPage() {
        return fetchPage<Record<string, unknown>>('GetAdminStaffPage', orgReq());
    }

    getAdminTermsPage() {
        return fetchPage<Record<string, unknown>>('GetAdminTermsPage', orgReq());
    }

    getAdminClassesPage() {
        return fetchPage<Record<string, unknown>>('GetAdminClassesPage', orgReq());
    }

    getAdminSettingsPage() {
        return fetchPage<Record<string, unknown>>('GetAdminSettingsPage', orgReq());
    }

    getOrganizationBranding() {
        return fetchPage<Record<string, unknown>>('GetOrganizationBranding', orgReq());
    }

    async saveOrganizationBranding(payload: Record<string, unknown>) {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            '/campusza/page/SaveOrganizationBranding',
            { item: payload }
        );
        return response.data.item;
    }

    getAdminOnboardingPage() {
        return fetchPage<Record<string, unknown>>('GetAdminOnboardingPage', orgReq());
    }

    getAdminExamsPage() {
        return fetchPage<Record<string, unknown>>('GetAdminExamsPage', orgReq());
    }

    async getStudentExamTimetablePage() {
        let studentid = '';
        try {
            const raw = localStorage.getItem('campusza_user');
            if (raw) {
                const user = JSON.parse(raw) as { studentId?: string; student_id?: string };
                studentid = String(user?.studentId ?? user?.student_id ?? '').trim();
            }
        } catch {
            studentid = '';
        }
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            '/campusza/page/GetStudentExamTimetablePage',
            {
                item: {
                    organizationid: staffService.getOrganizationId(),
                    studentid,
                },
            }
        );
        return response.data.item;
    }
}

export const pageService = PageService.getInstance();

export function mapReferenceValuesFromPage(items: unknown[]) {
    return (items || []).map((row) => {
        const item = row as Record<string, unknown>;
        return {
            id: String(item.id ?? ''),
            category: String(item.category ?? ''),
            code: String(item.code ?? ''),
            name: String(item.name ?? ''),
            displayOrder: Number(item.displayorder ?? 0),
            status: String(item.status ?? 'active'),
            isSystem: false,
            isDefault: false,
            isActive: true,
            organizationId: staffService.getOrganizationId(),
            createdAt: '',
            updatedAt: '',
        };
    });
}
