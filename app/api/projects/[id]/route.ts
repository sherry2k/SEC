import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { getAssignableUsers } from "@/lib/assignable-users";
import { logActivity } from "@/lib/activity";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/checklist";

const EDITABLE_TEXT_FIELDS = ["name", "clientName", "buildingName", "unitNo", "plotNo", "municipalityNo", "location", "notes"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: Partial<Record<(typeof EDITABLE_TEXT_FIELDS)[number], string | null>> = {};
  for (const field of EDITABLE_TEXT_FIELDS) {
    const value = body?.[field];
    if (typeof value === "string") {
      update[field] = value.trim() || null;
    }
  }

  if (update.name === null || update.name === "") {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  let responsibleId: number | null | undefined;
  if ("responsibleId" in (body ?? {})) {
    responsibleId = typeof body.responsibleId === "number" ? body.responsibleId : null;
    if (responsibleId !== null) {
      const assignable = await getAssignableUsers();
      if (!assignable.some((u) => u.id === responsibleId)) {
        return NextResponse.json({ error: "Choose a valid person for Responsible." }, { status: 400 });
      }
    }
  }

  let status: ProjectStatus | undefined;
  if ("status" in (body ?? {})) {
    status = body.status as ProjectStatus;
    if (!PROJECT_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
  }

  let statementShowStamp: boolean | undefined;
  if ("statementShowStamp" in (body ?? {})) {
    statementShowStamp = Boolean(body.statementShowStamp);
  }

  if (
    Object.keys(update).length === 0 &&
    responsibleId === undefined &&
    status === undefined &&
    statementShowStamp === undefined
  ) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Fetch the current row when status is changing — need its existing
  // status (to detect a real transition) and responsibleId (to freeze as
  // completedBy the moment it becomes Completed).
  let completionUpdate: { completedBy: number | null; completedAt: Date | null } | undefined;
  if (status !== undefined) {
    const [existing] = await db
      .select({ status: projects.status, responsibleId: projects.responsibleId })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    if (status === "completed" && existing.status !== "completed") {
      completionUpdate = { completedBy: existing.responsibleId, completedAt: new Date() };
    } else if (status !== "completed" && existing.status === "completed") {
      completionUpdate = { completedBy: null, completedAt: null };
    }
  }

  const result = await db
    .update(projects)
    .set({
      ...update,
      ...(responsibleId !== undefined ? { responsibleId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(statementShowStamp !== undefined ? { statementShowStamp } : {}),
      ...(completionUpdate ?? {}),
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    } as Partial<typeof projects.$inferInsert>)
    .where(eq(projects.id, id))
    .returning({ id: projects.id, name: projects.name });

  if (result.length === 0) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const changedFields = [
    ...Object.keys(update),
    ...(status !== undefined ? ["status"] : []),
    ...(statementShowStamp !== undefined ? ["statementShowStamp"] : []),
  ];
  await logActivity({
    userId: auth.user.id,
    projectId: id,
    action: "project_updated",
    targetName: result[0].name,
    details: `Fields changed: ${changedFields.join(", ")}`,
  });

  return NextResponse.json({ success: true });
}

// project_categories and project_checklist_items are ON DELETE CASCADE, so
// removing the project row cleans up its checklist and category links too.
// The activity_log row survives (projectId set to null there) so the audit
// trail still shows the project existed and who deleted it.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.delete");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [project] = await db.select({ name: projects.name }).from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    projectId: null,
    action: "project_deleted",
    targetName: project.name,
  });

  await db.delete(projects).where(eq(projects.id, id));

  return NextResponse.json({ success: true });
}
