import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects, taxInvoices, taxInvoiceItems, invoices, invoiceItems, receiptVouchers, receiptVoucherItems } from "@/db/schema";
import { calcTaxInvoiceTotals } from "@/lib/tax-invoice-calc";
import { calcInvoiceTotals } from "@/lib/invoice-calc";
import { calcReceiptVoucherTotals } from "@/lib/receipt-voucher-calc";
import { getAccountProjectFinancials } from "@/lib/account-project-finance";
import type { LedgerEntry } from "@/lib/project-finance";
import type { StatementOfAccountData } from "@/components/StatementOfAccountPrintBody";

// Parses "DD/MM/YYYY" (how every document's issue date is stored) into a
// sortable timestamp. Falls back to 0 (sorts first) for anything that
// doesn't match, rather than throwing on an unexpected format.
function parseDMY(s: string): number {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return 0;
  const [, d, mo, y] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).getTime();
}

// The Account Projects answer to lib/project-finance.ts's getProjectFinancials —
// same ledger shape, so it drops straight into the same
// StatementOfAccountPrintView/PrintBody, but sourced from accountProjectId
// instead of the legacy projectId, and with no manually-set contract value:
// "totalAmount" here is the accepted-quotations total (getAccountProjectFinancials'
// totalQuoted), computed automatically rather than typed in by hand.
export async function getAccountProjectStatementData(accountProjectId: string): Promise<StatementOfAccountData | null> {
  const [accountProject] = await db.select().from(accountProjects).where(eq(accountProjects.id, accountProjectId)).limit(1);
  if (!accountProject) return null;

  const fin = await getAccountProjectFinancials(accountProjectId);

  const ledger: LedgerEntry[] = [];

  const linkedTaxInvoices = await db.select().from(taxInvoices).where(eq(taxInvoices.accountProjectId, accountProjectId));
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

  const linkedInvoices = await db.select().from(invoices).where(eq(invoices.accountProjectId, accountProjectId));
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

  const linkedVouchers = await db.select().from(receiptVouchers).where(eq(receiptVouchers.accountProjectId, accountProjectId));
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

  return {
    // Account Projects have no separate project-code field like the legacy
    // `projects` table does, so the project description (falling back to
    // the client name) stands in as the reference line.
    projectRef: accountProject.projectDetails || accountProject.clientName,
    printedDate: new Date().toLocaleDateString("en-GB"),
    clientName: accountProject.clientName ?? "",
    clientAddress: accountProject.location ?? "",
    totalAmount: fin.totalQuoted,
    invoicedTotal: fin.invoicedTotal,
    paidTotal: fin.paidTotal,
    balance: fin.balance,
    ledger,
    showStamp: false,
  };
}
