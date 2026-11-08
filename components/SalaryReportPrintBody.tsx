import type { SalaryReport } from "@/lib/salary-report";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function SalaryReportPrintBody({ report, monthLabel }: { report: SalaryReport; monthLabel: string }) {
  return (
    <>
      <h1 className="mt-2 text-center text-lg font-bold uppercase underline">Salary Report — {monthLabel}</h1>
      <p className="mt-1 text-center text-sm text-[var(--sec-muted)]">
        {report.rows.length} {report.rows.length === 1 ? "employee" : "employees"} this month
      </p>

      {report.rows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--sec-muted)]">No salary slips for {monthLabel}.</p>
      ) : (
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--sec-blue-deep)] text-white">
              <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Employee</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Designation</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Gross Earnings</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Deductions</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Net Pay</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.slipId}>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{r.employeeName}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{r.designation}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(r.earningsTotal)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(r.deductionsTotal)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top font-semibold">AED {money(r.netPay)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top capitalize">{r.status}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="border border-[var(--sec-line)] px-2 py-2" colSpan={2}>
                Total
              </td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(report.totals.earningsTotal)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(report.totals.deductionsTotal)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(report.totals.netPay)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2" />
            </tr>
          </tfoot>
        </table>
      )}
    </>
  );
}
