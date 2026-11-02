import apiClient, { ActionReq, ActionRes } from './api.service';
import { OrganizationSettings } from '@/models/settings.model';
// Note: importing from settings.model if it exists, otherwise organization.model might have settings too.
// Checking file locations... verified settings.model.ts exists.

class SettingsService {
    private static instance: SettingsService;
    private readonly endpoint = '/settings';

    private constructor() { }

    public static getInstance(): SettingsService {
        if (!SettingsService.instance) {
            SettingsService.instance = new SettingsService();
        }
        return SettingsService.instance;
    }

    public async getSettings(): Promise<OrganizationSettings> {
        const response = await apiClient.post<ActionRes<OrganizationSettings>>(`${this.endpoint}/Select`, {
            item: { organizationid: 1 }
        });
        return response.data.item;
    }

    public async updateSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
        const response = await apiClient.post<ActionRes<OrganizationSettings>>(`${this.endpoint}/Save`, { item: settings });
        return response.data.item;
    }
}

export const settingsService = SettingsService.getInstance();
