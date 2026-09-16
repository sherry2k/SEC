import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { checklistItemComments, projectChecklistItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; commentId: string }> }
) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId, itemId, commentId } = await params;

  // Verify the comment actually belongs to an item on this project, so
  // someone can't delete a comment by ID alone from an unrelated project.
  const [item] = await db
    .select({ id: projectChecklistItems.id })
    .from(projectChecklistItems)
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  const result = await db
    .delete(checklistItemComments)
    .where(and(eq(checklistItemComments.id, commentId), eq(checklistItemComments.itemId, itemId)))
    .returning({ id: checklistItemComments.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
