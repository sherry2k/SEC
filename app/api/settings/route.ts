import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

// Only settings the UI is actually allowed to change go here — this is a
// deliberate allowlist, not a generic key-value writer, so a stray request
// body can't quietly create or overwrite an unrelated setting row.
const SETTABLE_KEYS = new Set(["finance_can_edit_projects"]);

export async function PATCH(request: NextRequest) {
  const auth = await authorizePermissionApi("settings.manage");
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const value = typeof body?.value === "string" ? body.value : "";

  if (!SETTABLE_KEYS.has(key)) {
    return NextResponse.json({ error: "That setting can't be changed here." }, { status: 400 });
  }

  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });

  return NextResponse.json({ success: true });
}
