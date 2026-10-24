import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  quotations,
  quotationItems,
  taxInvoices,
  taxInvoiceItems,
  invoices,
  invoiceItems,
  performaInvoices,
  performaInvoiceItems,
  receiptVouchers,
  receiptVoucherItems,
} from "@/db/schema";
import { QUOTATION_CATEGORY_LABELS, type QuotationCategory } from "@/lib/quotation-category-constants";

// Parses "DD/MM/YYYY" (how every non-quotation document's issue date is
// stored) into a sortable timestamp. Falls back to 0 for anything that
// doesn't match, rather than throwing on an unexpected format.
function parseDMY(s: string): number {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return 0;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).getTime();
}

export type FeeLine = { label: string; amount: number };

export type AcceptedQuotationBreakdown = {
  id: string;
  quotationNo: string;
  label: string; // "BOC", "Contractor Assignment", ... or "Quotation" for a blank one
  lines: FeeLine[];
  totalExclVat: number;
  vatAmount: number;
  total: number;
};

export type LinkedDocument = {
  id: string;
  kind: "quotation" | "tax_invoice" | "invoice" | "performa_invoice" | "receipt_voucher";
  label: string;
  ref: string;
  dateLabel: string;
  sortKey: number;
  amount: number;
  status: string;
};

export type AccountProjectFinancials = {
  acceptedQuotations: AcceptedQuotationBreakdown[];
  totalQuoted: number;
  totalQuotedExclVat: number;
  totalQuotedVat: number;
  // Tax Invoices + Invoices only — Performa Invoices are intentionally
  // excluded here, same as the engineering project's financial summary
  // (lib/project-finance.ts) always excluded them: a performa invoice is a
  // pre-payment bill, not a charge, so it never counted toward a project's
  // invoiced total there either. It still shows up in `documents` below.
  invoicedTotal: number;
  paidTotal: number; // Receipt Vouchers
  balance: number; // totalQuoted - paidTotal
  documents: LinkedDocument[];
};

// Every invoice-family table (tax invoice, invoice, performa invoice,
// receipt voucher) shares the same item shape (amount + parent VAT rate),
// so one plain VAT calc covers all four without depending on each
// document's own calc module.
function simpleTotals(items: { amount: string | number }[], vatRatePercent: number) {
  const subTotal = items.reduce((sum, i) => sum + Number(i.amount), 0);
  const vatAmount = subTotal * (vatRatePercent / 100);
  return { subTotal, vatAmount, total: subTotal + vatAmount };
}

