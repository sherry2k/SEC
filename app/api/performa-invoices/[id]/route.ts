import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { performaInvoices, performaInvoiceItems } from "@/db/schema";
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
    .select({ id: performaInvoices.id, invoiceNo: performaInvoices.invoiceNo, issueDate: performaInvoices.issueDate })
    .from(performaInvoices)
    .where(eq(performaInvoices.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Performa invoice not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const customerName = str(body?.customerName);
  const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

  if (!customerName) {
    return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  }

  const rows = items
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const description = str(record?.description);
      const amount = Number(record?.amount);
      if (!description || !Number.isFinite(amount)) return null;
      return {
        invoiceId: id,
        sortOrder: index,
        itemDate: str(record?.itemDate) || null,
        description,
        amount: String(amount),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Add at least one valid line item." }, { status: 400 });
  }

  const vatRatePercent = typeof body?.vatRatePercent === "number" ? body.vatRatePercent : 5;

  await db
    .update(performaInvoices)
    .set({
      issueDate: str(body?.issueDate) || existing.issueDate,
      customerName,
      projectId: str(body?.projectId) || null,
      project: str(body?.project) || null,
      customerAddress: str(body?.customerAddress) || null,
      vatRatePercent: String(vatRatePercent),
      signatoryName: str(body?.signatoryName) || null,
      showStamp: Boolean(body?.showStamp),
      status: str(body?.status) || undefined,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(performaInvoices.id, id));

  await db.delete(performaInvoiceItems).where(eq(performaInvoiceItems.invoiceId, id));
  await db.insert(performaInvoiceItems).values(rows);

  await logActivity({
    userId: auth.user.id,
    action: "performa_invoice_updated",
    targetName: `${existing.invoiceNo} — ${customerName}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [invoice] = await db
    .select({ invoiceNo: performaInvoices.invoiceNo, customerName: performaInvoices.customerName })
    .from(performaInvoices)
    .where(eq(performaInvoices.id, id))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: "Performa invoice not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "performa_invoice_deleted",
    targetName: `${invoice.invoiceNo} — ${invoice.customerName ?? ""}`,
  });

  await db.delete(performaInvoices).where(eq(performaInvoices.id, id));

  return NextResponse.json({ success: true });
}
