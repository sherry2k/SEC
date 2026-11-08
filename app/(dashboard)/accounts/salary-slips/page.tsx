import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, ArrowLeft, ChevronLeft, ChevronRight, FileBarChart } from "lucide-react";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";
import { shiftMonthKey } from "@/lib/office-ledger";
import { payMonthLabel } from "@/components/SalarySlipPrintBody";
import SalarySlipStatusControl from "@/components/SalarySlipStatusControl";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default async function SalarySlipsListPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requirePermission("accounts.view");
  const canEdit = can(user.role, "accounts.edit");

  const { month } = await searchParams;
  // "all" shows every slip ever created, flat — the pre-filter behavior.
  // Anything else resolves to a specific "YYYY-MM" month, defaulting to
  // the current one, same convention as Income & Expenses.
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const showAll = month === "all";
  const monthKey = !showAll && month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthKey;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const allRows = await db.select().from(salarySlips).orderBy(desc(salarySlips.createdAt));
  const rows = showAll ? allRows : allRows.filter((s) => s.payMonth === monthKey);

  // All slip items, grouped by slip — a flat select is simplest here (no
  // inArray needed), since even the full "All months" table stays small.
  const items = await db.select().from(salarySlipItems);

  const itemsBySlip = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsBySlip.get(item.slipId) ?? [];
    list.push(item);
    itemsBySlip.set(item.slipId, list);
  }

  const totalsByRow = rows.map((s) =>
    calcSalarySlipTotals(
      (itemsBySlip.get(s.id) ?? []).map((i) => ({ type: i.type as "earning" | "deduction", description: i.description, amount: Number(i.amount) }))
    )
  );
  const monthNetTotal = totalsByRow.reduce((sum, t) => sum + t.netPay, 0);

  return (
    <div>
      <Link href="/accounts" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Accounts
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Salary Slips</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "slip" : "slips"}
            {!showAll && ` · AED ${money(monthNetTotal)} net pay`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!showAll && (
            <div className="flex items-center gap-2">
              <Link
                href={`/accounts/salary-slips?month=${shiftMonthKey(monthKey, -1)}`}
                className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </Link>
              <p className="w-40 text-center text-sm font-semibold text-[var(--sec-ink)]">{monthLabel}</p>
              <Link
                href={`/accounts/salary-slips?month=${shiftMonthKey(monthKey, 1)}`}
                className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
          <Link
            href={showAll ? `/accounts/salary-slips?month=${currentMonthKey}` : "/accounts/salary-slips?month=all"}
            className="text-sm font-medium text-[var(--sec-blue)] hover:underline"
          >
            {showAll ? "Back to month view" : "All months"}
          </Link>
          <Link
            href={`/accounts/salary-report?month=${monthKey}`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-sm font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <FileBarChart size={14} />
            Salary Report
          </Link>
          <Link
            href="/accounts/salary-slips/new"
            className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Plus size={16} />
            New salary slip
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">{showAll ? "No salary slips yet." : `No salary slips for ${monthLabel}.`}</p>
          <Link href="/accounts/salary-slips/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                {showAll && <th className="px-4 py-3 font-medium">Month</th>}
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/accounts/salary-slips/${s.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                      {s.slipNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{s.employeeName}</td>
                  {showAll && <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{payMonthLabel(s.payMonth)}</td>}
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">AED {money(totalsByRow[i].netPay)}</td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <SalarySlipStatusControl slipId={s.id} status={s.status} />
                    ) : (
                      <span className="capitalize text-[var(--sec-muted)]">{s.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{s.issueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
