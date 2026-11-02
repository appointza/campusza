import type { UserRole } from "@/config/navigation";
import { userService } from "@/services/user.service";

export type AuthSession = {
  userId?: string;
  email?: string;
  mobile?: string;
  role: string;
  organizationId?: string;
  /** Platform super admin (users.isfactory). */
  isFactory?: boolean;
};

const STORAGE_KEY = "campusza_user";

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function parseIsFactoryRaw(raw: Record<string, unknown>): boolean {
  const isFactoryRaw = raw.isfactory ?? raw.isFactory ?? raw.IsFactory;
  return (
    isFactoryRaw === true ||
    isFactoryRaw === "true" ||
    isFactoryRaw === 1 ||
    isFactoryRaw === "1"
  );
}

/** Full object from localStorage (includes org name, isfactory, etc.). */
export function readStoredAuthUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Normalize login API payload or stored JSON into a consistent session object. */
export function normalizeAuthUser(raw: Record<string, unknown>): AuthSession | null {
  const role = pickString(raw, ["role", "Role"]);
  if (!role) return null;

  const email = pickString(raw, ["email", "Email"]);
  const mobile = pickString(raw, ["mobile", "Mobile"]);
  const userId = pickString(raw, ["userId", "userid", "user_id", "UserId"]);
  const organizationId = pickString(raw, [
    "organizationId",
    "organizationid",
    "organization_id",
    "OrganizationId",
  ]);
  const isFactory = parseIsFactoryRaw(raw);

  if (!email && !mobile && !userId) return null;

  return {
    userId: userId || undefined,
    email: email || undefined,
    mobile: mobile || undefined,
    role,
    organizationId: organizationId || undefined,
    isFactory: isFactory || undefined,
  };
}

export function readAuthSession(): AuthSession | null {
  const stored = readStoredAuthUser();
  if (!stored) return null;
  return normalizeAuthUser(stored);
}

/** Like readAuthSession but removes corrupt storage so guards always send users to sign-in. */
export function readAuthSessionOrClear(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const session = readAuthSession();
  if (!session) {
    clearAuthSession();
  }
  return session;
}

/** Save login response (full user object) after normalizing required fields. */
export function persistAuthSession(loginPayload: Record<string, unknown>): AuthSession | null {
  const session = normalizeAuthUser(loginPayload);
  if (!session) return null;
  const isFactory = parseIsFactoryRaw(loginPayload) || Boolean(session.isFactory);
  const stored = {
    ...loginPayload,
    ...session,
    isfactory: isFactory,
    isFactory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return { ...session, isFactory: isFactory || undefined };
}

/** Patch super-admin flag into existing session (both key spellings for compatibility). */
export function patchAuthSessionSuperAdmin(isFactory: boolean): void {
  const stored = readStoredAuthUser();
  if (!stored) return;
  const next = {
    ...stored,
    isfactory: isFactory,
    isFactory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Reads `isfactory` / `isFactory` from localStorage (works even before normalize). */
export function isSuperAdminFromStorage(): boolean {
  const stored = readStoredAuthUser();
  if (!stored) return false;
  return parseIsFactoryRaw(stored);
}

/** Refresh isfactory from API and update localStorage (for sessions created before flag existed). */
export async function syncSuperAdminFlagFromApi(email: string): Promise<boolean> {
  const trimmed = email.trim();
  if (!trimmed) return false;
  try {
    const isFactory = await userService.getSuperAdminFlag(trimmed);
    patchAuthSessionSuperAdmin(isFactory);
    return isFactory;
  } catch {
    return isSuperAdminFromStorage();
  }
}

export function getSignInReturnPath(
  stateFrom: unknown,
  searchReturn: string | null | undefined
): string | null {
  const fromState = typeof stateFrom === "string" && stateFrom.startsWith("/") ? stateFrom : null;
  const fromQuery =
    typeof searchReturn === "string" && searchReturn.startsWith("/") ? searchReturn : null;
  return fromState || fromQuery;
}

export function resolvePostLoginPath(role: string, returnTo: string | null): string {
  if (isSuperAdminFromStorage()) {
    if (returnTo && returnTo.startsWith("/admin/platform")) return returnTo;
    return "/admin/platform";
  }
  if (returnTo && canAccessPath(returnTo, role)) {
    return returnTo;
  }
  return getDefaultHomePath(role);
}

export function isAuthenticated(): boolean {
  return readAuthSession() != null;
}

export function normalizeSessionRole(role: string): UserRole {
  const r = role.trim().toLowerCase();
  if (r === "admin" || r === "admin_staff" || r === "staff" || r === "student" || r === "parent") {
    return r;
  }
  if (r === "administrator") return "admin";
  return "staff";
}

export function isAdminRole(role: string): boolean {
  const r = normalizeSessionRole(role);
  return r === "admin" || r === "admin_staff";
}

export function isSuperAdmin(session: AuthSession | null | undefined): boolean {
  if (session?.isFactory) return true;
  return isSuperAdminFromStorage();
}

export function getDefaultHomePath(role: string): string {
  if (isSuperAdminFromStorage()) return "/admin/platform";
  const r = normalizeSessionRole(role);
  if (r === "admin" || r === "admin_staff") return "/admin";
  if (r === "student") return "/student/homework";
  if (r === "parent") return "/signin";
  return "/staff";
}

/** Whether a deep-link path is appropriate for the signed-in role. */
export function canAccessPath(pathname: string, role: string): boolean {
  const p = pathname.split("?")[0];
  if (isSuperAdminFromStorage()) {
    return p === "/admin/platform";
  }
  const r = normalizeSessionRole(role);
  if (r === "admin" || r === "admin_staff") return p.startsWith("/admin");
  if (r === "student") return p.startsWith("/student");
  if (r === "staff") return p.startsWith("/staff");
  return false;
}

export function sessionMatchesRoles(role: string, allowed: UserRole[]): boolean {
  const normalized = normalizeSessionRole(role);
  if (allowed.includes(normalized)) return true;
  if (
    allowed.includes("admin") &&
    (normalized === "admin" || normalized === "admin_staff")
  ) {
    return true;
  }
  return false;
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
