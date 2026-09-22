import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { can } from "@/lib/permissions";
import { requirePermission } from "@/lib/auth";
import { getOfficeLedgerSummary, EXPENSE_CATEGORY_SUGGESTIONS, INCOME_CATEGORY_SUGGESTIONS } from "@/lib/office-ledger";
import OfficeLedgerClient from "@/components/OfficeLedgerClient";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function OfficeLedgerPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requirePermission("accounts.view");
  const canEdit = can(user.role, "accounts.edit");

  const { month } = await searchParams;
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const summary = await getOfficeLedgerSummary(monthKey);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Income & Expenses</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">Office-level bookkeeping — separate from client documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/accounts/office-ledger?month=${shiftMonth(monthKey, -1)}`} className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]" aria-label="Previous month">
            <ChevronLeft size={16} />
          </Link>
          <p className="w-40 text-center text-sm font-semibold text-[var(--sec-ink)]">{monthLabel}</p>
          <Link href={`/accounts/office-ledger?month=${shiftMonth(monthKey, 1)}`} className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]" aria-label="Next month">
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Income</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">AED {money(summary.incomeTotal)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Expenses</p>
          <p className="mt-1 text-xl font-bold text-red-600">AED {money(summary.expenseTotal)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Net</p>
          <p className={`mt-1 text-xl font-bold ${summary.net >= 0 ? "text-[var(--sec-ink)]" : "text-red-600"}`}>AED {money(summary.net)}</p>
        </div>
      </div>

      <OfficeLedgerClient
        incomeRows={summary.incomeRows}
        expenseRows={summary.expenseRows}
        expenseByCategory={summary.expenseByCategory}
        canEdit={canEdit}
        expenseCategorySuggestions={EXPENSE_CATEGORY_SUGGESTIONS}
        incomeCategorySuggestions={INCOME_CATEGORY_SUGGESTIONS}
      />
    </div>
  );
}
