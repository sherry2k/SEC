import { NextRequest, NextResponse } from "next/server";
import { ilike, desc } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Used by the Client Picker on the Account Project form (type-ahead search)
// and the Clients list page — same shape/limit pattern as
// /api/account-projects' GET.
export async function GET(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.view");
  if (!auth.ok) return auth.response;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const rows = await db
    .select({ id: clients.id, name: clients.name, address: clients.address })
    .from(clients)
    .where(q ? ilike(clients.name, `%${q}%`) : undefined)
    .orderBy(desc(clients.createdAt))
    .limit(q ? 8 : 100);

  return NextResponse.json({ results: rows });
}

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const name = str(body?.name);
    if (!name) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 });
    }

    const [client] = await db
      .insert(clients)
      .values({
        name,
        address: str(body?.address) || null,
        trn: str(body?.trn) || null,
        contactInfo: str(body?.contactInfo) || null,
        notes: str(body?.notes) || null,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    await logActivity({
      userId: auth.user.id,
      action: "client_created",
      targetName: name,
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
}
