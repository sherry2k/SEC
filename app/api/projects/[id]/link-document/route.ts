import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations, taxInvoices, performaInvoices, receiptVouchers, invoices } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { touchProject } from "@/lib/activity";

const DOC_TABLES = {
  quotation: quotations,
  tax_invoice: taxInvoices,
  performa_invoice: performaInvoices,
  receipt_voucher: receiptVouchers,
  invoice: invoices,
} as const;
type DocType = keyof typeof DOC_TABLES;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;
  const body = await request.json().catch(() => null);
  const docType = body?.docType as DocType | undefined;
  const documentId = typeof body?.documentId === "string" ? body.documentId : "";

  if (!docType || !(docType in DOC_TABLES) || !documentId) {
    return NextResponse.json({ error: "Missing document type or document." }, { status: 400 });
  }

  const table = DOC_TABLES[docType];
  const result = await db
    .update(table)
    .set({ projectId, updatedBy: auth.user.id, updatedAt: new Date() } as never)
    .where(eq(table.id, documentId))
    .returning({ id: table.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  await touchProject(projectId, auth.user.id);

  return NextResponse.json({ success: true });
}
