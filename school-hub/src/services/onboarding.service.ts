import { referenceValueService } from "@/services/reference-value.service";
import { termService } from "@/services/term.service";
import { staffService } from "@/services/staff.service";
import {
  getOnboardingStatus,
  onboardingDoneStorageKey,
  type OnboardingStatus,
} from "@/models/onboarding.model";

class OnboardingService {
  private static instance: OnboardingService;

  public static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  public getOrganizationId(): string {
    return staffService.getOrganizationId();
  }

  public markCompleteLocally(): void {
    const orgId = this.getOrganizationId();
    try {
      sessionStorage.setItem(onboardingDoneStorageKey(orgId), "1");
    } catch {
      /* ignore */
    }
  }

  public isMarkedCompleteLocally(): boolean {
    const orgId = this.getOrganizationId();
    try {
      return sessionStorage.getItem(onboardingDoneStorageKey(orgId)) === "1";
    } catch {
      return false;
    }
  }

  public clearLocalMark(): void {
    const orgId = this.getOrganizationId();
    try {
      sessionStorage.removeItem(onboardingDoneStorageKey(orgId));
    } catch {
      /* ignore */
    }
  }

  public async getStatus(): Promise<OnboardingStatus> {
    const [refs, terms] = await Promise.all([
      referenceValueService.getAll(),
      termService.getAll(),
    ]);
    const status = getOnboardingStatus(refs, terms.length);
    if (status.complete) this.markCompleteLocally();
    else this.clearLocalMark();
    return status;
  }
}

export const onboardingService = OnboardingService.getInstance();
