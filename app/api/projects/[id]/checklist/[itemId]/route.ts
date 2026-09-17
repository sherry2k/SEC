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
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
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
  if (name !== undefined && name === "") {
    return NextResponse.json({ error: "Name can't be empty." }, { status: 400 });
  }

  // Fetch the item's current status/name before overwriting — needed for a
  // readable activity log entry, and to know whether this is a custom item
  // (no templateId) — only custom items can be renamed.
  const [before] = await db
    .select({
      status: projectChecklistItems.status,
      templateId: projectChecklistItems.templateId,
      customName: projectChecklistItems.customName,
      templateName: checklistTemplates.name,
    })
    .from(projectChecklistItems)
    .leftJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id))
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)))
    .limit(1);

  if (!before) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  if (name !== undefined && before.templateId !== null) {
    return NextResponse.json({ error: "Only custom items you added yourself can be renamed." }, { status: 403 });
  }

  const beforeName = before.customName ?? before.templateName ?? "Untitled item";

  const update: Partial<typeof projectChecklistItems.$inferInsert> = {
    updatedBy: auth.user.id,
    updatedAt: new Date(),
  };
  if (status !== undefined) update.status = status;
  if (remarks !== undefined) update.remarks = remarks || null;
  if (hasDueDate) update.dueDate = dueDate ?? null;
  if (name !== undefined) update.customName = name;

  // Submitting is the staff action worth crediting; approval is the
  // municipality's decision, so it only gets a timestamp, no person.
  if (status !== undefined && status !== before.status) {
    if (status === "submitted") {
      update.submittedBy = auth.user.id;
      update.submittedAt = new Date();
    }
    if (status === "approved") {
      update.approvedAt = new Date();
    } else if (before.status === "approved") {
      update.approvedAt = null;
    }
  }

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
      details: `${beforeName}: ${ITEM_STATUS_LABELS[before.status]} → ${ITEM_STATUS_LABELS[status]}`,
    });
  }

  return NextResponse.json({ success: true });
}

// Only custom items (no templateId) can be deleted — the standard
// checklist that comes from linking a category isn't removable item by
// Any checklist item can be deleted now — standard (template-based) items
// included, not just custom ones — for the case where a standard step
// genuinely doesn't apply to a specific project and marking it "Not
// Required" isn't what's wanted.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId, itemId } = await params;

  const [item] = await db
    .select({ id: projectChecklistItems.id })
    .from(projectChecklistItems)
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)))
    .limit(1);

  if (!item) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  await db.delete(projectChecklistItems).where(eq(projectChecklistItems.id, itemId));
  await touchProject(projectId, auth.user.id);

  return NextResponse.json({ success: true });
}
