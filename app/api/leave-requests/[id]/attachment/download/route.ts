import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { can } from "@/lib/permissions";

// Same private-Blob proxy pattern as the project attachments download route
// (app/api/projects/[id]/attachments/[attachmentId]/download/route.ts) —
// the store is private, so the blob's own URL can't be opened directly by
// the browser (that's what was producing the Forbidden error and the
// off-site redirect). This route is the server-side hop: check the viewer
// is allowed to see this request (its own owner, or someone who can review
// leave requests — same access rule as the detail page itself), then
// stream the file through with the same credentials the upload used.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("leave_requests.create");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const [row] = await db
    .select({
      userId: leaveRequests.userId,
      attachmentUrl: leaveRequests.attachmentUrl,
      attachmentFileName: leaveRequests.attachmentFileName,
    })
    .from(leaveRequests)
    .where(eq(leaveRequests.id, id))
    .limit(1);

  if (!row || !row.attachmentUrl) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const isOwner = row.userId === auth.user.id;
  const canReview = can(auth.user.role, "leave_requests.review");
  if (!isOwner && !canReview) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const result = await get(row.attachmentUrl, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
  }

  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${row.attachmentFileName || "attachment"}"`,
    },
  });
}
