import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_BADGE_STYLES, LEAVE_STATUS_LABELS, LEAVE_STATUS_STYLES } from "@/lib/leave";
import LeaveReviewControl from "@/components/LeaveReviewControl";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ReviewLeaveRequestsPage() {
  await requirePermission("leave_requests.review");

  const rows = await db
    .select({
      id: leaveRequests.id,
      leaveNo: leaveRequests.leaveNo,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      status: leaveRequests.status,
      createdAt: leaveRequests.createdAt,
      staffName: users.name,
    })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .orderBy(desc(leaveRequests.createdAt));

  // Pending first so it reads as a review queue, then everything else
  // most-recent-first — not purely chronological.
  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Review leave requests</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        {pending.length} pending · {rows.length} total
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No leave requests yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Ref.</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {[...pending, ...decided].map((r) => (
                <tr key={r.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/leave-requests/${r.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                      {r.leaveNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{r.staffName ?? "—"}</td>
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
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <LeaveReviewControl requestId={r.id} />
                    ) : (
                      <Link href={`/leave-requests/${r.id}`} className="text-xs font-medium text-[var(--sec-blue)] hover:underline">
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
