import axios from "axios";
import apiClient, { ActionRes } from "./api.service";
import { staffService } from "./staff.service";
import { getSessionEmail } from "./page.service";

export interface AdminDashboardActivity {
    action: string;
    name: string;
    timeago: string;
}

export interface AdminDashboardPage {
    totalstudents: number;
    totalstaff: number;
    classestoday: number;
    attendancerate: string;
    recentactivities: AdminDashboardActivity[];
}

export interface PlatformOrganizationRow {
    id: string;
    name: string;
    slug: string;
    status: string;
    type: string;
    studentCount: number;
    staffCount: number;
    createdAt: string;
    adminName: string;
    adminMobile: string;
    studentPricing: PlatformStudentPricing;
}

export interface PlatformStudentPricingTerm {
    label: string;
    amount: number;
}

export interface PlatformStudentPricing {
    billingPeriod: "per_year" | "per_term";
    currencyCode: string;
    amountPerStudentYearly: number;
    termAmounts: PlatformStudentPricingTerm[];
}

export interface PlatformDashboardPage {
    totalOrganizations: number;
    totalSchools: number;
    organizations: PlatformOrganizationRow[];
}

const defaultTermAmounts = (): PlatformStudentPricingTerm[] => [
    { label: "1st Term", amount: 0 },
    { label: "2nd Term", amount: 0 },
    { label: "3rd Term", amount: 0 },
];

export const defaultPlatformStudentPricing = (): PlatformStudentPricing => ({
    billingPeriod: "per_year",
    currencyCode: "INR",
    amountPerStudentYearly: 0,
    termAmounts: defaultTermAmounts(),
});

function mapPricingFromServer(raw: unknown): PlatformStudentPricing {
    const data = (raw ?? {}) as Record<string, unknown>;
    const termsRaw = data.termamounts ?? data.term_amounts;
    const terms = Array.isArray(termsRaw)
        ? termsRaw.map((row) => {
            const item = row as Record<string, unknown>;
            return {
                label: String(item.label ?? ""),
                amount: Number(item.amount ?? 0),
            };
        })
        : defaultTermAmounts();

    const billing = String(data.billingperiod ?? data.billing_period ?? "per_year");
    return {
        billingPeriod: billing === "per_term" ? "per_term" : "per_year",
        currencyCode: String(data.currencycode ?? data.currency_code ?? "INR"),
        amountPerStudentYearly: Number(
            data.amountperstudentyearly ?? data.amount_per_student_yearly ?? 0,
        ),
        termAmounts: terms.length ? terms : defaultTermAmounts(),
    };
}

function mapPricingToServer(pricing: PlatformStudentPricing): Record<string, unknown> {
    return {
        billingperiod: pricing.billingPeriod,
        currencycode: pricing.currencyCode,
        amountperstudentyearly: pricing.amountPerStudentYearly,
        termamounts: pricing.termAmounts.map((t) => ({
            label: t.label,
            amount: t.amount,
        })),
    };
}

function mapPlatformFromServer(data: Record<string, unknown>): PlatformDashboardPage {
    const orgs = Array.isArray(data.organizations) ? data.organizations : [];
    return {
        totalOrganizations: Number(data.totalorganizations ?? 0),
        totalSchools: Number(data.totalschools ?? data.totalorganizations ?? 0),
        organizations: orgs.map((row) => {
            const item = row as Record<string, unknown>;
            return {
                id: String(item.id ?? ""),
                name: String(item.name ?? ""),
                slug: String(item.slug ?? ""),
                status: String(item.status ?? ""),
                type: String(item.type ?? ""),
                studentCount: Number(item.studentcount ?? item.student_count ?? 0),
                staffCount: Number(item.staffcount ?? item.staff_count ?? 0),
                createdAt: String(item.createdat ?? item.created_at ?? ""),
                adminName: String(item.adminname ?? item.admin_name ?? ""),
                adminMobile: String(item.adminmobile ?? item.admin_mobile ?? ""),
                studentPricing: mapPricingFromServer(item.studentpricing ?? item.student_pricing),
            };
        }),
    };
}

