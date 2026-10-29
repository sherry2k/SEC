import type { Role } from "@/lib/roles";
import { USER_MANAGEMENT_ROLES } from "@/lib/roles";

// Fixed, per role — does not depend on any setting
const ALWAYS: Record<string, readonly Role[]> = {
  "projects.view": ["master_admin", "admin", "finance", "staff"],
  "projects.create": ["master_admin", "admin", "staff"],
  "projects.edit": ["master_admin", "admin", "staff"],
  "projects.delete": ["master_admin", "admin", "staff"],
  "projects.reassign_responsible": ["master_admin", "admin"],
  "accounts.view": ["master_admin", "admin", "finance"],
  "accounts.edit": ["master_admin", "admin", "finance"],
  "users.manage": USER_MANAGEMENT_ROLES,
  "settings.manage": ["master_admin", "admin"],
  "attendance.view": ["master_admin", "admin", "finance"],
  "attendance.manage": ["master_admin", "admin", "finance"],
  // Admin and Finance can self check-in/out too, same as staff — only
  // master admin is purely a manager/reviewer of attendance, not a
  // check-in participant.
  "attendance.checkin": ["staff", "finance", "admin"],
  "daily_report.submit": ["staff"],
  "daily_report.view_all": ["master_admin", "admin"],
  // Everyone can submit a leave request for themselves, including
  // Admin/Master admin — only reviewing other people's requests is
  // restricted.
  "leave_requests.create": ["master_admin", "admin", "finance", "staff"],
  "leave_requests.review": ["master_admin", "admin"],
  "document_renewals.view": ["master_admin", "admin", "finance"],
  "document_renewals.edit": ["master_admin", "admin", "finance"],
  // Direct messages — every approved user can message any other, no role
  // restriction at all. Kept as a named permission (rather than skipping
  // the check) so the Messages page/API follow the same
  // requirePermission()/authorizePermissionApi() pattern as everything else.
  "messages.use": ["master_admin", "admin", "finance", "staff"],
};

export type Permission = keyof typeof ALWAYS;

// financeCanEditProjects comes from the app_settings row
// ('finance_can_edit_projects'), read once per request and passed in —
// this function itself never touches the database.
//
// canSubmitDailyReport is the per-user override from users.can_submit_daily_report
// — a one-off exception for a specific non-staff person (set in User
// Management), not a role-wide grant like the other permissions here.
export function can(
  role: Role,
  permission: Permission,
  financeCanEditProjects = false,
  canSubmitDailyReport = false
): boolean {
  if (ALWAYS[permission].includes(role)) return true;

  if (role === "finance" && financeCanEditProjects) {
    if (permission === "projects.create" || permission === "projects.edit") return true;
  }

  if (permission === "daily_report.submit" && canSubmitDailyReport) return true;

  return false;
}