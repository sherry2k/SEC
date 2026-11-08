import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { salaryRequests, salaryRequestItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { payMonthLabel } from "@/components/SalarySlipPrintBody";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default async function SalaryRequestsListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(salaryRequests).orderBy(desc(salaryRequests.createdAt));
  const allItems = await db.select().from(salaryRequestItems);

  const itemsByRequest = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByRequest.get(item.requestId) ?? [];
    list.push(item);
    itemsByRequest.set(item.requestId, list);
  }

  return (
    <div>
      <Link href="/accounts/salary-slips" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Salary Slips
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Salary Requests</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            Quick pre-approval amounts to send the GM — before any Salary Slip exists.
          </p>
        </div>
        <Link
          href="/accounts/salary-requests/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New salary request
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No salary requests yet.</p>
          <Link href="/accounts/salary-requests/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Employees</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const items = itemsByRequest.get(r.id) ?? [];
                const total = items.reduce((sum, i) => sum + Number(i.amount), 0);
                return (
                  <tr key={r.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/salary-requests/${r.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {r.requestNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{payMonthLabel(r.payMonth)}</td>
                    <td className="px-4 py-3 text-[var(--sec-ink)]">{items.length}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">AED {money(total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                          r.status === "generated"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.status === "generated" ? "Slips generated" : "Pending approval"}
                      </span>
                    </td>
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