interface DashboardStatsDto {
    totalstudents?: number;
    totalstaff?: number;
    totalclasses?: number;
    attendancerate?: number;
    recentactivities?: Array<{
        action?: string;
        description?: string;
        timestamp?: string;
    }>;
}

function mapPageFromServer(data: Record<string, unknown>): AdminDashboardPage {
    return {
        totalstudents: Number(data?.totalstudents ?? 0),
        totalstaff: Number(data?.totalstaff ?? 0),
        classestoday: Number(data?.classestoday ?? 0),
        attendancerate: String(data?.attendancerate ?? "—"),
        recentactivities: Array.isArray(data?.recentactivities)
            ? data.recentactivities.map((row) => {
                const item = row as Record<string, unknown>;
                return {
                    action: String(item.action ?? ""),
                    name: String(item.name ?? item.description ?? ""),
                    timeago: String(item.timeago ?? ""),
                };
            })
            : [],
    };
}

function mapStatsToPage(stats: DashboardStatsDto): AdminDashboardPage {
    const rate = stats.attendancerate;
    const attendancerate =
        rate === undefined || rate === null || Number.isNaN(Number(rate))
            ? "—"
            : `${Number(rate)}%`;

    return {
        totalstudents: Number(stats.totalstudents ?? 0),
        totalstaff: Number(stats.totalstaff ?? 0),
        classestoday: Number(stats.totalclasses ?? 0),
        attendancerate,
        recentactivities: Array.isArray(stats.recentactivities)
            ? stats.recentactivities.map((row) => ({
                action: String(row.action ?? ""),
                name: String(row.description ?? ""),
                timeago: row.timestamp ? String(row.timestamp) : "",
            }))
            : [],
    };
}

function isNotFound(error: unknown) {
    return axios.isAxiosError(error) && error.response?.status === 404;
}

class DashboardService {
    private static instance: DashboardService;
    private readonly dashboardEndpoint = "/campusza/dashboard";
    private readonly pageEndpoint = "/campusza/page";

    private constructor() {}

    public static getInstance(): DashboardService {
        if (!DashboardService.instance) {
            DashboardService.instance = new DashboardService();
        }
        return DashboardService.instance;
    }

    public async getAdminDashboardPage(): Promise<AdminDashboardPage> {
        const item = { organizationid: staffService.getOrganizationId() };

        const paths = [
            `${this.pageEndpoint}/GetAdminDashboardPage`,
            `${this.dashboardEndpoint}/GetAdminDashboardPage`,
        ];

        for (const path of paths) {
            try {
                const response = await apiClient.post<ActionRes<AdminDashboardPage>>(path, { item });
                return mapPageFromServer((response.data.item ?? {}) as Record<string, unknown>);
            } catch (error) {
                if (!isNotFound(error)) throw error;
            }
        }

        try {
            const response = await apiClient.post<ActionRes<DashboardStatsDto>>(
                `${this.dashboardEndpoint}/GetStats`,
                { item: { organizationid: item.organizationid, role: "admin" } }
            );
            return mapStatsToPage(response.data.item ?? {});
        } catch (error) {
            if (isNotFound(error)) {
                throw new Error(
                    "Admin dashboard API is not available on this server. Deploy the latest Campusza.dll (not wwwroot only)."
                );
            }
            throw error;
        }
    }

    public async getPlatformDashboardPage(): Promise<PlatformDashboardPage> {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            `${this.pageEndpoint}/GetPlatformDashboardPage`,
            {
                item: {
                    organizationid: staffService.getOrganizationId(),
                    email: getSessionEmail(),
                },
            },
        );
        return mapPlatformFromServer((response.data.item ?? {}) as Record<string, unknown>);
    }

    public async savePlatformStudentPricing(
        organizationId: string,
        pricing: PlatformStudentPricing,
    ): Promise<PlatformStudentPricing> {
        const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
            `${this.pageEndpoint}/SavePlatformStudentPricing`,
            {
                item: {
                    email: getSessionEmail(),
                    organizationid: organizationId,
                    ...mapPricingToServer(pricing),
                },
            },
        );
        return mapPricingFromServer(response.data.item ?? {});
    }
}

export const dashboardService = DashboardService.getInstance();
