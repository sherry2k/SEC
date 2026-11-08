import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getSalaryReport } from "@/lib/salary-report";
import { shiftMonthKey } from "@/lib/office-ledger";
import DownloadPdfButton from "@/components/DownloadPdfButton";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default async function SalaryReportPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requirePermission("accounts.view");

  const { month } = await searchParams;
  const now = new Date();
  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const report = await getSalaryReport(monthKey);

  return (
    <div>
      <Link href="/accounts/salary-slips" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Salary Slips
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Salary Report</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            Every salary slip this month, by employee — send to the GM for approval before marking them Paid.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/accounts/salary-report?month=${shiftMonthKey(monthKey, -1)}`}
              className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </Link>
            <p className="w-40 text-center text-sm font-semibold text-[var(--sec-ink)]">{monthLabel}</p>
            <Link
              href={`/accounts/salary-report?month=${shiftMonthKey(monthKey, 1)}`}
              className="rounded-md border border-[var(--sec-line)] p-1.5 hover:border-[var(--sec-blue)]"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </Link>
          </div>
          <DownloadPdfButton href={`/api/salary-report/pdf?month=${monthKey}`} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Gross Earnings</p>
          <p className="mt-1 text-xl font-bold text-[var(--sec-ink)]">AED {money(report.totals.earningsTotal)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Deductions</p>
          <p className="mt-1 text-xl font-bold text-red-600">AED {money(report.totals.deductionsTotal)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total Salaries (Net Pay)</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">AED {money(report.totals.netPay)}</p>
        </div>
      </div>

      {report.rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No salary slips for {monthLabel}.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium text-right">Gross Earnings</th>
                <th className="px-4 py-3 font-medium text-right">Deductions</th>
                <th className="px-4 py-3 font-medium text-right">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.slipId} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/accounts/salary-slips/${r.slipId}`} className="font-medium text-[var(--sec-ink)] hover:text-[var(--sec-blue)]">
                      {r.employeeName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{r.designation}</td>
                  <td className="px-4 py-3 text-right text-[var(--sec-ink)]">AED {money(r.earningsTotal)}</td>
                  <td className="px-4 py-3 text-right text-[var(--sec-ink)]">AED {money(r.deductionsTotal)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--sec-ink)]">AED {money(r.netPay)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
                        r.status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--sec-line)] font-bold text-[var(--sec-ink)]">
                <td className="px-4 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-3 text-right">AED {money(report.totals.earningsTotal)}</td>
                <td className="px-4 py-3 text-right">AED {money(report.totals.deductionsTotal)}</td>
                <td className="px-4 py-3 text-right">AED {money(report.totals.netPay)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
