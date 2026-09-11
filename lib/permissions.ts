import type { Role } from "@/lib/roles";
import { USER_MANAGEMENT_ROLES } from "@/lib/roles";

// Fixed, per role — does not depend on any setting
const ALWAYS: Record<string, readonly Role[]> = {
  "projects.view": ["master_admin", "admin", "finance", "staff"],
  "projects.create": ["master_admin", "admin", "staff"],
  "projects.edit": ["master_admin", "admin", "staff"],
  "projects.delete": ["master_admin", "admin"],
  "accounts.view": ["master_admin", "admin", "finance"],
  "accounts.edit": ["master_admin", "admin", "finance"],
  "users.manage": USER_MANAGEMENT_ROLES,
  "settings.manage": ["master_admin", "admin"],
};

export type Permission = keyof typeof ALWAYS;

// financeCanEditProjects comes from the app_settings row
// ('finance_can_edit_projects'), read once per request and passed in —
// this function itself never touches the database.
export function can(role: Role, permission: Permission, financeCanEditProjects = false): boolean {
  if (ALWAYS[permission].includes(role)) return true;

  if (role === "finance" && financeCanEditProjects) {
    if (permission === "projects.create" || permission === "projects.edit") return true;
  }

  return false;
}
