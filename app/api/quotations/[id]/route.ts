import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
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
    .select({ id: quotations.id, quotationNo: quotations.quotationNo })
    .from(quotations)
    .where(eq(quotations.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const clientName = str(body?.clientName);
  const category = str(body?.category);
  const items: unknown[] = Array.isArray(body?.items) ? body.items : [];
  const mandatoryFees: unknown[] = Array.isArray(body?.mandatoryFees) ? body.mandatoryFees : [];
  const optionalServices: unknown[] = Array.isArray(body?.optionalServices) ? body.optionalServices : [];

  if (!clientName) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }

  const mapFeeRow = (item: unknown, index: number, section: "mandatory" | "optional") => {
    const record = item as Record<string, unknown>;
    const name = str(record?.name);
    const price = Number(record?.price);
    if (!name || !Number.isFinite(price)) return null;
    return {
      quotationId: id,
      sortOrder: index,
      description: name,
      classification: null,
      feeExclVat: String(price),
      scopeOfWork: null,
      duration: null,
      note: str(record?.note) || null,
      section,
    };
  };

  let rows: {
    quotationId: string;
    sortOrder: number;
    description: string;
    classification: string | null;
    feeExclVat: string;
    scopeOfWork: string | null;
    duration: string | null;
    note: string | null;
    section: string | null;
  }[];

  if (category) {
    const scopeFeeExclVat = Number(body?.scopeFeeExclVat);
    if (!Number.isFinite(scopeFeeExclVat)) {
      return NextResponse.json({ error: "Enter a valid Scope of Services fee." }, { status: 400 });
    }
    rows = [
      ...mandatoryFees.map((f, i) => mapFeeRow(f, i, "mandatory")).filter((r): r is NonNullable<typeof r> => r !== null),
      ...optionalServices.map((f, i) => mapFeeRow(f, i, "optional")).filter((r): r is NonNullable<typeof r> => r !== null),
    ];
  } else {
    rows = items
      .map((item, index) => {
        const record = item as Record<string, unknown>;
        const description = str(record?.description);
        const feeExclVat = Number(record?.feeExclVat);
        if (!description || !Number.isFinite(feeExclVat)) return null;
        return {
          quotationId: id,
          sortOrder: index,
          description,
          classification: str(record?.classification) || null,
          feeExclVat: String(feeExclVat),
          scopeOfWork: str(record?.scopeOfWork) || null,
          duration: str(record?.duration) || null,
          note: null,
          section: null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Add at least one valid line item." }, { status: 400 });
    }
  }

  const vatRatePercent = typeof body?.vatRatePercent === "number" ? body.vatRatePercent : 5;

  await db
    .update(quotations)
    .set({
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
      notes: str(body?.notes) || null,
      signatoryName: str(body?.signatoryName) || null,
      showStamp: Boolean(body?.showStamp),
      signatoryTitle: str(body?.signatoryTitle) || null,
      category: category || null,
      scopeItemsText: str(body?.scopeItemsText) || null,
      scopeFeeExclVat: category ? String(Number(body?.scopeFeeExclVat)) : null,
      exclusionsText: str(body?.exclusionsText) || null,
      acceptanceNote: str(body?.acceptanceNote) || null,
      status: str(body?.status) || undefined,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(quotations.id, id));

  // Line items are replaced wholesale on every save — a quotation is edited
  // as one document, not cell-by-cell like a checklist, so there's no
  // meaningful "partial" edit to preserve.
  await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
  await db.insert(quotationItems).values(rows);

  await logActivity({
    userId: auth.user.id,
    action: "quotation_updated",
    targetName: `${existing.quotationNo} — ${clientName}`,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [quotation] = await db
    .select({ quotationNo: quotations.quotationNo, clientName: quotations.clientName })
    .from(quotations)
    .where(eq(quotations.id, id))
    .limit(1);

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "quotation_deleted",
    targetName: `${quotation.quotationNo} — ${quotation.clientName ?? ""}`,
  });

  await db.delete(quotations).where(eq(quotations.id, id));

  return NextResponse.json({ success: true });
}
