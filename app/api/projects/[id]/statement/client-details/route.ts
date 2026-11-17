import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Persists the Statement of Account's own "Client Details" override —
// statementClientName/Address/Trn on the projects row — independent of
// the project's own clientName/location, same as Tax Invoice's editable
// client fields. Gated by accounts.edit, same as the project totalAmount
// special case in app/api/projects/[id]/route.ts, since this is accounts
// paperwork rather than general project-record editing.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const [existing] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  await db
    .update(projects)
    .set({
      statementClientName: str(body?.clientName) || null,
      statementClientAddress: str(body?.clientAddress) || null,
      statementClientTrn: str(body?.clientTrn) || null,
      updatedBy: auth.user.id,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  await logActivity({
    userId: auth.user.id,
    projectId: id,
    action: "project_updated",
    targetName: str(body?.clientName) || "Statement of Account",
    details: "Fields changed: statement client details",
  });

  return NextResponse.json({ success: true });
}
