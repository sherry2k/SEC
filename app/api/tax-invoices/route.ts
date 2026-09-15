import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { taxInvoices, taxInvoiceItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { nextDocumentCode } from "@/lib/sequences";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const clientName = str(body?.clientName);
    const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    const rows = items
      .map((item, index) => {
        const record = item as Record<string, unknown>;
        const description = str(record?.description);
        const amount = Number(record?.amount);
        if (!description || !Number.isFinite(amount)) return null;
        return {
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
    const invoiceNo = await nextDocumentCode("INV");

    const [invoice] = await db
      .insert(taxInvoices)
      .values({
        invoiceNo,
        issueDate: str(body?.issueDate) || new Date().toLocaleDateString("en-GB"),
        clientName,
        clientAddress: str(body?.clientAddress) || null,
        clientTrn: str(body?.clientTrn) || null,
        vatRatePercent: String(vatRatePercent),
        signatoryName: str(body?.signatoryName) || null,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await db.insert(taxInvoiceItems).values(rows.map((r) => ({ ...r, invoiceId: invoice.id })));

    await logActivity({
      userId: auth.user.id,
      action: "tax_invoice_created",
      targetName: `${invoice.invoiceNo} — ${clientName}`,
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    console.error("Create tax invoice error:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Try again." },
      { status: 500 }
    );
  }
}
