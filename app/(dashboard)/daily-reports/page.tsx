import { requirePermission } from "@/lib/auth";
import { getHoursSummary } from "@/lib/daily-report";
import DailyReportsFilters from "@/components/DailyReportsFilters";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default async function DailyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; groupBy?: string }>;
}) {
  await requirePermission("daily_report.view_all");

  const params = await searchParams;
  const defaults = defaultRange();
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : defaults.from;
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : defaults.to;
  const groupBy = params.groupBy === "staff" ? "staff" : "project";

  const results = await getHoursSummary(from, to, groupBy);
  const grandTotal = Math.round(results.reduce((sum, r) => sum + r.hours, 0) * 100) / 100;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Daily Reports</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">Total hours logged, {groupBy === "staff" ? "by staff member" : "by project"}</p>
        </div>
        <DailyReportsFilters from={from} to={to} groupBy={groupBy} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--sec-muted)]">No hours logged in this date range.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">{groupBy === "staff" ? "Staff member" : "Project"}</th>
                <th className="px-4 py-3 text-right font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.label} className="border-b border-[var(--sec-line)] last:border-0">
                  <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{r.label}</td>
                  <td className="px-4 py-3 text-right text-[var(--sec-ink)]">{r.hours}h</td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3 font-bold text-[var(--sec-ink)]">Total</td>
                <td className="px-4 py-3 text-right font-bold text-[var(--sec-ink)]">{grandTotal}h</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
