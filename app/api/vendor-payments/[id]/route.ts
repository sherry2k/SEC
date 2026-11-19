import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorPayments } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { VENDOR_PAYMENT_STATUSES } from "@/lib/vendor-payment-status";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: vendorPayments.id }).from(vendorPayments).where(eq(vendorPayments.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const paymentDate = str(body?.paymentDate);
  const amount = Number(body?.amount);
  const status = str(body?.status);

  if (!paymentDate) {
    return NextResponse.json({ error: "Payment date is required." }, { status: 400 });
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Enter a payment amount greater than zero." }, { status: 400 });
  }

  await db
    .update(vendorPayments)
    .set({
      accountProjectId: str(body?.accountProjectId) || null,
      amount: String(amount),
      paymentDate,
      description: str(body?.description) || null,
      status: (VENDOR_PAYMENT_STATUSES as readonly string[]).includes(status) ? status : "pending",
    })
    .where(eq(vendorPayments.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "vendor_payment_updated",
    targetName: `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${paymentDate}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [payment] = await db
    .select({ amount: vendorPayments.amount, paymentDate: vendorPayments.paymentDate })
    .from(vendorPayments)
    .where(eq(vendorPayments.id, id))
    .limit(1);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "vendor_payment_deleted",
    targetName: `AED ${Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${payment.paymentDate}`,
  });

  await db.delete(vendorPayments).where(eq(vendorPayments.id, id));

  return NextResponse.json({ success: true });
}
