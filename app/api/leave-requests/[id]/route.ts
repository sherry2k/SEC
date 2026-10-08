import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { LEAVE_REQUEST_STATUSES, LEAVE_TYPE_LABELS, type LeaveRequestStatus } from "@/lib/leave";

// Approve or reject — reviewer only (Admin/Master admin). A request that's
// already been reviewed can be re-decided (e.g. correcting a mis-click),
// which simply overwrites reviewedBy/At/note with the latest call.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  if (!can(user.role, "leave_requests.review")) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as LeaveRequestStatus;
  const reviewNote = typeof body?.reviewNote === "string" ? body.reviewNote.trim() : "";

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Status must be approved or rejected." }, { status: 400 });
  }

  const [existing] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
  }

  const [updated] = await db
    .update(leaveRequests)
    .set({
      status,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote || null,
      updatedAt: new Date(),
    })
    .where(eq(leaveRequests.id, id))
    .returning();

  await logActivity({
    userId: user.id,
    action: status === "approved" ? "leave_request_approved" : "leave_request_rejected",
    targetName: `${existing.leaveNo} — ${LEAVE_TYPE_LABELS[existing.type as keyof typeof LEAVE_TYPE_LABELS]}`,
  });

  return NextResponse.json({ success: true, request: updated });
}

// Delete — Admin/Master admin can remove any request; the person who
// submitted it can cancel it themselves, but only while it's still
// pending (once reviewed, the record stays as history).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const { id } = await params;
  const [existing] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
  }

  const isReviewer = can(user.role, "leave_requests.review");
  const isOwnerPending = existing.userId === user.id && existing.status === "pending";
  if (!isReviewer && !isOwnerPending) {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }

  await db.delete(leaveRequests).where(eq(leaveRequests.id, id));

  await logActivity({
    userId: user.id,
    action: "leave_request_cancelled",
    targetName: `${existing.leaveNo} — ${LEAVE_TYPE_LABELS[existing.type as keyof typeof LEAVE_TYPE_LABELS]}`,
  });

  return NextResponse.json({ success: true });
}
