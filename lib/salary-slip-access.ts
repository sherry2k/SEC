import type { CurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

// Who can open a given Salary Slip: anyone with accounts.view (Admin/
// Finance, same as every other Accounts document) can see it regardless
// of status — they're the ones drafting and correcting it. The employee
// it was issued to can only see their own slip once it's "paid" — a
// draft may still have mistakes being fixed, so it stays invisible to
// them until it's final. Separate from the Permission map in
// lib/permissions.ts because this depends on the specific document (whose
// slip it is, and its status), not just the viewer's role.
export function canViewSalarySlip(user: CurrentUser, employeeId: number | null, status: string): boolean {
  if (can(user.role, "accounts.view")) return true;
  return employeeId !== null && employeeId === user.id && status === "paid";
}
