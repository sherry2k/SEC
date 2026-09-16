import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { addCategoryToProject } from "@/lib/projects";
import { touchProject, logActivity } from "@/lib/activity";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

// Links one more category onto an existing project (framework doc 3.3 —
// projects aren't locked to the category chosen at creation).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const category = body?.category as ProjectCategory | undefined;

  if (!category || !PROJECT_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  await addCategoryToProject(projectId, category);
  await touchProject(projectId, auth.user.id);
  await logActivity({
    userId: auth.user.id,
    projectId,
    action: "category_added",
    targetName: project.name,
    details: `Linked ${CATEGORY_LABELS[category]}`,
  });

  return NextResponse.json({ success: true });
}

// Unlinks a category from a project — removes the category and every
// checklist item under it for this project only. Fixing a wrongly-linked
// category shouldn't require deleting the whole project.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const category = body?.category as ProjectCategory | undefined;

  if (!category || !PROJECT_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  await db.delete(projectChecklistItems).where(and(eq(projectChecklistItems.projectId, projectId), eq(projectChecklistItems.category, category)));
  const result = await db
    .delete(projectCategories)
    .where(and(eq(projectCategories.projectId, projectId), eq(projectCategories.category, category)))
    .returning({ category: projectCategories.category });

  if (result.length === 0) {
    return NextResponse.json({ error: "That category isn't linked to this project." }, { status: 404 });
  }

  await touchProject(projectId, auth.user.id);
  await logActivity({
    userId: auth.user.id,
    projectId,
    action: "category_removed",
    targetName: project.name,
    details: `Removed ${CATEGORY_LABELS[category]}`,
  });

  return NextResponse.json({ success: true });
}
