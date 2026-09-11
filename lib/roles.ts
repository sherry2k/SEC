// Single source of truth for roles and user statuses

export const ROLES = ["master_admin", "admin", "finance", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["pending", "approved", "rejected", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  master_admin: "Master admin",
  admin: "Admin",
  finance: "Finance",
  staff: "Staff",
};

// Roles that can open the Accounts (finance) section at all
export const FINANCE_ROLES: readonly Role[] = ["master_admin", "admin", "finance"];

// master_admin is a developer-only role: never offered in the User Management
// role dropdown, so nobody can promote themselves or anyone else into it from the UI.
export const ASSIGNABLE_ROLES: readonly Role[] = ["admin", "finance", "staff"];

// Roles allowed to open User Management and change anyone's role/status
export const USER_MANAGEMENT_ROLES: readonly Role[] = ["master_admin", "admin"];
