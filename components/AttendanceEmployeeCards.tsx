"use client";

import { useState } from "react";
import type { StaffSummaryRow, DailyDetailRow } from "@/lib/attendance-report";
import DownloadPdfButton from "@/components/DownloadPdfButton";

export type EmployeeCardRow = StaffSummaryRow & { days: DailyDetailRow[]; role: string };

const ROLE_LABELS: Record<string, string> = {
  staff: "Staff",
  finance: "Finance",
  admin: "Admin",
  master_admin: "Admin",
};

export default function AttendanceEmployeeCards({
  rows,
  dateKey,
  range,
}: {
  rows: EmployeeCardRow[];
  dateKey: string;
  range: "week" | "month";
}) {
  const [selectedId, setSelectedId] = useState<number | null>(rows[0]?.userId ?? null);
  const selected = rows.find((r) => r.userId === selectedId) ?? rows[0];

  if (rows.length === 0) {
    return <p className="mt-4 text-sm text-[var(--sec-muted)]">No staff accounts to show yet.</p>;
  }

  return (
    <>
      <p className="mt-4 text-sm text-[var(--sec-muted)]">Select an employee to see their daily timing for this period.</p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {rows.map((row) => {
          const isSelected = row.userId === selected?.userId;
          return (
            <button
              key={row.userId}
              type="button"
              onClick={() => setSelectedId(row.userId)}
              className={`rounded-lg border p-3.5 text-left transition-colors ${
                isSelected
                  ? "border-[var(--sec-blue-deep)] bg-[var(--sec-blue)] text-white"
                  : "border-[var(--sec-line)] bg-white text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold">{row.name}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isSelected ? "bg-white/20 text-white" : "bg-[var(--sec-bg)] text-[var(--sec-blue-deep)]"
                  }`}
                >
                  {ROLE_LABELS[row.role] ?? row.role}
                </span>
              </div>
              <div className={`mt-2.5 flex justify-between text-xs ${isSelected ? "text-white/85" : "text-[var(--sec-muted)]"}`}>
                <span>Actual Hrs</span>
                <span className="font-semibold">{row.totalHoursLabel}</span>
              </div>
              <div className={`mt-0.5 flex justify-between text-xs ${isSelected ? "text-white/85" : "text-[var(--sec-muted)]"}`}>
                <span>Expected Hrs</span>
                <span>{row.expectedHoursLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sec-line)] px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-[var(--sec-ink)]">{selected.name} — Daily Timing</h2>
              <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{ROLE_LABELS[selected.role] ?? selected.role}</p>
            </div>
            <DownloadPdfButton href={`/api/attendance/pdf?date=${dateKey}&range=${range}&userId=${selected.userId}`} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Check-in</th>
                  <th className="px-5 py-2.5 font-medium">Check-out</th>
                  <th className="px-5 py-2.5 font-medium text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {selected.days.map((day) => (
                  <tr key={day.dateKey} className="border-b border-[var(--sec-line)] last:border-0">
                    <td className="px-5 py-2 text-[var(--sec-ink)]">{day.dateLabel}</td>
                    {day.present ? (
                      <>
                        <td className="px-5 py-2 text-[var(--sec-muted)]">{day.checkInLabel}</td>
                        <td className="px-5 py-2 text-[var(--sec-muted)]">{day.checkOutLabel}</td>
                        <td className="px-5 py-2 text-right text-[var(--sec-ink)]">{day.hoursLabel}</td>
                      </>
                    ) : (
                      <td className="px-5 py-2 text-red-600" colSpan={3}>
                        Absent
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--sec-bg)] font-semibold text-[var(--sec-ink)]">
                  <td className="px-5 py-2.5" colSpan={3}>
                    Actual Hrs
                  </td>
                  <td className="px-5 py-2.5 text-right">{selected.totalHoursLabel}</td>
                </tr>
                <tr className="bg-[var(--sec-bg)] text-[var(--sec-muted)]">
                  <td className="px-5 pb-3" colSpan={3}>
                    Expected Hrs
                  </td>
                  <td className="px-5 pb-3 text-right">{selected.expectedHoursLabel}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
