import apiClient, { ActionRes } from "./api.service";

export interface ForgotPasswordReq {
  email: string;
}

export interface ForgotPasswordRes {
  message: string;
}

export interface ResetPasswordReq {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRes {
  message: string;
}

export interface CompleteInitialSetupReq {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CompleteInitialSetupRes {
  message: string;
}

export interface ValidateAuthTokenReq {
  token: string;
  purpose?: string;
}

export interface ValidateAuthTokenRes {
  valid: boolean;
  email?: string;
  emailVerified?: boolean;
  requiresEmailOtp?: boolean;
  message?: string;
}

export interface SendEmailOtpReq {
  token: string;
  purpose?: string;
}

export interface SendEmailOtpRes {
  message: string;
  cooldownSeconds: number;
}

export interface VerifyEmailOtpReq {
  token: string;
  otp: string;
  purpose?: string;
}

export interface VerifyEmailOtpRes {
  message: string;
  emailVerified: boolean;
}

export interface CheckSignInEmailRes {
  status: "none" | "ready" | "setup_required";
  message: string;
}

class AuthenticationService {
  private static instance: AuthenticationService;

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  async forgotPassword(email: string): Promise<ForgotPasswordRes> {
    const res = await apiClient.post<ActionRes<ForgotPasswordRes>>(
      "/campusza/Authentication/ForgotPassword",
      { item: { email } }
    );
    return res.data.item;
  }

  async checkSignInEmail(email: string): Promise<CheckSignInEmailRes> {
    const res = await apiClient.post<ActionRes<CheckSignInEmailRes>>(
      "/campusza/Authentication/CheckSignInEmail",
      { item: { email: email.trim() } }
    );
    return res.data.item ?? { status: "none", message: "" };
  }

  async resetPassword(payload: ResetPasswordReq): Promise<ResetPasswordRes> {
    const res = await apiClient.post<ActionRes<ResetPasswordRes>>(
      "/campusza/Authentication/ResetPassword",
      { item: payload }
    );
    return res.data.item;
  }

  async completeInitialSetup(payload: CompleteInitialSetupReq): Promise<CompleteInitialSetupRes> {
    const res = await apiClient.post<ActionRes<CompleteInitialSetupRes>>(
      "/campusza/Authentication/CompleteInitialSetup",
      { item: payload }
    );
    return res.data.item;
  }

  async validateToken(token: string, purpose?: string): Promise<ValidateAuthTokenRes> {
    const res = await apiClient.post<ActionRes<ValidateAuthTokenRes>>(
      "/campusza/Authentication/ValidateToken",
      { item: { token, purpose: purpose ?? "initial_setup" } }
    );
    return res.data.item;
  }

  async sendEmailOtp(token: string): Promise<SendEmailOtpRes> {
    const res = await apiClient.post<ActionRes<SendEmailOtpRes>>(
      "/campusza/Authentication/SendEmailOtp",
      { item: { token, purpose: "email_verification_otp" } }
    );
    return res.data.item;
  }

  async verifyEmailOtp(token: string, otp: string): Promise<VerifyEmailOtpRes> {
    const res = await apiClient.post<ActionRes<VerifyEmailOtpRes>>(
      "/campusza/Authentication/VerifyEmailOtp",
      { item: { token, otp, purpose: "email_verification_otp" } }
    );
    return res.data.item;
  }
}

export const authenticationService = AuthenticationService.getInstance();
