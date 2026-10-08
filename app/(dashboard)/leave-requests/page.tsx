import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_BADGE_STYLES, LEAVE_STATUS_LABELS, LEAVE_STATUS_STYLES } from "@/lib/leave";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function MyLeaveRequestsPage() {
  const user = await requirePermission("leave_requests.create");

  const rows = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.userId, user.id))
    .orderBy(desc(leaveRequests.createdAt));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">My Leave Requests</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "request" : "requests"}
          </p>
        </div>
        <Link
          href="/leave-requests/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New request
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No leave requests yet.</p>
          <Link href="/leave-requests/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Submit one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Ref.</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/leave-requests/${r.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                      {r.leaveNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEAVE_TYPE_BADGE_STYLES[r.type]}`}>
                      {LEAVE_TYPE_LABELS[r.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">
                    {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-ink)]">{r.totalDays}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEAVE_STATUS_STYLES[r.status]}`}>
                      {LEAVE_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
