import { type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "@/config/navigation";
import {
  canAccessPath,
  getDefaultHomePath,
  isSuperAdminFromStorage,
  readAuthSessionOrClear,
  sessionMatchesRoles,
} from "@/utils/auth-session";

type RequireAuthProps = {
  allowedRoles: UserRole[];
};

/**
 * Platform super admin may only use `/admin/platform` (school admin screens hidden).
 */
export function AdminSchoolRouteGuard() {
  const location = useLocation();
  if (!isSuperAdminFromStorage()) {
    return <Outlet />;
  }
  const path = location.pathname.split("?")[0];
  if (path === "/admin/platform") {
    return <Outlet />;
  }
  return <Navigate to="/admin/platform" replace />;
}

/**
 * Blocks child routes when there is no `campusza_user` session.
 * Wrong role → home for that role; missing session → `/signin` with return URL.
 */
export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const location = useLocation();
  const session = readAuthSessionOrClear();
  const returnTo = location.pathname + location.search;

  if (!session) {
    return <Navigate to="/signin" replace state={{ from: returnTo }} />;
  }

  if (!sessionMatchesRoles(session.role, allowedRoles)) {
    return <Navigate to={getDefaultHomePath(session.role)} replace />;
  }

  return <Outlet />;
}

/** If already signed in, send user into the app instead of showing login again. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = readAuthSessionOrClear();
  const from = (location.state as { from?: string } | null)?.from;

  if (session) {
    const target =
      from && canAccessPath(from, session.role) ? from : getDefaultHomePath(session.role);
    return <Navigate to={target} replace />;
  }

  return children;
}
