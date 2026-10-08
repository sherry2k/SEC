import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentRenewals } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("document_renewals.edit");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const documentType = str(body?.documentType);
  const expiryDateStr = str(body?.expiryDate);
  const userId = typeof body?.userId === "number" ? body.userId : null;
  // extraStaffName only applies when there's no real account — mutually
  // exclusive with userId.
  const extraStaffName = userId === null ? str(body?.extraStaffName) || null : null;

  if (!documentType) {
    return NextResponse.json({ error: "Document type is required." }, { status: 400 });
  }
  if (!expiryDateStr || Number.isNaN(new Date(expiryDateStr).getTime())) {
    return NextResponse.json({ error: "Enter a valid expiry date." }, { status: 400 });
  }

  const issueDateStr = str(body?.issueDate);

  const [entry] = await db
    .insert(documentRenewals)
    .values({
      userId,
      extraStaffName,
      documentType,
      documentNumber: str(body?.documentNumber) || null,
      issueDate: issueDateStr && !Number.isNaN(new Date(issueDateStr).getTime()) ? new Date(issueDateStr) : null,
      expiryDate: new Date(expiryDateStr),
      notes: str(body?.notes) || null,
      createdBy: auth.user.id,
    })
    .returning();

  return NextResponse.json({ success: true, entry }, { status: 201 });
}
