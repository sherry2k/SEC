import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendorPayments, vendors } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { VENDOR_PAYMENT_STATUSES } from "@/lib/vendor-payment-status";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const vendorId = str(body?.vendorId);
    const paymentDate = str(body?.paymentDate);
    const amount = Number(body?.amount);
    const status = str(body?.status);

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor is required." }, { status: 400 });
    }
    if (!paymentDate) {
      return NextResponse.json({ error: "Payment date is required." }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Enter a payment amount greater than zero." }, { status: 400 });
    }

    const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, vendorId)).limit(1);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const [payment] = await db
      .insert(vendorPayments)
      .values({
        vendorId,
        accountProjectId: str(body?.accountProjectId) || null,
        amount: String(amount),
        paymentDate,
        description: str(body?.description) || null,
        status: (VENDOR_PAYMENT_STATUSES as readonly string[]).includes(status) ? status : "pending",
        createdBy: auth.user.id,
      })
      .returning();

    await logActivity({
      userId: auth.user.id,
      action: "vendor_payment_created",
      targetName: `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${paymentDate}`,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    console.error("Create vendor payment error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
