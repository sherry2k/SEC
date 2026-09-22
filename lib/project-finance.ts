import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
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

export type LedgerEntry = {
  id: string;
  dateLabel: string; // as typed, e.g. "18/04/2025"
  sortKey: number; // parsed timestamp for chronological ordering
  kind: "charge" | "payment";
  docLabel: string; // "TAX-INV" | "INV" | "RV"
  ref: string;
  description: string;
  amount: number;
};

// Parses "DD/MM/YYYY" (how every document's issue date is stored) into a
// sortable timestamp. Falls back to 0 (sorts first) for anything that
// doesn't match, rather than throwing on an unexpected format.
function parseDMY(s: string): number {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return 0;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).getTime();
}

export type ProjectFinancials = {
  totalAmount: number;
  invoicedTotal: number;
  paidTotal: number;
  balance: number; // totalAmount - paidTotal
  ledger: LedgerEntry[];
};

// Aggregates a project's manually-set total contract value together with
// every linked Tax Invoice, Invoice, and Receipt Voucher into one
// financial picture — used by both the project page's summary card and
// the Statement of Account.
export async function getProjectFinancials(projectId: string): Promise<ProjectFinancials> {
  const [project] = await db.select({ totalAmount: projects.totalAmount }).from(projects).where(eq(projects.id, projectId)).limit(1);
  const totalAmount = project?.totalAmount ? Number(project.totalAmount) : 0;

  const ledger: LedgerEntry[] = [];

  const linkedTaxInvoices = await db.select().from(taxInvoices).where(eq(taxInvoices.projectId, projectId));
  for (const inv of linkedTaxInvoices) {
    const items = await db.select().from(taxInvoiceItems).where(eq(taxInvoiceItems.invoiceId, inv.id));
    const totals = calcTaxInvoiceTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(inv.vatRatePercent)
    );
    ledger.push({
      id: inv.id,
      dateLabel: inv.issueDate,
      sortKey: parseDMY(inv.issueDate),
      kind: "charge",
      docLabel: "TAX-INV",
      ref: inv.invoiceNo,
      description: `Tax Invoice No: ${inv.invoiceNo}`,
      amount: totals.total,
    });
  }

  const linkedInvoices = await db.select().from(invoices).where(eq(invoices.projectId, projectId));
  for (const inv of linkedInvoices) {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
    const totals = calcInvoiceTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(inv.vatRatePercent)
    );
    ledger.push({
      id: inv.id,
      dateLabel: inv.issueDate,
      sortKey: parseDMY(inv.issueDate),
      kind: "charge",
      docLabel: "INV",
      ref: inv.invoiceNo,
      description: `Invoice No: ${inv.invoiceNo}`,
      amount: totals.total,
    });
  }

  const linkedVouchers = await db.select().from(receiptVouchers).where(eq(receiptVouchers.projectId, projectId));
  for (const v of linkedVouchers) {
    const items = await db.select().from(receiptVoucherItems).where(eq(receiptVoucherItems.voucherId, v.id));
    const totals = calcReceiptVoucherTotals(
      items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
      Number(v.vatRatePercent)
    );
    ledger.push({
      id: v.id,
      dateLabel: v.issueDate,
      sortKey: parseDMY(v.issueDate),
      kind: "payment",
      docLabel: "RV",
      ref: v.voucherNo,
      description: `Receipt Voucher No: ${v.voucherNo}`,
      amount: totals.total,
    });
  }

  ledger.sort((a, b) => a.sortKey - b.sortKey);

  const invoicedTotal = ledger.filter((l) => l.kind === "charge").reduce((sum, l) => sum + l.amount, 0);
  const paidTotal = ledger.filter((l) => l.kind === "payment").reduce((sum, l) => sum + l.amount, 0);

  return {
    totalAmount,
    invoicedTotal,
    paidTotal,
    balance: totalAmount - paidTotal,
    ledger,
  };
}
