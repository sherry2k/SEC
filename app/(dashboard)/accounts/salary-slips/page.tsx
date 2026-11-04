import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";
import { payMonthLabel } from "@/components/SalarySlipPrintBody";

export default async function SalarySlipsListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(salarySlips).orderBy(desc(salarySlips.createdAt));
  const allItems = await db.select().from(salarySlipItems);

  const itemsBySlip = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsBySlip.get(item.slipId) ?? [];
    list.push(item);
    itemsBySlip.set(item.slipId, list);
  }

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
          </p>
        </div>
        <Link
          href="/accounts/salary-slips/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New salary slip
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No salary slips yet.</p>
          <Link href="/accounts/salary-slips/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const items = itemsBySlip.get(s.id) ?? [];
                const totals = calcSalarySlipTotals(
                  items.map((i) => ({ type: i.type as "earning" | "deduction", description: i.description, amount: Number(i.amount) }))
                );
                return (
                  <tr key={s.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/salary-slips/${s.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {s.slipNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{s.employeeName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{payMonthLabel(s.payMonth)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {totals.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)] capitalize">{s.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{s.issueDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
