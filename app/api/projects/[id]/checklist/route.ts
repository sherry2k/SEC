import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { projectCategories, projectChecklistItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { CATEGORY_LABELS } from "@/lib/checklist";

// Adds a one-off, project-specific checklist item — for a requirement that
// only applies to this project, not the standard template every project in
// that category gets. Not tied to any checklist_templates row. Scoped to
// one specific category LINK (not just a category name): a project can
// have the same category linked more than once, and a custom item must
// land in the one instance the person was looking at, not in whichever
// same-category instance happens to come first.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;
  const body = await request.json().catch(() => null);
  const categoryLinkId = typeof body?.categoryLinkId === "string" ? body.categoryLinkId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!categoryLinkId) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Enter a name for the item." }, { status: 400 });
  }

  const [link] = await db
    .select()
    .from(projectCategories)
    .where(and(eq(projectCategories.id, categoryLinkId), eq(projectCategories.projectId, projectId)))
    .limit(1);
  if (!link) {
    return NextResponse.json({ error: "That category isn't linked to this project." }, { status: 400 });
  }

  const [lastItem] = await db
    .select({ sortOrder: projectChecklistItems.sortOrder })
    .from(projectChecklistItems)
    .where(and(eq(projectChecklistItems.projectId, projectId), eq(projectChecklistItems.categoryLinkId, categoryLinkId)))
    .orderBy(desc(projectChecklistItems.sortOrder))
    .limit(1);
  const nextSortOrder = (lastItem?.sortOrder ?? 0) + 1;

  const [item] = await db
    .insert(projectChecklistItems)
    .values({
      projectId,
      category: link.category,
      categoryLinkId,
      customName: name,
      sortOrder: nextSortOrder,
      updatedBy: auth.user.id,
    })
    .returning();

  await logActivity({
    userId: auth.user.id,
    projectId,
    action: "checklist_item_added",
    targetName: name,
    details: `Added a custom checklist item to ${CATEGORY_LABELS[link.category]}`,
  });

  return NextResponse.json({ success: true, item }, { status: 201 });
}
