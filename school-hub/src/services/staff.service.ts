import apiClient, { ActionRes } from './api.service';
import { Staff } from '@/models/staff.model';

type StoredUser = {
    userId?: string;
    userid?: string | number;
    user_id?: string | number;
    staffId?: string;
    staff_id?: string;
    email?: string;
    role?: string;
    organizationId?: string;
    organizationid?: string;
    organization_id?: string;
};

class StaffService {
    private static instance: StaffService;
    private readonly endpoint = '/campusza/staff';

    private constructor() { }

    public static getInstance(): StaffService {
        if (!StaffService.instance) {
            StaffService.instance = new StaffService();
        }
        return StaffService.instance;
    }

    private getStoredUser(): StoredUser | null {
        const raw = localStorage.getItem('campusza_user');
        if (!raw) return null;
        try {
            return JSON.parse(raw) as StoredUser;
        } catch {
            return null;
        }
    }

    public getOrganizationId(): string {
        const user = this.getStoredUser();
        if (!user) return '';
        const record = user as Record<string, unknown>;
        const candidates = [
            record.organizationId,
            record.organizationid,
            record.organization_id,
            record.OrganizationId,
        ];
        for (const value of candidates) {
            if (value != null && String(value).trim() !== '') {
                return String(value).trim();
            }
        }
        return '';
    }

    public getSessionEmail(): string {
        const user = this.getStoredUser();
        if (!user) return '';
        const record = user as Record<string, unknown>;
        return String(record.email ?? record.Email ?? '').trim();
    }

    /** Returns staff table id from session (not user account id). */
    public getStaffId(): string {
        const user = this.getStoredUser();
        const raw =
            user?.staffId ??
            user?.staff_id ??
            user?.userId ??
            user?.userid ??
            user?.user_id;
        return raw != null && String(raw).trim() !== "" ? String(raw) : "";
    }

    /** Resolves staff.id with email fallback when session lacks staffId. */
    public async resolveStaffId(): Promise<string> {
        const user = this.getStoredUser();
        if (user?.staffId && String(user.staffId).trim()) return String(user.staffId);
        if (user?.staff_id && String(user.staff_id).trim()) return String(user.staff_id);

        if (user?.email) {
            try {
                const allStaff = await this.getAll();
                const byEmail = allStaff.find((s) => s.email === user.email);
                if (byEmail?.id) return byEmail.id;
            } catch {
                /* fall through */
            }
        }

        const direct = this.getStaffId();
        if (direct) {
            try {
                const allStaff = await this.getAll();
                if (allStaff.some((s) => s.id === direct)) return direct;
            } catch {
                /* fall through */
            }
        }
        return "";
    }

    private getActor(): string {
        const user = this.getStoredUser();
        return user?.userId || user?.email || 'system';
    }

    private mapFromServer(data: any): Staff {
        const subjectsSource = data?.subjects_json ?? data?.subjects;
        const subjects = typeof subjectsSource === 'string'
            ? JSON.parse(subjectsSource || '[]')
            : Array.isArray(subjectsSource) ? subjectsSource : [];

        return {
            id: data?.id,
            staffId: data?.staffid,
            firstName: data?.firstname,
            lastName: data?.lastname,
            fullName: data?.fullname || `${data?.firstname || ''} ${data?.lastname || ''}`.trim(),
            email: data?.email,
            phone: data?.phone,
            dateOfBirth: data?.dateofbirth,
            gender: data?.gender,
            address: data?.addressstreet || data?.addresscity || data?.addressstate || data?.addresscountry ? {
                street: data?.addressstreet || '',
                city: data?.addresscity || '',
                state: data?.addressstate || '',
                zipCode: data?.addresszipcode || '',
                country: data?.addresscountry || '',
            } : undefined,
            department: data?.department,
            role: data?.role,
            subjects,
            qualification: data?.qualification,
            experience: data?.experience,
            joiningDate: data?.joiningdate,
            status: data?.status,
            photoUrl: data?.photourl,
            emergencyContact: data?.emergencycontactname || data?.emergencycontactphone ? {
                name: data?.emergencycontactname || '',
                relationship: data?.emergencycontactrelationship || '',
                phone: data?.emergencycontactphone || '',
            } : undefined,
            salary: data?.salaryamount || data?.salarycurrency || data?.salarypaymentfrequency ? {
                amount: data?.salaryamount || 0,
                currency: data?.salarycurrency || '',
                paymentFrequency: data?.salarypaymentfrequency || 'monthly',
            } : undefined,
            organizationId: data?.organizationid,
            isActive: data?.isactive,
            createdAt: data?.createdat,
            updatedAt: data?.updatedat,
            createdBy: data?.createdby,
            updatedBy: data?.updatedby,
            generatedPassword: data?.generatedpassword || "",
        } as Staff;
    }

