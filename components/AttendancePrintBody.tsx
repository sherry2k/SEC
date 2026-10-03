import type { StaffSummaryRow } from "@/lib/attendance-report";

export default function AttendancePrintBody({
  rows,
  periodLabel,
  rangeLabel,
}: {
  rows: StaffSummaryRow[];
  periodLabel: string;
  rangeLabel: string;
}) {
  return (
    <>
      <h1 className="mt-2 text-center text-lg font-bold uppercase underline">Attendance Report — {rangeLabel}</h1>
      <p className="mt-1 text-center text-sm text-[var(--sec-muted)]">{periodLabel}</p>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-3 py-2 text-left">Name</th>
            <th className="border border-[var(--sec-blue-deep)] px-3 py-2 text-right">Days Present</th>
            <th className="border border-[var(--sec-blue-deep)] px-3 py-2 text-right">Days Absent</th>
            <th className="border border-[var(--sec-blue-deep)] px-3 py-2 text-right">Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td className="border border-[var(--sec-line)] px-3 py-1.5">{row.name}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.daysPresent}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.daysAbsent}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.totalHoursLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
