import apiClient, { ActionRes } from './api.service';
import { User } from '@/models/user.model';

export interface UserLoginReq {
    email: string;
    password: string;
}

export interface UserMobileLoginReq {
    mobile: string;
    /** Date of birth used as password (yyyy-MM-dd). */
    password: string;
    organizationId?: string;
}

export interface UserLoginRes {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    staffId?: string;
    studentId?: string;
    mobile?: string;
    /** Platform super admin — stored as `isfactory` in DB and localStorage. */
    isfactory?: boolean;
    isFactory?: boolean;
}

function parseIsFactory(raw: Record<string, unknown>): boolean {
  const v = raw.isfactory ?? raw.isFactory ?? raw.IsFactory;
  return v === true || v === "true" || v === 1 || v === "1";
}

export function mapUserLoginFromApi(raw: Record<string, unknown> | null | undefined): UserLoginRes {
  const item = raw ?? {};
  const isFactory = parseIsFactory(item);
  return {
    userId: String(item.userId ?? item.userid ?? item.user_id ?? ""),
    email: String(item.email ?? item.Email ?? ""),
    role: String(item.role ?? item.Role ?? ""),
    organizationId: String(
      item.organizationId ?? item.organizationid ?? item.organization_id ?? "",
    ),
    organizationName: String(item.organizationName ?? item.organizationname ?? ""),
    organizationSlug: String(item.organizationSlug ?? item.organizationslug ?? ""),
    staffId: String(item.staffId ?? item.staffid ?? ""),
    studentId: String(item.studentId ?? item.studentid ?? ""),
    mobile: String(item.mobile ?? item.Mobile ?? ""),
    isfactory: isFactory,
    isFactory,
  };
}

export interface UserProfileUpdateReq {
    userId: string;
    currentPassword: string;
    /** Omit or leave unchanged to keep current email. */
    newEmail?: string;
    /** Omit to keep current password. */
    newPassword?: string;
}

class UserService {
    private static instance: UserService;
    private readonly endpoint = '/user';

    private constructor() { }

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    public async search(email?: string, role?: string): Promise<User[]> {
        const response = await apiClient.post<ActionRes<User[]>>(`${this.endpoint}/Select`, {
            item: { email, role, organizationid: 1 }
        });
        return response.data.item;
    }

    public async create(data: Partial<User>): Promise<User> {
        const response = await apiClient.post<ActionRes<User>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }

    public async update(data: Partial<User>): Promise<User> {
        const response = await apiClient.post<ActionRes<User>>(`${this.endpoint}/Save`, { item: data });
        return response.data.item;
    }

    public async delete(id: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<boolean>>(`${this.endpoint}/Delete`, {
            item: { id: parseInt(id), organizationid: 1 }
        });
        return response.data.item;
    }

    public async login(data: UserLoginReq): Promise<UserLoginRes> {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(`${this.endpoint}/Login`, {
            item: data,
        });
        return mapUserLoginFromApi(response.data.item);
    }

    public async loginWithMobile(data: UserMobileLoginReq): Promise<UserLoginRes> {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            `${this.endpoint}/LoginWithMobile`,
            {
                item: {
                    mobile: data.mobile,
                    password: data.password,
                    organizationid: data.organizationId ?? "",
                },
            },
        );
        return mapUserLoginFromApi(response.data.item);
    }

    public async getSuperAdminFlag(email: string): Promise<boolean> {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            `${this.endpoint}/GetSuperAdminFlag`,
            { item: { email: email.trim() } },
        );
        const raw = response.data.item ?? {};
        return parseIsFactory(raw as Record<string, unknown>);
    }

    public async updateProfile(data: UserProfileUpdateReq): Promise<UserLoginRes> {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            `${this.endpoint}/UpdateProfile`,
            {
                item: {
                    userId: data.userId,
                    currentPassword: data.currentPassword,
                    newEmail: data.newEmail ?? "",
                    newPassword: data.newPassword ?? "",
                },
            },
        );
        return mapUserLoginFromApi(response.data.item);
    }
}

export const userService = UserService.getInstance();
