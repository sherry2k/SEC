import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { checklistItemComments, projectChecklistItems } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId, itemId } = await params;
  const body = await request.json().catch(() => null);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  if (!comment) {
    return NextResponse.json({ error: "Enter a comment." }, { status: 400 });
  }

  const [item] = await db
    .select({ id: projectChecklistItems.id })
    .from(projectChecklistItems)
    .where(and(eq(projectChecklistItems.id, itemId), eq(projectChecklistItems.projectId, projectId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }

  const [row] = await db
    .insert(checklistItemComments)
    .values({ itemId, userId: auth.user.id, comment })
    .returning();

  return NextResponse.json({ success: true, comment: row }, { status: 201 });
}
