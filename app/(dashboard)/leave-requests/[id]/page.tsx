import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Paperclip } from "lucide-react";
import { db } from "@/db";
import { leaveRequests, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_BADGE_STYLES,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
} from "@/lib/leave";
import LeaveReviewControl from "@/components/LeaveReviewControl";
import DeleteLeaveRequestButton from "@/components/DeleteLeaveRequestButton";
import PrintButton from "@/components/PrintButton";
import LeaveLetterPrintView from "@/components/LeaveLetterPrintView";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function LeaveRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("leave_requests.create");
  const canReview = can(user.role, "leave_requests.review");
  const { id } = await params;

  const [row] = await db
    .select({
      id: leaveRequests.id,
      leaveNo: leaveRequests.leaveNo,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      attachmentUrl: leaveRequests.attachmentUrl,
      attachmentFileName: leaveRequests.attachmentFileName,
      status: leaveRequests.status,
      reviewNote: leaveRequests.reviewNote,
      reviewedAt: leaveRequests.reviewedAt,
      reviewedBy: leaveRequests.reviewedBy,
      createdAt: leaveRequests.createdAt,
      userId: leaveRequests.userId,
      staffName: users.name,
      staffDesignation: users.designation,
    })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .where(eq(leaveRequests.id, id))
    .limit(1);

  if (!row) notFound();

  const isOwner = row.userId === user.id;
  if (!isOwner && !canReview) redirect("/unauthorized");

  const [reviewer] = row.reviewedBy
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, row.reviewedBy)).limit(1)
    : [null];

  const canCancel = isOwner && row.status === "pending";
  const canDelete = canReview;

  return (
    <div>
      <div className="print:hidden">
        <Link href="/leave-requests" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          Back to leave requests
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-[var(--sec-muted)]">Ref: {row.leaveNo}</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">{row.staffName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${LEAVE_TYPE_BADGE_STYLES[row.type]}`}>
              {LEAVE_TYPE_LABELS[row.type]}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${LEAVE_STATUS_STYLES[row.status]}`}>
              {LEAVE_STATUS_LABELS[row.status]}
            </span>
            {row.status === "approved" && <PrintButton />}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">From</dt>
            <dd className="text-[var(--sec-ink)]">{formatDate(row.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">To</dt>
            <dd className="text-[var(--sec-ink)]">{formatDate(row.endDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total days</dt>
            <dd className="text-[var(--sec-ink)]">{row.totalDays}</dd>
          </div>
          {row.reason && (
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Reason</dt>
              <dd className="text-[var(--sec-ink)]">{row.reason}</dd>
            </div>
          )}
          {row.attachmentUrl && (
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Attachment</dt>
              <dd>
                <a
                  href={row.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
                >
                  <Paperclip size={13} />
                  {row.attachmentFileName || "View file"}
                </a>
              </dd>
            </div>
          )}
          {row.reviewedAt && (
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                {row.status === "approved" ? "Approved" : "Reviewed"}
              </dt>
              <dd className="text-[var(--sec-ink)]">
                {reviewer?.name ?? "—"} on {formatDate(row.reviewedAt)}
                {row.reviewNote && <span className="block text-xs text-[var(--sec-muted)]">{row.reviewNote}</span>}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {row.status === "pending" && canReview && <LeaveReviewControl requestId={row.id} />}
          {(canCancel || canDelete) && (
            <DeleteLeaveRequestButton requestId={row.id} label={canCancel && !canReview ? "Cancel request" : "Delete"} />
          )}
        </div>
      </div>

      {row.status === "approved" && (
        <div className="mt-8">
          <LeaveLetterPrintView
            request={{
              leaveNo: row.leaveNo,
              type: row.type,
              staffName: row.staffName ?? "—",
              staffDesignation: row.staffDesignation,
              startDateLabel: formatDate(row.startDate),
              endDateLabel: formatDate(row.endDate),
              totalDays: row.totalDays,
              reason: row.reason,
              hasAttachment: Boolean(row.attachmentUrl),
              approvedByName: reviewer?.name ?? "—",
              approvedAtLabel: row.reviewedAt ? formatDate(row.reviewedAt) : "",
            }}
          />
        </div>
      )}
    </div>
  );
}
