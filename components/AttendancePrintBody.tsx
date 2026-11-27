import type { StaffSummaryRow, StaffDailyDetail } from "@/lib/attendance-report";

export default function AttendancePrintBody({
  rows,
  periodLabel,
  rangeLabel,
  dailyDetail,
}: {
  rows: StaffSummaryRow[];
  periodLabel: string;
  rangeLabel: string;
  dailyDetail?: StaffDailyDetail[];
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
            <th className="border border-[var(--sec-blue-deep)] px-3 py-2 text-right">Expected Hrs</th>
            <th className="border border-[var(--sec-blue-deep)] px-3 py-2 text-right">Actual Hrs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td className="border border-[var(--sec-line)] px-3 py-1.5">{row.name}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.daysPresent}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.daysAbsent}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.expectedHoursLabel}</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{row.totalHoursLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {dailyDetail && dailyDetail.length > 0 && (
        <>
          {dailyDetail.map((staffDay) => (
            <div key={staffDay.userId} className="mt-6 break-inside-avoid">
              <h2 className="text-sm font-bold">{staffDay.name} — Daily Timing</h2>
              <table className="mt-2 w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--sec-blue-deep)] text-white">
                    <th className="border border-[var(--sec-blue-deep)] px-3 py-1.5 text-left">Date</th>
                    <th className="border border-[var(--sec-blue-deep)] px-3 py-1.5 text-right">Check-in</th>
                    <th className="border border-[var(--sec-blue-deep)] px-3 py-1.5 text-right">Check-out</th>
                    <th className="border border-[var(--sec-blue-deep)] px-3 py-1.5 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {staffDay.days.map((day) => (
                    <tr key={day.dateKey}>
                      <td className="border border-[var(--sec-line)] px-3 py-1">{day.dateLabel}</td>
                      {day.present ? (
                        <>
                          <td className="border border-[var(--sec-line)] px-3 py-1 text-right">{day.checkInLabel}</td>
                          <td className="border border-[var(--sec-line)] px-3 py-1 text-right">{day.checkOutLabel}</td>
                          <td className="border border-[var(--sec-line)] px-3 py-1 text-right">{day.hoursLabel}</td>
                        </>
                      ) : (
                        <td className="border border-[var(--sec-line)] px-3 py-1 text-right text-red-600" colSpan={3}>
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
      )}
    </>
  );
}