    private mapToServer(staff: Partial<Staff>): Record<string, unknown> {
        const actor = this.getActor();
        const organizationId = staff.organizationId || this.getOrganizationId();
        const fullName = staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
        const dateOfBirth = staff.dateOfBirth || '1970-01-01';
        const joiningDate = staff.joiningDate || new Date().toISOString();

        return {
            id: staff.id || '',
            staffid: staff.staffId || '',
            firstname: staff.firstName || '',
            lastname: staff.lastName || '',
            fullname: fullName || '',
            email: staff.email || '',
            phone: staff.phone || '',
            dateofbirth: dateOfBirth,
            gender: staff.gender || 'other',
            addressstreet: staff.address?.street || '',
            addresscity: staff.address?.city || '',
            addressstate: staff.address?.state || '',
            addresszipcode: staff.address?.zipCode || '',
            addresscountry: staff.address?.country || '',
            department: staff.department || '',
            role: staff.role || '',
            subjects_json: JSON.stringify(staff.subjects || []),
            qualification: staff.qualification || '',
            experience: staff.experience ?? 0,
            joiningdate: joiningDate,
            status: staff.status || 'active',
            photourl: staff.photoUrl || '',
            emergencycontactname: staff.emergencyContact?.name || '',
            emergencycontactrelationship: staff.emergencyContact?.relationship || '',
            emergencycontactphone: staff.emergencyContact?.phone || '',
            salaryamount: staff.salary?.amount ?? 0,
            salarycurrency: staff.salary?.currency || '',
            salarypaymentfrequency: staff.salary?.paymentFrequency || 'monthly',
            organizationid: organizationId,
            createdby: staff.createdBy || actor,
            updatedby: staff.updatedBy || actor,
        };
    }

    public async getAll(): Promise<Staff[]> {
        const response = await apiClient.post<ActionRes<Staff[]>>(`${this.endpoint}/Select`, {
            item: {
                id: '',
                organizationid: this.getOrganizationId(),
                department: '',
                role: '',
                status: ''
            }
        });
        return response.data.item.map(this.mapFromServer);
    }

    public async getById(id: string): Promise<Staff> {
        const response = await apiClient.post<ActionRes<Staff[]>>(`${this.endpoint}/Select`, {
            item: {
                id,
                organizationid: this.getOrganizationId(),
                department: '',
                role: '',
                status: ''
            }
        });
        return this.mapFromServer(response.data.item[0]);
    }

    public async create(staff: Partial<Staff>): Promise<Staff> {
        const response = await apiClient.post<ActionRes<Staff>>(`${this.endpoint}/Save`, { item: this.mapToServer(staff) });
        return this.mapFromServer(response.data.item);
    }

    public async update(staff: Partial<Staff>): Promise<Staff> {
        const response = await apiClient.post<ActionRes<Staff>>(`${this.endpoint}/Save`, { item: this.mapToServer(staff) });
        return this.mapFromServer(response.data.item);
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: { id, organizationid: this.getOrganizationId() }
        });
        return response.data.item;
    }
}

export const staffService = StaffService.getInstance();
