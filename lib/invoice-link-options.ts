import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  taxInvoices,
  taxInvoiceItems,
  invoices,
  invoiceItems,
  receiptVouchers,
  receiptVoucherItems,
} from "@/db/schema";
import { calcTaxInvoiceTotals } from "@/lib/tax-invoice-calc";
import { calcInvoiceTotals } from "@/lib/invoice-calc";
import { calcReceiptVoucherTotals } from "@/lib/receipt-voucher-calc";

export type LinkableDocumentType = "tax_invoice" | "invoice";

export type InvoiceLinkOption = {
  type: LinkableDocumentType;
  id: string;
  ref: string;
  label: string; // "Tax Invoice SEC/TAXINV/2026/0011"
  total: number;
  linkedTotal: number; // already collected against this invoice by OTHER receipt vouchers
  remaining: number; // total - linkedTotal, floored at 0
};

// The Receipt Voucher form's "Linked invoice" dropdown — every Tax
// Invoice/Invoice on the SAME project (legacy project or account project,
// whichever the voucher itself is attached to), with how much of each is
// still uncollected. `excludeVoucherId` leaves out that voucher's own
// existing link when editing, so its own amount isn't double-subtracted
// from the invoice it's already linked to.
export async function getInvoiceLinkOptions({
  projectId,
  accountProjectId,
  excludeVoucherId,
}: {
  projectId?: string | null;
  accountProjectId?: string | null;
  excludeVoucherId?: string;
}): Promise<InvoiceLinkOption[]> {
  if (!projectId && !accountProjectId) return [];

  const options: InvoiceLinkOption[] = [];

  const taxInvoiceRows = projectId
    ? await db.select().from(taxInvoices).where(eq(taxInvoices.projectId, projectId))
    : await db.select().from(taxInvoices).where(eq(taxInvoices.accountProjectId, accountProjectId!));
  for (const inv of taxInvoiceRows) {
    const items = await db.select().from(taxInvoiceItems).where(eq(taxInvoiceItems.invoiceId, inv.id));
    const { total } = calcTaxInvoiceTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(inv.vatRatePercent)
    );
    options.push({ type: "tax_invoice", id: inv.id, ref: inv.invoiceNo, label: `Tax Invoice ${inv.invoiceNo}`, total, linkedTotal: 0, remaining: total });
  }

  const invoiceRows = projectId
    ? await db.select().from(invoices).where(eq(invoices.projectId, projectId))
    : await db.select().from(invoices).where(eq(invoices.accountProjectId, accountProjectId!));
  for (const inv of invoiceRows) {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
    const { total } = calcInvoiceTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(inv.vatRatePercent)
    );
    options.push({ type: "invoice", id: inv.id, ref: inv.invoiceNo, label: `Invoice ${inv.invoiceNo}`, total, linkedTotal: 0, remaining: total });
  }

  if (options.length === 0) return options;

  // Subtract what's already linked from every OTHER receipt voucher
  // scoped the same way.
  const voucherRows = projectId
    ? await db.select().from(receiptVouchers).where(eq(receiptVouchers.projectId, projectId))
    : await db.select().from(receiptVouchers).where(eq(receiptVouchers.accountProjectId, accountProjectId!));

  for (const v of voucherRows) {
    if (!v.linkedDocumentId || !v.linkedDocumentType) continue;
    if (excludeVoucherId && v.id === excludeVoucherId) continue;
    const opt = options.find((o) => o.id === v.linkedDocumentId && o.type === v.linkedDocumentType);
    if (!opt) continue;

    const items = await db.select().from(receiptVoucherItems).where(eq(receiptVoucherItems.voucherId, v.id));
    const { total } = calcReceiptVoucherTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(v.vatRatePercent)
    );
    opt.linkedTotal += total;
  }

  for (const opt of options) {
    opt.remaining = Math.max(0, opt.total - opt.linkedTotal);
  }

  return options;
}

// Confirms a given (type, id) is actually one of this project's Tax
// Invoices/Invoices before letting the API routes persist a link — used
// so a crafted request can't link a voucher to a document on an
// unrelated project.
export async function isValidLinkTarget({
  type,
  id,
  projectId,
  accountProjectId,
}: {
  type: LinkableDocumentType;
  id: string;
  projectId?: string | null;
  accountProjectId?: string | null;
}): Promise<boolean> {
  if (!projectId && !accountProjectId) return false;

  if (type === "tax_invoice") {
    const [row] = await db
      .select({ projectId: taxInvoices.projectId, accountProjectId: taxInvoices.accountProjectId })
      .from(taxInvoices)
      .where(eq(taxInvoices.id, id))
      .limit(1);
    if (!row) return false;
    return (!!projectId && row.projectId === projectId) || (!!accountProjectId && row.accountProjectId === accountProjectId);
  }

  if (type === "invoice") {
    const [row] = await db
      .select({ projectId: invoices.projectId, accountProjectId: invoices.accountProjectId })
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);
    if (!row) return false;
    return (!!projectId && row.projectId === projectId) || (!!accountProjectId && row.accountProjectId === accountProjectId);
  }

  return false;
}

export type LinkedPayment = {
  voucherId: string;
  voucherNo: string;
  dateLabel: string;
  amount: number;
  status: string;
};

// The "Payments received against this invoice" section on a Tax
// Invoice/Invoice's own page — every Receipt Voucher linked to it,
// regardless of status, so a Draft one still shows (clearly labeled)
// rather than silently vanishing.
export async function getLinkedPayments(type: LinkableDocumentType, documentId: string): Promise<LinkedPayment[]> {
  const vouchers = await db.select().from(receiptVouchers).where(eq(receiptVouchers.linkedDocumentId, documentId));
  const matching = vouchers.filter((v) => v.linkedDocumentType === type);

  const out: LinkedPayment[] = [];
  for (const v of matching) {
    const items = await db.select().from(receiptVoucherItems).where(eq(receiptVoucherItems.voucherId, v.id));
    const { total } = calcReceiptVoucherTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(v.vatRatePercent)
    );
    out.push({ voucherId: v.id, voucherNo: v.voucherNo, dateLabel: v.issueDate, amount: total, status: v.status });
  }
  return out;
}
