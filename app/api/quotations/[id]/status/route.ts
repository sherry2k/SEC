import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { QUOTATION_STATUSES } from "@/lib/quotation-status";

// Status-only PATCH, deliberately separate from the main
// app/api/quotations/[id]/route.ts PATCH — that route rebuilds the whole
// quotation from a full form payload, so sending it just { status } would
// overwrite every other field with blanks. This endpoint only ever touches
// the status column, for the status dropdown on the quotation's own page
// and (later) anywhere else a quick status change is needed.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (!QUOTATION_STATUSES.includes(status as (typeof QUOTATION_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: quotations.id, quotationNo: quotations.quotationNo, clientName: quotations.clientName })
    .from(quotations)
    .where(eq(quotations.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
  }

  await db
    .update(quotations)
    .set({ status, updatedBy: auth.user.id, updatedAt: new Date() })
    .where(eq(quotations.id, id));

  // Reusing the existing "quotation_updated" action rather than a new
  // literal — ActivityAction is a fixed union in lib/activity.ts, and the
  // status change itself is recorded in targetName below.
  await logActivity({
    userId: auth.user.id,
    action: "quotation_updated",
    targetName: `${existing.quotationNo} — ${existing.clientName ?? ""} → ${status}`,
  });

  return NextResponse.json({ success: true });
}
