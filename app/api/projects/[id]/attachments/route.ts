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

  const blob = await put(`projects/${projectId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

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
