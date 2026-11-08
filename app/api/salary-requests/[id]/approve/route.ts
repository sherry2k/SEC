import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// GM-only (same rule as leave_requests.review) — approving is what unlocks
// the Generate Slips action; Finance/Admin can still create the request
// and generate the slips afterward via accounts.edit, but the review step
// itself is gated separately.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("salary_requests.review");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Salary request not found." }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Only a request still awaiting review can be approved." }, { status: 409 });
  }

  await db
    .update(salaryRequests)
    .set({ status: "approved", reviewedBy: auth.user.id, reviewedAt: new Date(), reviewNote: null, updatedAt: new Date() })
    .where(eq(salaryRequests.id, id));

  await logActivity({ userId: auth.user.id, action: "salary_request_approved", targetName: existing.requestNo });

  return NextResponse.json({ success: true });
}
