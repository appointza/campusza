import { ReactNode, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  LogOut, 
  ChevronDown,
  UserCircle,
} from "lucide-react";
import { SidebarNavItem } from "@/components/dashboard/SidebarNavItem";
import logo from "@/assets/logo.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNavItemsByRole, type UserRole } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { AdminSidebarNavMenu } from "@/components/dashboard/AdminSidebarNav";
import { StudentBottomNav } from "@/components/dashboard/StudentBottomNav";
import { onboardingService } from "@/services/onboarding.service";
import { clearAuthSession, isSuperAdminFromStorage, readAuthSessionOrClear } from "@/utils/auth-session";
import { useOrganizationBranding } from "@/hooks/use-organization-branding";

/** Prefer session email (login stores it on `campusza_user`); fall back to the prop from each page. */
function getSessionDisplayName(fallback: string): string {
  try {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) return fallback;
    const u = JSON.parse(raw) as { email?: string; username?: string };
    if (typeof u.username === "string" && u.username.trim()) {
      return u.username.trim();
    }
    const email = typeof u.email === "string" ? u.email.trim() : "";
    if (email && email.includes("@")) {
      return email.split("@")[0].replace(/[._-]+/g, " ").trim() || fallback;
    }
    if (email) return email;
  } catch {
    /* ignore */
  }
  return fallback;
}

function AppBrandMark({
  showSchoolBrand,
  schoolName,
  logoSrc,
  linkTo,
  imgClassName,
  titleClassName,
}: {
  showSchoolBrand: boolean;
  schoolName: string;
  logoSrc: string;
  linkTo: string;
  imgClassName: string;
  titleClassName: string;
}) {
  if (showSchoolBrand) {
    return (
      <Link to={linkTo} className="flex min-w-0 items-center gap-2.5">
        <img
          src={logoSrc || logo}
          alt=""
          className={imgClassName}
        />
        <span className={titleClassName} title={schoolName}>
          {schoolName}
        </span>
      </Link>
    );
  }

  return (
    <Link to={linkTo} className="flex items-center gap-2.5 min-w-0">
      <img src={logo} alt="Campusza" className={imgClassName} />
      <span className={titleClassName}>
        Campu<span className="text-primary">sza</span>
      </span>
    </Link>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  userName?: string;
}

export const DashboardLayout = ({ 
  children, 
  role, 
  userName = "User" 
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get navigation items based on role
  const navItems = getNavItemsByRole(role);

  const displayName = getSessionDisplayName(userName);
  const avatarInitial = (displayName || "?").charAt(0).toUpperCase();
  const session = readAuthSessionOrClear();

  useEffect(() => {
    if (role !== "admin" && role !== "admin_staff") return;
    if (isSuperAdminFromStorage()) return;
    if (onboardingService.isMarkedCompleteLocally()) return;
    let cancelled = false;
    onboardingService
      .getStatus()
      .then((status) => {
        if (cancelled) return;
        if (!status.complete) navigate("/admin/onboarding", { replace: true });
      })
      .catch(() => {
        /* stay on page if check fails */
      });
    return () => {
      cancelled = true;
    };
  }, [role, navigate, location.pathname]);

  if (!session) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const profileHref =
    role === "staff"
      ? "/staff/profile"
      : role === "student"
        ? "/student/profile"
        : "/admin/profile";

  const handleLogout = () => {
    onboardingService.clearLocalMark();
    clearAuthSession();
    navigate("/signin");
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case "admin": return "Administrator";
      case "admin_staff": return "Admin Staff";
      case "staff": return "Staff Member";
      case "student": return "Student";
      case "parent": return "Parent";
      default: return "User";
    }
  };

  const isStudent = role === "student";
  const studentMobileNav = isStudent;
  const { schoolName, logoSrc, showSchoolBrand } = useOrganizationBranding(isStudent);
  const studentBrandLink = "/student/homework";

  return (
    <div className={cn("min-h-screen bg-background", isStudent && "student-portal")}>
      {/* Mobile sidebar backdrop (not used for student — bottom nav instead) */}
      {sidebarOpen && !studentMobileNav && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop always; mobile drawer except student (bottom nav) */}
      <aside className={`
        fixed top-0 left-0 h-full w-[16.5rem] bg-sidebar border-r border-sidebar-border/80 z-50 
        transform transition-transform duration-300 ease-in-out
        ${studentMobileNav ? "hidden lg:block" : ""}
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="sidebar-panel flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border/80">
            <AppBrandMark
              showSchoolBrand={showSchoolBrand}
              schoolName={schoolName}
              logoSrc={logoSrc}
              linkTo={isStudent ? studentBrandLink : "/"}
              imgClassName="h-9 w-9 rounded-lg object-cover ring-1 ring-border/40"
              titleClassName="font-display font-bold text-[17px] tracking-tight text-foreground truncate"
            />
            <button 
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          {role === "admin" || role === "admin_staff" ? (
            <AdminSidebarNavMenu role={role} onNavigate={() => setSidebarOpen(false)} />
          ) : (
            <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))}
            </nav>
          )}

          {/* User section */}
          <div className="mt-auto border-t border-sidebar-border/80 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg p-2 outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-border"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {avatarInitial}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-[13px] font-medium text-foreground" title={displayName}>
                      {displayName}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{getRoleLabel(role)}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card">
                <DropdownMenuItem asChild>
                  <Link to={profileHref} className="cursor-pointer flex items-center">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[16.5rem]">
        {/* Top bar — mobile */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border lg:hidden">
          {studentMobileNav ? (
            <div className="flex h-12 items-center justify-between gap-2 px-4">
              <AppBrandMark
                showSchoolBrand={showSchoolBrand}
                schoolName={schoolName}
                logoSrc={logoSrc}
                linkTo={studentBrandLink}
                imgClassName="h-8 w-8 rounded-lg object-cover ring-1 ring-border/40"
                titleClassName="truncate font-display text-base font-bold tracking-tight text-foreground"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    {avatarInitial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuItem asChild>
                    <Link to={profileHref} className="cursor-pointer flex items-center">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center h-12 px-4">
              <button
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className={cn("p-4 lg:p-5", studentMobileNav && "pb-24")}>
          {children}
        </main>
      </div>

      {studentMobileNav ? <StudentBottomNav /> : null}
    </div>
  );
};
