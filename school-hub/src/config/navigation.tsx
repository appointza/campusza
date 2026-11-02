import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  BookOpen,
  Settings,
  UserCircle,
  NotebookPen,
  TrendingUp,
  UsersRound,
  CalendarClock,
  Presentation,
  Shield,
  BellRing,
  ScrollText,
  Building2,
} from "lucide-react";
import { isNavItemActive } from "@/config/nav-active";

export { isNavItemActive } from "@/config/nav-active";

export type UserRole = "admin" | "admin_staff" | "staff" | "student" | "parent";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: UserRole[];
  /** Visible only when session has users.isfactory (platform super admin). */
  superAdminOnly?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: ReactNode;
  items: NavItem[];
}

export interface AdminSidebarNav {
  standalone: NavItem[];
  groups: NavGroup[];
}

const navIcon = (Icon: LucideIcon) => <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />;

/** Admin sidebar: grouped structure (see bussines.md — navigation). */
export const adminSidebarNav: AdminSidebarNav = {
  standalone: [
    {
      label: "Registered schools",
      href: "/admin/platform",
      icon: navIcon(Building2),
      roles: ["admin", "admin_staff"],
      superAdminOnly: true,
    },
    {
      label: "Dashboard",
      href: "/admin",
      icon: navIcon(LayoutDashboard),
      roles: ["admin", "admin_staff"],
    },
  ],
  groups: [
    {
      id: "people",
      label: "People & Students",
      icon: navIcon(UsersRound),
      items: [
        {
          label: "Students",
          href: "/admin/students",
          icon: navIcon(GraduationCap),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Staff",
          href: "/admin/staff",
          icon: navIcon(Users),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Promotion",
          href: "/admin/promotion",
          icon: navIcon(TrendingUp),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Classes",
          href: "/admin/classes",
          icon: navIcon(BookOpen),
          roles: ["admin", "admin_staff"],
        },
      ],
    },
    {
      id: "timetable",
      label: "Timetable & Scheduling",
      icon: navIcon(CalendarClock),
      items: [
        {
          label: "School Calendar",
          href: "/admin/school-calendar",
          icon: navIcon(CalendarDays),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Notifications",
          href: "/admin/notifications",
          icon: navIcon(BellRing),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Timetable",
          href: "/admin/schedule",
          icon: navIcon(CalendarRange),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Bell Schedule",
          href: "/admin/bell-schedule",
          icon: navIcon(BellRing),
          roles: ["admin", "admin_staff"],
        },
      ],
    },
    {
      id: "exams",
      label: "Exams",
      icon: navIcon(ScrollText),
      items: [
        {
          label: "Exam series",
          href: "/admin/exams",
          icon: navIcon(ClipboardList),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Exam marks",
          href: "/admin/exam-marks",
          icon: navIcon(NotebookPen),
          roles: ["admin", "admin_staff"],
        },
      ],
    },
    {
      id: "teaching",
      label: "Teaching & Attendance",
      icon: navIcon(Presentation),
      items: [
        {
          label: "Attendance",
          href: "/admin/attendance",
          icon: navIcon(ClipboardList),
          roles: ["admin", "admin_staff"],
        },
        {
          label: "Homework",
          href: "/admin/homework",
          icon: navIcon(NotebookPen),
          roles: ["admin", "admin_staff"],
        },
      ],
    },
    {
      id: "administration",
      label: "Administration",
      icon: navIcon(Shield),
      items: [
        {
          label: "Settings",
          href: "/admin/settings",
          icon: navIcon(Settings),
          roles: ["admin"],
        },
        {
          label: "My Profile",
          href: "/admin/profile",
          icon: navIcon(UserCircle),
          roles: ["admin", "admin_staff"],
        },
      ],
    },
  ],
};

function filterNavItems(items: NavItem[], role: UserRole, includeSuperAdmin: boolean): NavItem[] {
  return items.filter((item) => {
    if (includeSuperAdmin) {
      return item.superAdminOnly && (!item.roles || item.roles.includes(role));
    }
    if (item.superAdminOnly) return false;
    return !item.roles || item.roles.includes(role);
  });
}

