import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorPayments } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { VENDOR_PAYMENT_STATUSES, VENDOR_PAYMENT_STATUS_LABELS, type VendorPaymentStatus } from "@/lib/vendor-payment-status";

// Single-purpose status route, same reasoning as /api/salary-slips/[id]/status.
// Marking a payment "Paid" is also what makes it count as a Third-Party
// Expenses expense in Income & Expenses (computed live — see
// lib/office-ledger.ts), so this is the one action that changes the books,
// not just the record.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !(VENDOR_PAYMENT_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: vendorPayments.id, amount: vendorPayments.amount, paymentDate: vendorPayments.paymentDate })
    .from(vendorPayments)
    .where(eq(vendorPayments.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  await db.update(vendorPayments).set({ status }).where(eq(vendorPayments.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "vendor_payment_updated",
    targetName: `AED ${Number(existing.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${existing.paymentDate} (status → ${VENDOR_PAYMENT_STATUS_LABELS[status as VendorPaymentStatus]})`,
  });

  return NextResponse.json({ success: true });
}
