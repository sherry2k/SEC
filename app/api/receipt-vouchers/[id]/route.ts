import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db
    .select({ id: receiptVouchers.id, voucherNo: receiptVouchers.voucherNo, issueDate: receiptVouchers.issueDate })
    .from(receiptVouchers)
    .where(eq(receiptVouchers.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Receipt voucher not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const toName = str(body?.toName);
  const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

  if (!toName) {
    return NextResponse.json({ error: "Recipient (To) is required." }, { status: 400 });
  }

  const rows = items
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const description = str(record?.description);
      const amount = Number(record?.amount);
      if (!description || !Number.isFinite(amount)) return null;
      return { voucherId: id, sortOrder: index, itemDate: str(record?.itemDate) || null, description, amount: String(amount) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Add at least one valid line item." }, { status: 400 });
  }

  const vatRatePercent = typeof body?.vatRatePercent === "number" ? body.vatRatePercent : 5;

  await db
    .update(receiptVouchers)
    .set({
      issueDate: str(body?.issueDate) || existing.issueDate,
      toName,
      project: str(body?.project) || null,
      location: str(body?.location) || null,
      vatRatePercent: String(vatRatePercent),
      signatoryName: str(body?.signatoryName) || null,
      status: str(body?.status) || undefined,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(receiptVouchers.id, id));

  await db.delete(receiptVoucherItems).where(eq(receiptVoucherItems.voucherId, id));
  await db.insert(receiptVoucherItems).values(rows);

  await logActivity({
    userId: auth.user.id,
    action: "receipt_voucher_updated",
    targetName: `${existing.voucherNo} — ${toName}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [voucher] = await db
    .select({ voucherNo: receiptVouchers.voucherNo, toName: receiptVouchers.toName })
    .from(receiptVouchers)
    .where(eq(receiptVouchers.id, id))
    .limit(1);

  if (!voucher) {
    return NextResponse.json({ error: "Receipt voucher not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "receipt_voucher_deleted",
    targetName: `${voucher.voucherNo} — ${voucher.toName ?? ""}`,
  });

  await db.delete(receiptVouchers).where(eq(receiptVouchers.id, id));

  return NextResponse.json({ success: true });
}