export function getAdminSidebarNav(role: UserRole, includeSuperAdmin = false): AdminSidebarNav {
  if (includeSuperAdmin) {
    return {
      standalone: filterNavItems(adminSidebarNav.standalone, role, true),
      groups: [],
    };
  }
  return {
    standalone: filterNavItems(adminSidebarNav.standalone, role, false),
    groups: adminSidebarNav.groups
      .map((group) => ({
        ...group,
        items: filterNavItems(group.items, role, false),
      }))
      .filter((group) => group.items.length > 0),
  };
}

export function flattenAdminNav(role: UserRole, includeSuperAdmin = false): NavItem[] {
  const { standalone, groups } = getAdminSidebarNav(role, includeSuperAdmin);
  return [...standalone, ...groups.flatMap((g) => g.items)];
}

export function getNavGroupIdForPath(pathname: string, groups: NavGroup[]): string | null {
  for (const group of groups) {
    if (group.items.some((item) => isNavItemActive(item.href, pathname))) {
      return group.id;
    }
  }
  return null;
}

export const staffNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/staff",
    icon: navIcon(LayoutDashboard),
    roles: ["staff"],
  },
  {
    label: "Classes & attendance",
    href: "/staff/classes",
    icon: navIcon(ClipboardList),
    roles: ["staff"],
  },
  {
    label: "Timetable",
    href: "/staff/schedule",
    icon: navIcon(CalendarRange),
    roles: ["staff"],
  },
  {
    label: "Homework",
    href: "/staff/classes?tab=homework",
    icon: navIcon(NotebookPen),
    roles: ["staff"],
  },
  {
    label: "Students",
    href: "/staff/students",
    icon: navIcon(GraduationCap),
    roles: ["staff"],
  },
  {
    label: "Exam marks",
    href: "/staff/exam-marks",
    icon: navIcon(ClipboardList),
    roles: ["staff"],
  },
  {
    label: "Notifications",
    href: "/staff/notifications",
    icon: navIcon(BellRing),
    roles: ["staff"],
  },
  {
    label: "Profile",
    href: "/staff/profile",
    icon: navIcon(UserCircle),
    roles: ["staff"],
  },
];

export const studentNavItems: NavItem[] = [
  {
    label: "Homework",
    href: "/student/homework",
    icon: navIcon(NotebookPen),
    roles: ["student"],
  },
  {
    label: "Exam timetable",
    href: "/student/exams",
    icon: navIcon(ClipboardList),
    roles: ["student"],
  },
  {
    label: "Exam results",
    href: "/student/exam-results",
    icon: navIcon(NotebookPen),
    roles: ["student"],
  },
  {
    label: "Timetable",
    href: "/student/timetable",
    icon: navIcon(CalendarRange),
    roles: ["student"],
  },
  {
    label: "Notifications",
    href: "/student/notifications",
    icon: navIcon(BellRing),
    roles: ["student"],
  },
  {
    label: "Profile",
    href: "/student/profile",
    icon: navIcon(UserCircle),
    roles: ["student"],
  },
];

export const getNavItemsByRole = (role: UserRole): NavItem[] => {
  if (role === "admin" || role === "admin_staff") {
    return flattenAdminNav(role);
  }
  if (role === "staff") {
    return staffNavItems.filter((item) => !item.roles || item.roles.includes(role));
  }
  if (role === "student") {
    return studentNavItems.filter((item) => !item.roles || item.roles.includes(role));
  }
  return [];
};

export const hasAccessToRoute = (route: string, role: UserRole): boolean => {
  const navItems = getNavItemsByRole(role);
  const path = route.split("?")[0];
  return navItems.some(
    (item) => path === item.href.split("?")[0] || path.startsWith(`${item.href.split("?")[0]}/`)
  );
};
