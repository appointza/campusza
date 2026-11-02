import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isNavItemActive } from "@/config/nav-active";
import type { NavItem } from "@/config/navigation";

type SidebarNavItemProps = {
  item: NavItem;
  onNavigate?: () => void;
  nested?: boolean;
};

export function SidebarNavItem({ item, onNavigate, nested }: SidebarNavItemProps) {
  const location = useLocation();
  const active = isNavItemActive(item.href, location.pathname);

  return (
    <Link
      to={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg text-[13px] transition-colors duration-150",
        nested ? "py-2 px-2" : "px-3 py-2.5",
        active
          ? "bg-transparent font-medium text-primary"
          : "bg-transparent font-normal text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
      )}
      onClick={onNavigate}
    >
      <span
        className={cn(
          "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      >
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
