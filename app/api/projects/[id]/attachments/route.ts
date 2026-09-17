import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectAttachments } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { touchProject, logActivity } from "@/lib/activity";

const ALLOWED_EXTENSIONS = ["dwg", "dxf", "pdf", "jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB — generous for a drawing set, bounded so one upload can't run away

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is larger than the 50MB limit." }, { status: 400 });
  }

  let blob;
  try {
    blob = await put(`projects/${projectId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (error) {
    // Vercel's current default way of connecting a Blob store to a
    // project uses OIDC credentials (BLOB_STORE_ID + an auto-rotated
    // token Vercel injects at deploy time), not the older static
    // BLOB_READ_WRITE_TOKEN — so don't assume that specific variable is
    // the problem. The most common real cause either way is a
    // deployment that predates the store being connected, since neither
    // credential type is added to an already-running deployment.
    console.error("Blob upload failed:", error);
    return NextResponse.json(
      {
        error:
          "Upload failed. If you just connected the Blob store, make sure you've redeployed since then — " +
          "Vercel only gives a deployment access to storage that existed before it was built.",
      },
      { status: 500 }
    );
  }

  const [attachment] = await db
    .insert(projectAttachments)
    .values({
      projectId,
      fileName: file.name,
      fileUrl: blob.url,
      fileSizeBytes: file.size,
      contentType: file.type || null,
      uploadedBy: auth.user.id,
    })
    .returning();

  await touchProject(projectId, auth.user.id);
  await logActivity({
    userId: auth.user.id,
    projectId,
    action: "attachment_added",
    targetName: file.name,
  });

  return NextResponse.json({ success: true, attachment }, { status: 201 });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.view");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;
  const rows = await db
    .select()
    .from(projectAttachments)
    .where(eq(projectAttachments.projectId, projectId))
    .orderBy(desc(projectAttachments.uploadedAt));

  return NextResponse.json({ attachments: rows });
}
