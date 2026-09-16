"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function shiftDate(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AttendanceDatePicker({ dateKey }: { dateKey: string }) {
  const router = useRouter();

  const go = (next: string) => router.push(`/attendance?date=${next}`);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => go(shiftDate(dateKey, -1))}
        aria-label="Previous day"
        className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]"
      >
        <ChevronLeft size={16} />
      </button>
      <input
        type="date"
        value={dateKey}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
      />
      <button
        onClick={() => go(shiftDate(dateKey, 1))}
        aria-label="Next day"
        className="rounded-md p-1.5 text-[var(--sec-muted)] hover:bg-slate-100 hover:text-[var(--sec-ink)]"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
