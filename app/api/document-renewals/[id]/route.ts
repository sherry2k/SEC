import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { documentRenewals } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("document_renewals.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: documentRenewals.id }).from(documentRenewals).where(eq(documentRenewals.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const documentType = str(body?.documentType);
  const expiryDateStr = str(body?.expiryDate);

  if (!documentType) {
    return NextResponse.json({ error: "Document type is required." }, { status: 400 });
  }
  if (!expiryDateStr || Number.isNaN(new Date(expiryDateStr).getTime())) {
    return NextResponse.json({ error: "Enter a valid expiry date." }, { status: 400 });
  }

  const issueDateStr = str(body?.issueDate);

  await db
    .update(documentRenewals)
    .set({
      documentType,
      documentNumber: str(body?.documentNumber) || null,
      issueDate: issueDateStr && !Number.isNaN(new Date(issueDateStr).getTime()) ? new Date(issueDateStr) : null,
      expiryDate: new Date(expiryDateStr),
      notes: str(body?.notes) || null,
      updatedAt: new Date(),
    })
    .where(eq(documentRenewals.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("document_renewals.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: documentRenewals.id }).from(documentRenewals).where(eq(documentRenewals.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  await db.delete(documentRenewals).where(eq(documentRenewals.id, id));
  return NextResponse.json({ success: true });
}
