import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getAdminSidebarNav,
  isNavItemActive,
  getNavGroupIdForPath,
  type UserRole,
} from "@/config/navigation";
import { SidebarNavItem } from "@/components/dashboard/SidebarNavItem";
import { cn } from "@/lib/utils";
import {
  isSuperAdminFromStorage,
  readAuthSession,
  syncSuperAdminFlagFromApi,
} from "@/utils/auth-session";

const triggerFocus =
  "outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-0";

export function AdminSidebarNavMenu({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const location = useLocation();
  const [superAdmin, setSuperAdmin] = useState(() => isSuperAdminFromStorage());
  const { standalone, groups } = getAdminSidebarNav(role, superAdmin);
  const activeGroupId = getNavGroupIdForPath(location.pathname, groups);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeGroupId) initial[activeGroupId] = true;
    return initial;
  });

  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  useEffect(() => {
    const session = readAuthSession();
    const email = session?.email ?? "";
    if (!email) return;
    let cancelled = false;
    void syncSuperAdminFlagFromApi(email).then((flag) => {
      if (!cancelled) setSuperAdmin(flag);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="sidebar-nav-scroll flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
        {standalone.map((item) => (
          <SidebarNavItem key={item.href} item={item} onNavigate={onNavigate} />
        ))}

        {groups.length > 0 ? (
          <div className="mt-3 space-y-0.5 border-t border-sidebar-border/70 pt-3">
            {groups.map((group) => {
              const open = openGroups[group.id] ?? false;
              const groupHasActive = group.items.some((item) =>
                isNavItemActive(item.href, location.pathname)
              );
              return (
                <Collapsible
                  key={group.id}
                  open={open}
                  onOpenChange={(next) => setOpenGroups((prev) => ({ ...prev, [group.id]: next }))}
                >
                  <CollapsibleTrigger
                    className={cn(
                      triggerFocus,
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      "text-muted-foreground hover:bg-zinc-100 hover:text-foreground",
                      groupHasActive && "text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
                        groupHasActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {group.icon}
                    </span>
                    <span className="flex-1 truncate text-[13px] font-medium leading-snug">{group.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground/80 transition-transform duration-200",
                        open && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="ml-[1.125rem] border-l border-border/70 pl-2.5 space-y-0.5 pb-1 pt-0.5">
                      {group.items.map((item) => (
                        <SidebarNavItem key={item.href} item={item} onNavigate={onNavigate} nested />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
