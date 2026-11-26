import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories } from "@/db/schema";
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

// Updates the free-text note tied to one specific category link (e.g. the
// assigned contractor's name, or an archive submission's own project
// number) — doesn't touch the checklist items under it. Identified by the
// link's own id now, not by category: a project can have the same category
// linked more than once, so category alone no longer picks one out.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const body = await request.json().catch(() => null);
  const categoryLinkId = typeof body?.categoryLinkId === "string" ? body.categoryLinkId : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!categoryLinkId) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  const result = await db
    .update(projectCategories)
    .set({ note: note || null })
    .where(and(eq(projectCategories.id, categoryLinkId), eq(projectCategories.projectId, projectId)))
    .returning({ id: projectCategories.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "That category isn't linked to this project." }, { status: 404 });
  }

  await touchProject(projectId, auth.user.id);

  return NextResponse.json({ success: true });
}

// Unlinks one specific category link from a project — removes it and every
// checklist item under it (the FK's own cascade takes care of the items)
// for this project only. Fixing a wrongly-linked category shouldn't
// require deleting the whole project. Identified by the link's own id, not
// by category, since a project can have the same category linked twice.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const categoryLinkId = typeof body?.categoryLinkId === "string" ? body.categoryLinkId : "";

  if (!categoryLinkId) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  const result = await db
    .delete(projectCategories)
    .where(and(eq(projectCategories.id, categoryLinkId), eq(projectCategories.projectId, projectId)))
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
    details: `Removed ${CATEGORY_LABELS[result[0].category]}`,
  });

  return NextResponse.json({ success: true });
}
