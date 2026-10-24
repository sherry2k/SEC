import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { receiptVouchers } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { RECEIPT_VOUCHER_STATUSES, RECEIPT_VOUCHER_STATUS_LABELS, type ReceiptVoucherStatus } from "@/lib/receipt-voucher-status";

// Single-purpose status route — same reasoning as /api/quotations/[id]/status:
// the full-payload PATCH route is for the edit form and shouldn't be reused
// for a one-field change like this.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !(RECEIPT_VOUCHER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: receiptVouchers.id, voucherNo: receiptVouchers.voucherNo, toName: receiptVouchers.toName })
    .from(receiptVouchers)
    .where(eq(receiptVouchers.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Receipt voucher not found." }, { status: 404 });
  }

  await db
    .update(receiptVouchers)
    .set({ status, updatedBy: auth.user.id, updatedAt: new Date() })
    .where(eq(receiptVouchers.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "receipt_voucher_updated",
    targetName: `${existing.voucherNo} — ${existing.toName ?? ""} (status → ${RECEIPT_VOUCHER_STATUS_LABELS[status as ReceiptVoucherStatus]})`,
  });

  return NextResponse.json({ success: true });
}
