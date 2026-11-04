import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salarySlips } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { SALARY_SLIP_STATUSES, SALARY_SLIP_STATUS_LABELS, type SalarySlipStatus } from "@/lib/salary-slip-status";

// Single-purpose status route, same reasoning as /api/receipt-vouchers/[id]/status.
// Marking a slip "paid" is also what makes it count as a Salaries expense
// in Income & Expenses (computed live from paid slips — see lib/office-ledger.ts),
// so this is the one action that changes the books, not just the document.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !(SALARY_SLIP_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: salarySlips.id, slipNo: salarySlips.slipNo, employeeName: salarySlips.employeeName })
    .from(salarySlips)
    .where(eq(salarySlips.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Salary slip not found." }, { status: 404 });
  }

  await db
    .update(salarySlips)
    .set({ status, updatedBy: auth.user.id, updatedAt: new Date() })
    .where(eq(salarySlips.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "salary_slip_updated",
    targetName: `${existing.slipNo} — ${existing.employeeName} (status → ${SALARY_SLIP_STATUS_LABELS[status as SalarySlipStatus]})`,
  });

  return NextResponse.json({ success: true });
}
