import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects, clients } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { ACCOUNT_PROJECT_CATEGORIES } from "@/lib/checklist";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// A project can belong to more than one category (e.g. both BOC and CBC).
function parseCategories(v: unknown): { ok: true; value: string[] } | { ok: false } {
  if (v === undefined || v === null) return { ok: true, value: [] };
  if (!Array.isArray(v)) return { ok: false };
  const values = v.map((c) => str(c)).filter(Boolean);
  if (!values.every((c) => (ACCOUNT_PROJECT_CATEGORIES as readonly string[]).includes(c))) return { ok: false };
  return { ok: true, value: [...new Set(values)] };
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
  const clientId = str(body?.clientId);
  if (!clientId) {
    return NextResponse.json({ error: "Pick a client, or add a new one, first." }, { status: 400 });
  }

  const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) {
    return NextResponse.json({ error: "That client no longer exists. Pick another." }, { status: 400 });
  }

  const categories = parseCategories(body?.categories);
  if (!categories.ok) {
    return NextResponse.json({ error: "That's not a valid category." }, { status: 400 });
  }

  await db
    .update(accountProjects)
    .set({
      clientId,
      clientName: client.name,
      location: str(body?.location) || null,
      projectDetails: str(body?.projectDetails) || null,
      categories: categories.value,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(accountProjects.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "account_project_updated",
    targetName: client.name,
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