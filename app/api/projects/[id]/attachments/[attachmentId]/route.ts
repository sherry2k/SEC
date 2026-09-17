import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectAttachments } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { touchProject, logActivity } from "@/lib/activity";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId, attachmentId } = await params;

  const [attachment] = await db
    .select()
    .from(projectAttachments)
    .where(and(eq(projectAttachments.id, attachmentId), eq(projectAttachments.projectId, projectId)))
    .limit(1);

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  // Best-effort: remove the underlying Blob object too, but don't let a
  // storage-side failure block deleting the record — an orphaned blob
  // costs a negligible amount, whereas a delete that silently does
  // nothing is confusing.
  try {
    await del(attachment.fileUrl);
  } catch (error) {
    console.error("Failed to delete blob, removing database record anyway:", error);
  }

  await db.delete(projectAttachments).where(eq(projectAttachments.id, attachmentId));
  await touchProject(projectId, auth.user.id);
  await logActivity({
    userId: auth.user.id,
    projectId,
    action: "attachment_removed",
    targetName: attachment.fileName,
  });

  return NextResponse.json({ success: true });
}
