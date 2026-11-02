import apiClient, { ActionReq, ActionRes } from "./api.service";
import {
  AdmissionNumberSettings,
  mapAdmissionNumberFromApi,
} from "@/models/admission-number.model";
import { staffService } from "./staff.service";

class AdmissionNumberService {
  private static instance: AdmissionNumberService;

  static getInstance() {
    if (!AdmissionNumberService.instance) {
      AdmissionNumberService.instance = new AdmissionNumberService();
    }
    return AdmissionNumberService.instance;
  }

  private orgReq() {
    return {
      organizationid: staffService.getOrganizationId(),
      email: staffService.getSessionEmail(),
    };
  }

  async getSettings(): Promise<AdmissionNumberSettings> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      "/campusza/Page/GetAdmissionNumberSettings",
      { item: this.orgReq() }
    );
    return mapAdmissionNumberFromApi(response.data.item);
  }

  async saveSettings(settings: AdmissionNumberSettings): Promise<AdmissionNumberSettings> {
    const response = await apiClient.post<ActionRes<Record<string, unknown>>>(
      "/campusza/Page/SaveAdmissionNumberSettings",
      {
        item: {
          ...this.orgReq(),
          prefix: settings.prefix,
          suffix: settings.suffix,
          nextnumber: settings.nextNumber,
          padding: settings.padding,
          autogenerate: settings.autoGenerate,
        },
      }
    );
    return mapAdmissionNumberFromApi(response.data.item);
  }
}

export const admissionNumberService = AdmissionNumberService.getInstance();
