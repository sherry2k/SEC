import type { OfficeLedgerSummary, OfficeLedgerRangeSummary } from "@/lib/office-ledger";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function OfficeLedgerSingleMonthPrintBody({ summary, monthLabel }: { summary: OfficeLedgerSummary; monthLabel: string }) {
  return (
    <>
      <h1 className="mt-2 text-center text-lg font-bold uppercase underline">Income &amp; Expenses — {monthLabel}</h1>

      <table className="mt-4 w-full max-w-md border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Income</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(summary.incomeTotal)}</td>
          </tr>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Expenses</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(summary.expenseTotal)}</td>
          </tr>
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-3 py-2">Net</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(summary.net)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Expenses by Category</h2>
      {summary.expenseByCategory.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">No expenses this month.</p>
      ) : (
        <table className="mt-2 w-full max-w-md border-collapse text-sm">
          <tbody>
            {summary.expenseByCategory.map((c) => (
              <tr key={c.category}>
                <td className="border border-[var(--sec-line)] px-3 py-1.5">{c.category}</td>
                <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Expense Entries</h2>
      {summary.expenseRows.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">No expenses logged this month.</p>
      ) : (
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--sec-blue-deep)] text-white">
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Date</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Category</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Description</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {summary.expenseRows.map((r) => (
              <tr key={r.id}>
                <td className="border border-[var(--sec-line)] px-2 py-1">{r.dateLabel}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1">{r.category}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1">{r.description}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1 text-right">AED {money(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Income Entries</h2>
      {summary.incomeRows.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">No income logged this month.</p>
      ) : (
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--sec-blue-deep)] text-white">
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Date</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Category</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Description</th>
              <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {summary.incomeRows.map((r) => (
              <tr key={r.id}>
                <td className="border border-[var(--sec-line)] px-2 py-1">{r.dateLabel}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1">{r.category}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1">{r.description}</td>
                <td className="border border-[var(--sec-line)] px-2 py-1 text-right">AED {money(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export function OfficeLedgerRangePrintBody({ summary, rangeLabel }: { summary: OfficeLedgerRangeSummary; rangeLabel: string }) {
  return (
    <>
      <h1 className="mt-2 text-center text-lg font-bold uppercase underline">Income &amp; Expenses — {rangeLabel}</h1>

      <table className="mt-4 w-full max-w-md border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Total Income</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(summary.totalIncome)}</td>
          </tr>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Total Expenses</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(summary.totalExpense)}</td>
          </tr>
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-3 py-2">Total Net</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(summary.totalNet)}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Month by Month</h2>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-left">Month</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-right">Income</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-right">Expenses</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-1.5 text-right">Net</th>
          </tr>
        </thead>
        <tbody>
          {summary.months.map((m) => (
            <tr key={m.monthKey}>
              <td className="border border-[var(--sec-line)] px-2 py-1.5">{m.monthLabel}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(m.incomeTotal)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right">AED {money(m.expenseTotal)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-1.5 text-right font-medium">AED {money(m.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Expenses by Category (whole period)</h2>
      {summary.expenseByCategory.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">No expenses in this period.</p>
      ) : (
        <table className="mt-2 w-full max-w-md border-collapse text-sm">
          <tbody>
            {summary.expenseByCategory.map((c) => (
              <tr key={c.category}>
                <td className="border border-[var(--sec-line)] px-3 py-1.5">{c.category}</td>
                <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
