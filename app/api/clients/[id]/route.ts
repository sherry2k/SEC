import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, accountProjects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = str(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }

  await db
    .update(clients)
    .set({
      name,
      address: str(body?.address) || null,
      trn: str(body?.trn) || null,
      contactInfo: str(body?.contactInfo) || null,
      notes: str(body?.notes) || null,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  // Deliberately NOT propagated to accountProjects.clientName — that stays
  // frozen at whatever it was when each project was created/last changed,
  // same reasoning as a quotation's client name never retroactively
  // changing when the Account Project it came from is renamed.
  await logActivity({
    userId: auth.user.id,
    action: "client_updated",
    targetName: name,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const [linkedProject] = await db
    .select({ id: accountProjects.id })
    .from(accountProjects)
    .where(eq(accountProjects.clientId, id))
    .limit(1);
  if (linkedProject) {
    return NextResponse.json(
      { error: "This client still has projects linked to them. Move or delete those projects first." },
      { status: 400 }
    );
  }

  await logActivity({
    userId: auth.user.id,
    action: "client_deleted",
    targetName: client.name,
  });

  await db.delete(clients).where(eq(clients.id, id));

  return NextResponse.json({ success: true });
}
