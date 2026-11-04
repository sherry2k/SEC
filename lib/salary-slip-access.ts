import type { CurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

// Who can open a given Salary Slip: anyone with accounts.view (Admin/
// Finance, same as every other Accounts document), OR the employee it
// was issued to, viewing their own. Separate from the Permission map in
// lib/permissions.ts because this depends on the specific document (whose
// slip it is), not just the viewer's role.
export function canViewSalarySlip(user: CurrentUser, employeeId: number | null): boolean {
  if (can(user.role, "accounts.view")) return true;
  return employeeId !== null && employeeId === user.id;
}
