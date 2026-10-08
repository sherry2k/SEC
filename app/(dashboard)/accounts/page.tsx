import Link from "next/link";
import { FileText, Wallet, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { quotations, quotationItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcGrandTotals } from "@/lib/quotation-calc";
import { getOfficeLedgerSummary } from "@/lib/office-ledger";
import { inArray } from "drizzle-orm";

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

// The Accounts landing page — a small stats strip (this month's activity)
// above two cards that split client-facing paperwork from internal
// bookkeeping, replacing the old redirect straight into Quotations.
export default async function AccountsIndexPage() {
  await requirePermission("accounts.view");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthKey = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, "0")}`;

  // Quotations this month — count + value, same calc the quotations list
  // itself uses, so this figure never disagrees with what's shown there.
  const allQuotations = await db.select().from(quotations);
  const monthQuotations = allQuotations.filter((q) => q.createdAt >= startOfMonth);
  const quotationIds = monthQuotations.map((q) => q.id);
  const qItems = quotationIds.length
    ? await db.select().from(quotationItems).where(inArray(quotationItems.quotationId, quotationIds))
    : [];
  const quotationValue = monthQuotations.reduce((sum, q) => {
    const items = qItems
      .filter((i) => i.quotationId === q.id)
      .map((i) => ({ description: i.description, classification: i.classification ?? "", feeExclVat: Number(i.feeExclVat) }));
    return sum + calcGrandTotals(items, Number(q.vatRatePercent)).grandTotal;
  }, 0);

  // This month's income/expenses — reuses the same summary function the
  // Income & Expenses page itself calls, so these figures can never drift
  // from what's shown there (income here also includes Receipt Vouchers
  // counted automatically, not just manually entered rows).
  const ledgerSummary = await getOfficeLedgerSummary(monthKey);
  const { incomeTotal, expenseTotal, net } = ledgerSummary;

  const stats = [
    { label: "Quotations this month", value: `${monthQuotations.length}`, sub: `AED ${money(quotationValue)}` },
    { label: "Income this month", value: `AED ${money(incomeTotal)}`, valueClass: "text-emerald-600" },
    { label: "Expenses this month", value: `AED ${money(expenseTotal)}`, valueClass: "text-red-600" },
    { label: "Net this month", value: `AED ${money(net)}`, valueClass: net >= 0 ? "text-[var(--sec-ink)]" : "text-red-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Accounts</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Client documents and office bookkeeping, in one place.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.valueClass ?? "text-[var(--sec-ink)]"}`}>{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/accounts/quotations"
          className="group rounded-lg border border-[var(--sec-line)] bg-white p-6 transition-colors hover:border-[var(--sec-blue)]"
        >
          <FileText size={28} className="text-[var(--sec-blue)]" />
          <p className="mt-3 text-lg font-bold text-[var(--sec-ink)]">Documents</p>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">Quotations, Tax Invoices, Invoices, Performa Invoices, Receipt Vouchers.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] group-hover:underline">
            Open <ArrowRight size={14} />
          </span>
        </Link>

        <Link
          href="/accounts/office-ledger"
          className="group rounded-lg border border-[var(--sec-line)] bg-white p-6 transition-colors hover:border-[var(--sec-blue)]"
        >
          <Wallet size={28} className="text-[var(--sec-blue)]" />
          <p className="mt-3 text-lg font-bold text-[var(--sec-ink)]">Income & Expenses</p>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">Office-level bookkeeping — separate from client documents.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] group-hover:underline">
            Open <ArrowRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}
