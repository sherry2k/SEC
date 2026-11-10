import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { portalCredentials } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { encryptSecret } from "@/lib/credentials-crypto";
import { logActivity } from "@/lib/activity";
import { PORTAL_CREDENTIAL_CATEGORIES } from "@/lib/portal-credentials-constants";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("credentials.manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: portalCredentials.id }).from(portalCredentials).where(eq(portalCredentials.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Credential not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = str(body?.name);
  const category = str(body?.category);
  const url = str(body?.url);
  const username = str(body?.username);
  const notes = str(body?.notes);
  // Password is optional on edit: the form never pre-fills the real
  // password back in, so an empty field means "leave it unchanged" —
  // only re-encrypt and overwrite when a new one was actually typed.
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) {
    return NextResponse.json({ error: "Portal name is required." }, { status: 400 });
  }
  if (!PORTAL_CREDENTIAL_CATEGORIES.includes(category as (typeof PORTAL_CREDENTIAL_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  let passwordEnc: string | undefined;
  if (password) {
    try {
      passwordEnc = encryptSecret(password);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Could not encrypt the password." }, { status: 500 });
    }
  }

  await db
    .update(portalCredentials)
    .set({
      name,
      category,
      url: url || null,
      username: username || null,
      notes: notes || null,
      ...(passwordEnc ? { passwordEnc } : {}),
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(portalCredentials.id, id));

  await logActivity({ userId: auth.user.id, action: "credential_updated", targetName: name });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("credentials.manage");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db
    .select({ id: portalCredentials.id, name: portalCredentials.name })
    .from(portalCredentials)
    .where(eq(portalCredentials.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Credential not found." }, { status: 404 });
  }

  await db.delete(portalCredentials).where(eq(portalCredentials.id, id));
  await logActivity({ userId: auth.user.id, action: "credential_deleted", targetName: existing.name });

  return NextResponse.json({ success: true });
}
