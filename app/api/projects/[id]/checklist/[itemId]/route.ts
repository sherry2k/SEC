import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { projectChecklistItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/checklist";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId, itemId } = await params;

  const body = await request.json().catch(() => null);
  const status = body?.status as ItemStatus | undefined;
  const remarks = typeof body?.remarks === "string" ? body.remarks : undefined;

  if (status !== undefined && !ITEM_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const update: Partial<typeof projectChecklistItems.$inferInsert> = {
    updatedBy: auth.user.id,
    updatedAt: new Date(),
  };
  if (status !== undefined) update.status = status;
  if (remarks !== undefined) update.remarks = remarks || null;

  const result = await db
    .update(projectChecklistItems)
    .set(update)
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)))
    .returning({ id: projectChecklistItems.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
