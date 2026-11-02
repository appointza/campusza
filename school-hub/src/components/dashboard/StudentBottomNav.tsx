import { Link, useLocation } from "react-router-dom";
import { studentNavItems } from "@/config/navigation";
import { isNavItemActive } from "@/config/nav-active";
import { cn } from "@/lib/utils";

/** Shorter labels for small bottom tabs */
const MOBILE_LABEL: Record<string, string> = {
  "/student/homework": "Home",
  "/student/exams": "Exams",
  "/student/exam-results": "Results",
  "/student/timetable": "Schedule",
  "/student/notifications": "Alerts",
  "/student/profile": "Profile",
};

export function StudentBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:hidden student-bottom-nav"
      aria-label="Student navigation"
    >
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {studentNavItems.map((item) => {
          const active = isNavItemActive(item.href, location.pathname);
          const label = MOBILE_LABEL[item.href] ?? item.label;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-medium transition-colors sm:text-[11px]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors [&_svg]:h-[1.35rem] [&_svg]:w-[1.35rem]",
                  active
                    ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                    : "text-muted-foreground",
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "truncate max-w-[4.5rem] leading-tight",
                  active && "font-semibold text-primary",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
