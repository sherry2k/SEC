import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectChecklistItems, checklistTemplates } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { touchProject, logActivity } from "@/lib/activity";
import { ITEM_STATUSES, ITEM_STATUS_LABELS, type ItemStatus } from "@/lib/checklist";

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
  // dueDate: "YYYY-MM-DD" string sets it, null clears it, undefined leaves it alone
  const dueDateRaw = body?.dueDate;
  const hasDueDate = "dueDate" in (body ?? {});
  const dueDate = dueDateRaw === null ? null : typeof dueDateRaw === "string" ? new Date(dueDateRaw) : undefined;

  if (status !== undefined && !ITEM_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (hasDueDate && dueDateRaw !== null && (typeof dueDateRaw !== "string" || Number.isNaN(new Date(dueDateRaw).getTime()))) {
    return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
  }

  // Fetch the item's current status and name before overwriting — needed
  // for a readable activity log entry ("X: not started → submitted").
  const [before] = await db
    .select({ status: projectChecklistItems.status, name: checklistTemplates.name })
    .from(projectChecklistItems)
    .innerJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id))
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)))
    .limit(1);

  if (!before) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  const update: Partial<typeof projectChecklistItems.$inferInsert> = {
    updatedBy: auth.user.id,
    updatedAt: new Date(),
  };
  if (status !== undefined) update.status = status;
  if (remarks !== undefined) update.remarks = remarks || null;
  if (hasDueDate) update.dueDate = dueDate ?? null;

  await db
    .update(projectChecklistItems)
    .set(update)
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)));

  await touchProject(projectId, auth.user.id);

  if (status !== undefined && status !== before.status) {
    const [project] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1);
    await logActivity({
      userId: auth.user.id,
      projectId,
      action: "checklist_status_changed",
      targetName: project?.name ?? "",
      details: `${before.name}: ${ITEM_STATUS_LABELS[before.status]} → ${ITEM_STATUS_LABELS[status]}`,
    });
  }

  return NextResponse.json({ success: true });
}
