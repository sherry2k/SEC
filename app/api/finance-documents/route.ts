import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations, taxInvoices, performaInvoices, receiptVouchers, invoices, projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

const DOC_TYPES = ["quotation", "tax_invoice", "performa_invoice", "receipt_voucher", "invoice"] as const;
type DocType = (typeof DOC_TYPES)[number];

// Lists documents of one type for the "link an existing document to this
// project" picker — includes which project (if any) each is currently
// linked to, so the picker can show that rather than silently steal a
// document that's actually meant for a different project.
export async function GET(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.view");
  if (!auth.ok) return auth.response;

  const type = request.nextUrl.searchParams.get("type") as DocType | null;
  if (!type || !DOC_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
  }

  const projectRows = await db.select({ id: projects.id, projectCode: projects.projectCode, municipalityNo: projects.municipalityNo }).from(projects);
  const projectLabelById = new Map(projectRows.map((p) => [p.id, p.municipalityNo || p.projectCode]));

  let results: { id: string; label: string; projectId: string | null }[] = [];

  if (type === "quotation") {
    const rows = await db.select().from(quotations).orderBy(desc(quotations.createdAt));
    results = rows.map((r) => ({ id: r.id, label: `${r.quotationNo} — ${r.clientName ?? "—"}`, projectId: r.projectId }));
  } else if (type === "tax_invoice") {
    const rows = await db.select().from(taxInvoices).orderBy(desc(taxInvoices.createdAt));
    results = rows.map((r) => ({ id: r.id, label: `${r.invoiceNo} — ${r.clientName ?? "—"}`, projectId: r.projectId }));
  } else if (type === "performa_invoice") {
    const rows = await db.select().from(performaInvoices).orderBy(desc(performaInvoices.createdAt));
    results = rows.map((r) => ({ id: r.id, label: `${r.invoiceNo} — ${r.customerName ?? "—"}`, projectId: r.projectId }));
  } else if (type === "receipt_voucher") {
    const rows = await db.select().from(receiptVouchers).orderBy(desc(receiptVouchers.createdAt));
    results = rows.map((r) => ({ id: r.id, label: `${r.voucherNo} — ${r.toName ?? "—"}`, projectId: r.projectId }));
  } else if (type === "invoice") {
    const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    results = rows.map((r) => ({ id: r.id, label: `${r.invoiceNo} — ${r.customerName ?? "—"}`, projectId: r.projectId }));
  }

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      label: r.label,
      linkedProjectLabel: r.projectId ? projectLabelById.get(r.projectId) ?? null : null,
    })),
  });
}
