// Dashboard Model
export type DashboardWidgetType = 
  | "stat_card" 
  | "chart" 
  | "table" 
  | "list" 
  | "calendar" 
  | "progress" 
  | "activity_feed";

export type DashboardRole = "admin" | "staff" | "student" | "parent";

export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalClasses: number;
  attendanceRate: number;
  pendingTasks?: number;
  upcomingEvents?: number;
  recentActivities?: DashboardActivity[];
}

export interface DashboardActivity {
  id: string;
  action: string;
  entity: string;
  entityName: string;
  performedBy: string;
  performedByName?: string;
  timestamp: string;
  icon?: string;
  color?: string;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
  config: Record<string, unknown>;
  role: DashboardRole;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatCardData {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  color?: "primary" | "secondary" | "accent" | "purple" | "green" | "red" | "yellow" | "blue";
  subtitle?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export interface DashboardConfig {
  role: DashboardRole;
  widgets: DashboardWidget[];
  layout: "grid" | "list";
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Admin Dashboard specific stats
export interface AdminDashboardStats extends DashboardStats {
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
  collectionRate: number;
  totalReports: number;
  recentEnrollments: number;
  staffOnLeave: number;
  upcomingDeadlines: number;
}

// Staff Dashboard specific stats
export interface StaffDashboardStats extends DashboardStats {
  myStudents: number;
  myClasses: number;
  classesToday: number;
  attendanceMarked: number;
  attendancePending: number;
  nextClass?: {
    subject: string;
    className: string;
    time: string;
    minutesUntil: number;
  };
  pendingGrades: number;
  upcomingAssessments: number;
}

// Quick Action
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  url: string;
  color?: string;
  role: DashboardRole[];
  organizationId?: string;
}

// Recent Activity Feed Item
export interface ActivityFeedItem {
  id: string;
  type: "student_enrolled" | "attendance_marked" | "report_generated" | "staff_added" | "fee_paid" | "grade_entered" | "other";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// Helper functions
export const getActivityTypeIcon = (type: ActivityFeedItem["type"]): string => {
  const icons: Record<ActivityFeedItem["type"], string> = {
    student_enrolled: "GraduationCap",
    attendance_marked: "ClipboardCheck",
    report_generated: "FileText",
    staff_added: "UserPlus",
    fee_paid: "DollarSign",
    grade_entered: "BookOpen",
    other: "Activity",
  };
  return icons[type] || "Activity";
};

export const getActivityTypeColor = (type: ActivityFeedItem["type"]): string => {
  const colors: Record<ActivityFeedItem["type"], string> = {
    student_enrolled: "text-primary",
    attendance_marked: "text-green-600",
    report_generated: "text-blue-600",
    staff_added: "text-purple-600",
    fee_paid: "text-yellow-600",
    grade_entered: "text-accent",
    other: "text-muted-foreground",
  };
  return colors[type] || "text-muted-foreground";
};

export const formatStatValue = (value: number, type?: "currency" | "percentage" | "number"): string => {
  if (type === "currency") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }
  if (type === "percentage") {
    return `${value}%`;
  }
  if (type === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }
  return value.toString();
};

export const calculateTrend = (current: number, previous: number): { value: number; isPositive: boolean } => {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    isPositive: change >= 0,
  };
};

