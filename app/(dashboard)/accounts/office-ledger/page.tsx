import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { can } from "@/lib/permissions";
import { requirePermission } from "@/lib/auth";
import {
  getOfficeLedgerSummary,
  getOfficeLedgerRangeSummary,
  shiftMonthKey,
  EXPENSE_CATEGORY_SUGGESTIONS,
  INCOME_CATEGORY_SUGGESTIONS,
} from "@/lib/office-ledger";
import OfficeLedgerClient from "@/components/OfficeLedgerClient";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

const RANGE_OPTIONS = [
  { value: "1", label: "1 Month" },
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
];

export default async function OfficeLedgerPage({ searchParams }: { searchParams: Promise<{ month?: string; range?: string }> }) {
  const user = await requirePermission("accounts.view");
  const canEdit = can(user.role, "accounts.edit");

  const { month, range } = await searchParams;
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const numMonths = range === "3" || range === "6" ? Number(range) : 1;

  const rangeQuery = numMonths > 1 ? `&range=${numMonths}` : "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Income & Expenses</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">Office-level bookkeeping — separate from client documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-[var(--sec-line)] bg-white p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/accounts/office-ledger?month=${monthKey}${opt.value !== "1" ? `&range=${opt.value}` : ""}`}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  numMonths === Number(opt.value) ? "bg-[var(--sec-blue)] text-white" : "text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/accounts/office-ledger?month=${shiftMonthKey(monthKey, -1)}${rangeQuery}`}
              className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </Link>
            <p className="w-40 text-center text-sm font-semibold text-[var(--sec-ink)]">{monthLabel}</p>
            <Link
              href={`/accounts/office-ledger?month=${shiftMonthKey(monthKey, 1)}${rangeQuery}`}
              className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {numMonths === 1 ? (
        <SingleMonthView monthKey={monthKey} canEdit={canEdit} />
      ) : (
        <RangeView endMonthKey={monthKey} numMonths={numMonths} />
      )}
    </div>
  );
}

async function SingleMonthView({ monthKey, canEdit }: { monthKey: string; canEdit: boolean }) {
  const summary = await getOfficeLedgerSummary(monthKey);

  return (
    <>
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
    </>
  );
}

async function RangeView({ endMonthKey, numMonths }: { endMonthKey: string; numMonths: number }) {
  const summary = await getOfficeLedgerRangeSummary(endMonthKey, numMonths);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total income</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">AED {money(summary.totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total expenses</p>
          <p className="mt-1 text-xl font-bold text-red-600">AED {money(summary.totalExpense)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total net</p>
          <p className={`mt-1 text-xl font-bold ${summary.totalNet >= 0 ? "text-[var(--sec-ink)]" : "text-red-600"}`}>AED {money(summary.totalNet)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Month by month</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                  <th className="px-3 py-2 font-medium">Month</th>
                  <th className="px-3 py-2 text-right font-medium">Income</th>
                  <th className="px-3 py-2 text-right font-medium">Expenses</th>
                  <th className="px-3 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {summary.months.map((m) => (
                  <tr key={m.monthKey} className="border-b border-[var(--sec-line)] last:border-0">
                    <td className="px-3 py-2 font-medium text-[var(--sec-ink)]">{m.monthLabel}</td>
                    <td className="px-3 py-2 text-right text-emerald-600">{money(m.incomeTotal)}</td>
                    <td className="px-3 py-2 text-right text-red-600">{money(m.expenseTotal)}</td>
                    <td className={`px-3 py-2 text-right font-medium ${m.net >= 0 ? "text-[var(--sec-ink)]" : "text-red-600"}`}>{money(m.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--sec-muted)]">Expenses by category (whole period)</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
            {summary.expenseByCategory.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--sec-muted)]">No expenses in this period.</p>
            ) : (
              summary.expenseByCategory.map((c) => (
                <div key={c.category} className="flex items-center justify-between border-b border-[var(--sec-line)] px-3 py-2 text-sm last:border-0">
                  <span className="text-[var(--sec-ink)]">{c.category}</span>
                  <span className="font-medium text-[var(--sec-ink)]">AED {money(c.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
