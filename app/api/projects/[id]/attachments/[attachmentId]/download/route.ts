import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projectAttachments } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

// The store is private (Vercel's current default), so the blob's own URL
// can't be opened directly by the browser — it requires the Authorization
// header the SDK adds server-side. This route is that server-side hop:
// check the person can actually view this project, then stream the file
// through using the same credentials the upload used.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const auth = await authorizePermissionApi("projects.view");
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

  const result = await get(attachment.fileUrl, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
  }

  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": attachment.contentType || result.blob.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${attachment.fileName}"`,
    },
  });
}
