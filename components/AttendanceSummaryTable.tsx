import type { StaffSummaryRow, DailyDetailRow } from "@/lib/attendance-report";

export type SummaryRowWithDays = StaffSummaryRow & { days: DailyDetailRow[] };

// Always-expanded: the on-screen view mirrors the PDF exactly (summary
// table, then every employee's full daily timing table underneath), so
// what's on screen is what prints — no collapsed state to lose on paper.
export default function AttendanceSummaryTable({ rows }: { rows: SummaryRowWithDays[] }) {
  return (
    <>
      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Days Present</th>
              <th className="px-4 py-3 font-medium">Days Absent</th>
              <th className="px-4 py-3 font-medium">Expected Hrs</th>
              <th className="px-4 py-3 font-medium">Actual Hrs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-b border-[var(--sec-line)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{row.name}</td>
                <td className="px-4 py-3 text-emerald-700">{row.daysPresent}</td>
                <td className={`px-4 py-3 ${row.daysAbsent > 0 ? "text-red-600" : "text-[var(--sec-muted)]"}`}>{row.daysAbsent}</td>
                <td className="px-4 py-3 text-[var(--sec-muted)]">{row.expectedHoursLabel}</td>
                <td className="px-4 py-3 text-[var(--sec-ink)]">{row.totalHoursLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <p className="mt-4 text-sm text-[var(--sec-muted)]">No staff accounts to show yet.</p>}

      {rows.map((row) => (
        <div key={row.userId} className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <p className="border-b border-[var(--sec-line)] px-4 py-2 text-sm font-semibold text-[var(--sec-ink)]">{row.name} — Daily Timing</p>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Check-in</th>
                <th className="px-4 py-2 font-medium">Check-out</th>
                <th className="px-4 py-2 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {row.days.map((day) => (
                <tr key={day.dateKey} className="border-b border-[var(--sec-line)] last:border-0">
                  <td className="px-4 py-2 text-[var(--sec-ink)]">{day.dateLabel}</td>
                  {day.present ? (
                    <>
                      <td className="px-4 py-2 text-[var(--sec-muted)]">{day.checkInLabel}</td>
                      <td className="px-4 py-2 text-[var(--sec-muted)]">{day.checkOutLabel}</td>
                      <td className="px-4 py-2 text-[var(--sec-ink)]">{day.hoursLabel}</td>
                    </>
                  ) : (
                    <td className="px-4 py-2 text-red-600" colSpan={3}>
                      Absent
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
