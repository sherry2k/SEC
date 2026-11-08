import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salaryRequests } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("salary_requests.review");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select().from(salaryRequests).where(eq(salaryRequests.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Salary request not found." }, { status: 404 });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Only a request still awaiting review can be rejected." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  await db
    .update(salaryRequests)
    .set({ status: "rejected", reviewedBy: auth.user.id, reviewedAt: new Date(), reviewNote: note || null, updatedAt: new Date() })
    .where(eq(salaryRequests.id, id));

  await logActivity({ userId: auth.user.id, action: "salary_request_rejected", targetName: existing.requestNo, details: note || null });

  return NextResponse.json({ success: true });
}
