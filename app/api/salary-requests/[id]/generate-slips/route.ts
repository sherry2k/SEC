import { NextRequest, NextResponse } from "next/server";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems, salarySlips, salarySlipItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { nextDocumentCode } from "@/lib/sequences";
import { logActivity } from "@/lib/activity";

function todayFormatted(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// Turns every not-yet-generated item on this request into a real Draft
// Salary Slip — one "Net Salary" earning line equal to the requested
// amount (so the slip's Net Pay matches what was asked for exactly).
// Admin/Finance can still open each slip afterward and break the amount
// into proper earnings/deductions before marking it Paid, if needed.
// Safe to call more than once: only items with generatedSlipId still
// null are touched, so nothing is ever duplicated.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [reqRow] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!reqRow) {
    return NextResponse.json({ error: "Salary request not found." }, { status: 404 });
  }

  // Slips can only come from a request the GM has actually approved —
  // this is the server-side version of the same rule the view page uses
  // to decide whether to show the button at all.
  if (reqRow.status !== "approved") {
    return NextResponse.json({ error: "This request needs GM approval before Salary Slips can be generated." }, { status: 409 });
  }

  const pendingItems = await db
    .select()
    .from(salaryRequestItems)
    .where(and(eq(salaryRequestItems.requestId, id), isNull(salaryRequestItems.generatedSlipId)));

  if (pendingItems.length === 0) {
    return NextResponse.json({ error: "Every employee on this request already has a Salary Slip." }, { status: 400 });
  }

  const issueDate = todayFormatted();

  for (const item of pendingItems) {
    const slipNo = await nextDocumentCode("SAL");
    const [slip] = await db
      .insert(salarySlips)
      .values({
        slipNo,
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        designation: item.designation,
        payMonth: reqRow.payMonth,
        issueDate,
        notes: `Generated from salary request ${reqRow.requestNo}.`,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await db.insert(salarySlipItems).values({
      slipId: slip.id,
      sortOrder: 0,
      type: "earning",
      description: "Net Salary",
      amount: item.amount,
    });

    await db.update(salaryRequestItems).set({ generatedSlipId: slip.id }).where(eq(salaryRequestItems.id, item.id));
  }

  await db.update(salaryRequests).set({ status: "generated", updatedAt: new Date() }).where(eq(salaryRequests.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "salary_request_generated",
    targetName: `${reqRow.requestNo} (${pendingItems.length} slip${pendingItems.length === 1 ? "" : "s"})`,
  });

  return NextResponse.json({ success: true, generated: pendingItems.length });
}
