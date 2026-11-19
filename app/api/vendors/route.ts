import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const name = str(body?.name);
    if (!name) {
      return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
    }

    const [vendor] = await db
      .insert(vendors)
      .values({
        name,
        category: str(body?.category) || null,
        contactInfo: str(body?.contactInfo) || null,
        notes: str(body?.notes) || null,
        createdBy: auth.user.id,
      })
      .returning();

    await logActivity({
      userId: auth.user.id,
      action: "vendor_created",
      targetName: name,
    });

    return NextResponse.json({ success: true, vendor }, { status: 201 });
  } catch (error) {
    console.error("Create vendor error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
