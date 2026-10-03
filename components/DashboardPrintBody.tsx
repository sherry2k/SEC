import { CATEGORY_BADGE_STYLES, type ProjectCategory } from "@/lib/checklist";

import { ITEM_STATUS_STYLES, type ItemStatus } from "@/lib/checklist";

type DashboardPrintData = Awaited<ReturnType<typeof import("@/lib/dashboard-print-data").getDashboardForPrint>>;

export default function DashboardPrintBody({ data }: { data: DashboardPrintData }) {
  return (
    <>
      <h1 className="mt-2 text-center text-lg font-bold uppercase underline">Overview Summary</h1>

      <table className="mt-4 w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Total projects</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">{data.totalProjects}</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Active</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">{data.activeCount}</td>
          </tr>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">On hold</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">{data.onHoldCount}</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Completed</td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">{data.completedCount}</td>
          </tr>
        </tbody>
      </table>

      {data.financeSnapshot && (
        <>
          <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Finance this month</h2>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Quotations issued</td>
                <td className="border border-[var(--sec-line)] px-3 py-2 text-right">{data.financeSnapshot.quotationCount}</td>
                <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Quoted value</td>
                <td className="border border-[var(--sec-line)] px-3 py-2 text-right">
                  AED {data.financeSnapshot.quotationTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
              <tr>
                <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Invoices issued</td>
                <td className="border border-[var(--sec-line)] px-3 py-2 text-right">{data.financeSnapshot.invoiceCount}</td>
                <td className="border border-[var(--sec-line)] px-3 py-2 font-semibold">Invoiced value</td>
                <td className="border border-[var(--sec-line)] px-3 py-2 text-right">
                  AED {data.financeSnapshot.invoiceTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Projects by category</h2>
      <div className="mt-2 space-y-1.5">
        {data.categoryLabels.map((c) => (
          <div key={c.key} className="flex items-center gap-3 text-sm">
            <span
              className={`w-28 shrink-0 rounded-full border px-2 py-0.5 text-center text-xs font-medium ${CATEGORY_BADGE_STYLES[c.key as ProjectCategory]}`}
            >
              {c.label}
            </span>
            <span className="text-[var(--sec-ink)]">{c.count}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--sec-muted)]">
        {data.approvedItems} approved items · {data.pendingItems} awaiting review
      </p>

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Recent projects</h2>
      {data.recentProjects.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">No projects yet.</p>
      ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
          {data.recentProjects.map((p, i) => (
            <li key={i}>
              {p.name} ({p.projectCode}) — {p.statusLabel}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Needs attention</h2>
      {data.stuckItems.length === 0 && data.staleProjects.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">Nothing needs attention right now.</p>
      ) : (
        <div className="mt-1 space-y-1">
          {data.stuckItems.map((i, idx) => (
            <div key={`stuck-${idx}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">
                {i.name} — {i.projectName}
              </span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${ITEM_STATUS_STYLES[i.status as ItemStatus]}`}>
                {i.statusLabel}
              </span>
            </div>
          ))}
          {data.staleProjects.map((p, idx) => (
            <div key={`stale-${idx}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-xs text-[var(--sec-muted)]">No update since {p.updatedAtLabel}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-5 text-sm font-bold text-[var(--sec-ink)]">Team workload</h2>
      {data.workload.length === 0 && data.unassignedCount === 0 ? (
        <p className="mt-1 text-sm text-[var(--sec-muted)]">No projects yet.</p>
      ) : (
        <>
          <table className="mt-2 w-full max-w-xs border-collapse text-sm">
            <tbody>
              {data.workload.map(([name, count]) => (
                <tr key={name}>
                  <td className="border border-[var(--sec-line)] px-3 py-1.5">{name}</td>
                  <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.unassignedCount > 0 && (
            <p className="mt-2 text-xs text-[var(--sec-muted)]">{data.unassignedCount} project(s) unassigned</p>
          )}
        </>
      )}
    </>
  );
}
