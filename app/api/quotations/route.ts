import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
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
        const feeExclVat = Number(record?.feeExclVat);
        if (!description || !Number.isFinite(feeExclVat)) return null;
        return {
          sortOrder: index,
          description,
          classification: str(record?.classification) || null,
          feeExclVat: String(feeExclVat),
          scopeOfWork: str(record?.scopeOfWork) || null,
          duration: str(record?.duration) || null,
          note: str(record?.note) || null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Add at least one valid line item." }, { status: 400 });
    }

    const vatRatePercent = typeof body?.vatRatePercent === "number" ? body.vatRatePercent : 5;
    const quotationNo = await nextDocumentCode("QUO");

    const [quotation] = await db
      .insert(quotations)
      .values({
        quotationNo,
        title: str(body?.title) || "Technical and Commercial Proposal",
        subtitle: str(body?.subtitle) || null,
        attention: str(body?.attention) || null,
        clientName,
        projectDescription: str(body?.projectDescription) || null,
        location: str(body?.location) || null,
        buildingConfig: str(body?.buildingConfig) || null,
        projectId: str(body?.projectId) || null,
        vatRatePercent: String(vatRatePercent),
        intro: str(body?.intro) || null,
        paymentTerms: str(body?.paymentTerms) || null,
        commercialConditions: str(body?.commercialConditions) || null,
        signatoryName: str(body?.signatoryName) || null,
        signatoryTitle: str(body?.signatoryTitle) || null,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await db.insert(quotationItems).values(rows.map((r) => ({ ...r, quotationId: quotation.id })));

    await logActivity({
      userId: auth.user.id,
      action: "quotation_created",
      targetName: `${quotation.quotationNo} — ${clientName}`,
    });

    return NextResponse.json({ success: true, quotation }, { status: 201 });
  } catch (error) {
    console.error("Create quotation error:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Try again." },
      { status: 500 }
    );
  }
}
