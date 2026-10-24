import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: accountProjects.id }).from(accountProjects).where(eq(accountProjects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const clientName = str(body?.clientName);
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }

  await db
    .update(accountProjects)
    .set({
      clientName,
      location: str(body?.location) || null,
      projectDetails: str(body?.projectDetails) || null,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(accountProjects.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "account_project_updated",
    targetName: clientName,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [accountProject] = await db.select({ clientName: accountProjects.clientName }).from(accountProjects).where(eq(accountProjects.id, id)).limit(1);
  if (!accountProject) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await logActivity({
    userId: auth.user.id,
    action: "account_project_deleted",
    targetName: accountProject.clientName,
  });

  await db.delete(accountProjects).where(eq(accountProjects.id, id));

  return NextResponse.json({ success: true });
}