"use client";

import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { StaffSummaryRow, DailyDetailRow } from "@/lib/attendance-report";

export type SummaryRowWithDays = StaffSummaryRow & { days: DailyDetailRow[] };

export default function AttendanceSummaryTable({ rows }: { rows: SummaryRowWithDays[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(userId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

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
            {rows.map((row) => {
              const isOpen = expanded.has(row.userId);
              return (
                <Fragment key={row.userId}>
                  <tr
                    className="cursor-pointer border-b border-[var(--sec-line)] last:border-0 hover:bg-[var(--sec-bg)]"
                    onClick={() => toggle(row.userId)}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">
                      <span className="inline-flex items-center gap-1.5">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[var(--sec-muted)]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-[var(--sec-muted)]" />
                        )}
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-700">{row.daysPresent}</td>
                    <td className={`px-4 py-3 ${row.daysAbsent > 0 ? "text-red-600" : "text-[var(--sec-muted)]"}`}>{row.daysAbsent}</td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{row.expectedHoursLabel}</td>
                    <td className="px-4 py-3 text-[var(--sec-ink)]">{row.totalHoursLabel}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-[var(--sec-line)] last:border-0">
                      <td colSpan={5} className="bg-[var(--sec-bg)] px-4 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-[var(--sec-muted)]">
                              <th className="py-1 pr-4 text-left font-medium">Date</th>
                              <th className="py-1 pr-4 text-left font-medium">Check-in</th>
                              <th className="py-1 pr-4 text-left font-medium">Check-out</th>
                              <th className="py-1 text-left font-medium">Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.days.map((day) => (
                              <tr key={day.dateKey} className="border-t border-[var(--sec-line)]">
                                <td className="py-1 pr-4 text-[var(--sec-ink)]">{day.dateLabel}</td>
                                {day.present ? (
                                  <>
                                    <td className="py-1 pr-4 text-[var(--sec-muted)]">{day.checkInLabel}</td>
                                    <td className="py-1 pr-4 text-[var(--sec-muted)]">{day.checkOutLabel}</td>
                                    <td className="py-1 text-[var(--sec-ink)]">{day.hoursLabel}</td>
                                  </>
                                ) : (
                                  <td className="py-1 text-red-600" colSpan={3}>
                                    Absent
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <p className="mt-4 text-sm text-[var(--sec-muted)]">No staff accounts to show yet.</p>}
    </>
  );
}
