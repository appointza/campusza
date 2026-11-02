// User/Authentication Model
export type UserRole = "admin" | "staff" | "student" | "parent";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash: string; // Should be hashed in production
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  profileId: string; // Reference to Staff, Student, or Admin profile
  lastLoginAt?: string;
  lastLoginIp?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserPermission {
  id: string;
  role: UserRole;
  resource: string; // e.g., "students", "attendance", "grades"
  action: string; // e.g., "create", "read", "update", "delete"
  allowed: boolean;
  organizationId: string;
  isActive: boolean;
}

export interface RolePermission {
  role: UserRole;
  permissions: {
    resource: string;
    actions: string[];
  }[];
}

// Default role permissions
export const defaultRolePermissions: RolePermission[] = [
  {
    role: "admin",
    permissions: [
      { resource: "students", actions: ["create", "read", "update", "delete"] },
      { resource: "staff", actions: ["create", "read", "update", "delete"] },
      { resource: "classes", actions: ["create", "read", "update", "delete"] },
      { resource: "attendance", actions: ["create", "read", "update", "delete"] },
      { resource: "grades", actions: ["create", "read", "update", "delete"] },
      { resource: "fees", actions: ["create", "read", "update", "delete"] },
      { resource: "reports", actions: ["create", "read", "export"] },
      { resource: "settings", actions: ["read", "update"] },
    ],
  },
  {
    role: "staff",
    permissions: [
      { resource: "students", actions: ["read", "update"] },
      { resource: "classes", actions: ["read"] },
      { resource: "attendance", actions: ["create", "read", "update"] },
      { resource: "grades", actions: ["create", "read", "update"] },
      { resource: "schedule", actions: ["read"] },
    ],
  },
  {
    role: "student",
    permissions: [
      { resource: "profile", actions: ["read", "update"] },
      { resource: "grades", actions: ["read"] },
      { resource: "attendance", actions: ["read"] },
      { resource: "schedule", actions: ["read"] },
    ],
  },
  {
    role: "parent",
    permissions: [
      { resource: "children", actions: ["read"] },
      { resource: "grades", actions: ["read"] },
      { resource: "attendance", actions: ["read"] },
      { resource: "fees", actions: ["read", "update"] },
    ],
  },
];

// Helper functions
export const getUserRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: "Administrator",
    staff: "Staff Member",
    student: "Student",
    parent: "Parent/Guardian",
  };
  return labels[role];
};

export const getUserStatusColor = (status: UserStatus): string => {
  switch (status) {
    case "active": return "bg-green-100 text-green-700";
    case "inactive": return "bg-gray-100 text-gray-700";
    case "suspended": return "bg-red-100 text-red-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export const hasPermission = (
  role: UserRole,
  resource: string,
  action: string
): boolean => {
  const rolePerms = defaultRolePermissions.find((rp) => rp.role === role);
  if (!rolePerms) return false;

  const permission = rolePerms.permissions.find((p) => p.resource === resource);
  if (!permission) return false;

  return permission.actions.includes(action) || permission.actions.includes("*");
};

