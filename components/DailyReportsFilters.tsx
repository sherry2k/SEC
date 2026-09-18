"use client";

import { useRouter } from "next/navigation";

export default function DailyReportsFilters({ from, to, groupBy }: { from: string; to: string; groupBy: "project" | "staff" }) {
  const router = useRouter();

  const go = (next: { from?: string; to?: string; groupBy?: string }) => {
    const params = new URLSearchParams({ from, to, groupBy, ...next });
    router.push(`/daily-reports?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => go({ from: e.target.value })}
          className="rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--sec-blue)]"
        />
        <span className="text-sm text-[var(--sec-muted)]">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => go({ to: e.target.value })}
          className="rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--sec-blue)]"
        />
      </div>
      <div className="inline-flex rounded-md border border-[var(--sec-line)] bg-white p-0.5">
        <button
          onClick={() => go({ groupBy: "project" })}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            groupBy === "project" ? "bg-[var(--sec-blue)] text-white" : "text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
          }`}
        >
          By project
        </button>
        <button
          onClick={() => go({ groupBy: "staff" })}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            groupBy === "staff" ? "bg-[var(--sec-blue)] text-white" : "text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
          }`}
        >
          By staff
        </button>
      </div>
    </div>
  );
}
