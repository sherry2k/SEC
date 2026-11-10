import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { portalCredentials } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { encryptSecret } from "@/lib/credentials-crypto";
import { logActivity } from "@/lib/activity";
import { PORTAL_CREDENTIAL_CATEGORIES } from "@/lib/portal-credentials-constants";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("credentials.manage");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const name = str(body?.name);
  const category = str(body?.category);
  const url = str(body?.url);
  const username = str(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";
  const notes = str(body?.notes);

  if (!name) {
    return NextResponse.json({ error: "Portal name is required." }, { status: 400 });
  }
  if (!PORTAL_CREDENTIAL_CATEGORIES.includes(category as (typeof PORTAL_CREDENTIAL_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  let passwordEnc: string;
  try {
    passwordEnc = encryptSecret(password);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not encrypt the password." }, { status: 500 });
  }

  const [row] = await db
    .insert(portalCredentials)
    .values({
      name,
      category,
      url: url || null,
      username: username || null,
      passwordEnc,
      notes: notes || null,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    })
    .returning();

  await logActivity({ userId: auth.user.id, action: "credential_created", targetName: name });

  return NextResponse.json({ success: true, id: row.id }, { status: 201 });
}
