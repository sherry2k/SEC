import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Same Statement of Account "Client Details" override as
// app/api/projects/[id]/statement/client-details/route.ts, but for the
// Account Projects path — statementClientName/Address/Trn on the
// accountProjects row, independent of its own clientName/location.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: accountProjects.id }).from(accountProjects).where(eq(accountProjects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  await db
    .update(accountProjects)
    .set({
      statementClientName: str(body?.clientName) || null,
      statementClientAddress: str(body?.clientAddress) || null,
      statementClientTrn: str(body?.clientTrn) || null,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(accountProjects.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "account_project_updated",
    targetName: str(body?.clientName) || "Statement of Account",
  });

  return NextResponse.json({ success: true });
}
