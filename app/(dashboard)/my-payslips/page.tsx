import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { salarySlips, salarySlipItems } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";
import { payMonthLabel } from "@/components/SalarySlipPrintBody";

// Every approved user can open this — it only ever shows slips issued to
// them (employeeId === their own id), so there's no role gate beyond being
// signed in. Admin/Finance manage every slip from Accounts → Salary Slips;
// this is just the self-service view for whoever the slip was issued to.
//
// Only "paid" slips show here — a draft may still be getting corrected,
// so it stays invisible to the employee until Admin/Finance marks it
// paid (see lib/salary-slip-access.ts, which enforces the same rule on
// the view/PDF/print routes in case someone has the direct link).
export default async function MyPayslipsPage() {
  const user = await requireRole();

  const rows = await db
    .select()
    .from(salarySlips)
    .where(and(eq(salarySlips.employeeId, user.id), eq(salarySlips.status, "paid")))
    .orderBy(desc(salarySlips.createdAt));

  // One employee's worth of slips — a per-slip fetch is fine here, no
  // need for an inArray batch like the Accounts-side list page.
  const itemsBySlip = new Map<string, (typeof salarySlipItems.$inferSelect)[]>();
  for (const row of rows) {
    const items = await db.select().from(salarySlipItems).where(eq(salarySlipItems.slipId, row.id));
    itemsBySlip.set(row.id, items);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">My Payslips</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        {rows.length} {rows.length === 1 ? "slip" : "slips"}
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No salary slips have been issued to you yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
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
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">{payMonthLabel(s.payMonth)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {totals.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)] capitalize">{s.status}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/salary-slips/${s.id}/pdf`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
                      >
                        <Download size={12} />
                        PDF
                      </a>
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
