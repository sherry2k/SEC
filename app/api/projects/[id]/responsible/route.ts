import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.reassign_responsible");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const responsibleId = typeof body?.responsibleId === "number" ? body.responsibleId : null;

  const [existing] = await db.select({ id: projects.id, projectCode: projects.projectCode }).from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await db
    .update(projects)
    .set({ responsibleId, updatedBy: auth.user.id, updatedAt: new Date() })
    .where(eq(projects.id, id));

  await logActivity({
    userId: auth.user.id,
    projectId: id,
    action: "project_responsible_changed",
    targetName: existing.projectCode,
  });

  return NextResponse.json({ success: true });
}