export async function getAccountProjectFinancials(accountProjectId: string): Promise<AccountProjectFinancials> {
  const documents: LinkedDocument[] = [];

  // --- Quotations: every linked one goes in `documents`; only accepted
  // ones feed the Fee Breakdown and Total Quoted. ---
  const linkedQuotations = await db.select().from(quotations).where(eq(quotations.accountProjectId, accountProjectId));
  const acceptedQuotations: AcceptedQuotationBreakdown[] = [];
  let totalQuotedExclVat = 0;
  let totalQuotedVat = 0;

  for (const q of linkedQuotations) {
    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, q.id));
    const vatPct = Number(q.vatRatePercent);

    let lines: FeeLine[];
    if (q.category) {
      const scopeFee = q.scopeFeeExclVat ? Number(q.scopeFeeExclVat) : 0;
      const mandatory = items.filter((i) => i.section === "mandatory");
      lines = [
        { label: "Professional / Consultancy Fee", amount: scopeFee },
        ...mandatory.map((i) => ({ label: i.description, amount: Number(i.feeExclVat) })),
      ];
    } else {
      lines = items.filter((i) => !i.section).map((i) => ({ label: i.description, amount: Number(i.feeExclVat) }));
    }
    const subTotal = lines.reduce((s, l) => s + l.amount, 0);
    const vatAmount = subTotal * (vatPct / 100);
    const total = subTotal + vatAmount;

    documents.push({
      id: q.id,
      kind: "quotation",
      label: "Quotation",
      ref: q.quotationNo,
      dateLabel: q.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      sortKey: q.createdAt.getTime(),
      amount: total,
      status: q.status,
    });

    if (q.status === "accepted") {
      acceptedQuotations.push({
        id: q.id,
        quotationNo: q.quotationNo,
        label: q.category ? (QUOTATION_CATEGORY_LABELS[q.category as QuotationCategory] ?? q.category) : "Quotation",
        lines,
        totalExclVat: subTotal,
        vatAmount,
        total,
      });
      totalQuotedExclVat += subTotal;
      totalQuotedVat += vatAmount;
    }
  }

  const totalQuoted = totalQuotedExclVat + totalQuotedVat;

  // --- Tax invoices ---
  const linkedTaxInvoices = await db.select().from(taxInvoices).where(eq(taxInvoices.accountProjectId, accountProjectId));
  let invoicedTotal = 0;
  for (const inv of linkedTaxInvoices) {
    const items = await db.select().from(taxInvoiceItems).where(eq(taxInvoiceItems.invoiceId, inv.id));
    const { total } = simpleTotals(items, Number(inv.vatRatePercent));
    invoicedTotal += total;
    documents.push({
      id: inv.id,
      kind: "tax_invoice",
      label: "Tax invoice",
      ref: inv.invoiceNo,
      dateLabel: inv.issueDate,
      sortKey: parseDMY(inv.issueDate),
      amount: total,
      status: inv.status,
    });
  }

  // --- Invoices ---
  const linkedInvoices = await db.select().from(invoices).where(eq(invoices.accountProjectId, accountProjectId));
  for (const inv of linkedInvoices) {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
    const { total } = simpleTotals(items, Number(inv.vatRatePercent));
    invoicedTotal += total;
    documents.push({
      id: inv.id,
      kind: "invoice",
      label: "Invoice",
      ref: inv.invoiceNo,
      dateLabel: inv.issueDate,
      sortKey: parseDMY(inv.issueDate),
      amount: total,
      status: inv.status,
    });
  }

  // --- Performa invoices (listed, not counted — see the type's comment above) ---
  const linkedPerformaInvoices = await db.select().from(performaInvoices).where(eq(performaInvoices.accountProjectId, accountProjectId));
  for (const inv of linkedPerformaInvoices) {
    const items = await db.select().from(performaInvoiceItems).where(eq(performaInvoiceItems.invoiceId, inv.id));
    const { total } = simpleTotals(items, Number(inv.vatRatePercent));
    documents.push({
      id: inv.id,
      kind: "performa_invoice",
      label: "Performa invoice",
      ref: inv.invoiceNo,
      dateLabel: inv.issueDate,
      sortKey: parseDMY(inv.issueDate),
      amount: total,
      status: inv.status,
    });
  }

  // --- Receipt vouchers ---
  const linkedVouchers = await db.select().from(receiptVouchers).where(eq(receiptVouchers.accountProjectId, accountProjectId));
  let paidTotal = 0;
  for (const v of linkedVouchers) {
    const items = await db.select().from(receiptVoucherItems).where(eq(receiptVoucherItems.voucherId, v.id));
    const { total } = simpleTotals(items, Number(v.vatRatePercent));
    paidTotal += total;
    documents.push({
      id: v.id,
      kind: "receipt_voucher",
      label: "Receipt voucher",
      ref: v.voucherNo,
      dateLabel: v.issueDate,
      sortKey: parseDMY(v.issueDate),
      amount: total,
      status: v.status,
    });
  }

  documents.sort((a, b) => a.sortKey - b.sortKey);

  return {
    acceptedQuotations,
    totalQuoted,
    totalQuotedExclVat,
    totalQuotedVat,
    invoicedTotal,
    paidTotal,
    balance: totalQuoted - paidTotal,
    documents,
  };
}