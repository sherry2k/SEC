import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
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
    const clientName = str(body?.clientName);
    if (!clientName) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    const [accountProject] = await db
      .insert(accountProjects)
      .values({
        clientName,
        location: str(body?.location) || null,
        projectDetails: str(body?.projectDetails) || null,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await logActivity({
      userId: auth.user.id,
      action: "account_project_created",
      targetName: clientName,
    });

    return NextResponse.json({ success: true, accountProject }, { status: 201 });
  } catch (error) {
    console.error("Create account project error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}