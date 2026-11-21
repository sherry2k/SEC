import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { ACCOUNT_PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

// Single-purpose route, same reasoning as /api/vendor-payments/[id]/status —
// lets the inline dropdown on the Account Projects list change just the
// category without going through the full edit form (and its required
// client-name field).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const category = typeof body?.category === "string" ? body.category.trim() : "";

  if (category && !(ACCOUNT_PROJECT_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "That's not a valid category." }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: accountProjects.id, clientName: accountProjects.clientName })
    .from(accountProjects)
    .where(eq(accountProjects.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await db
    .update(accountProjects)
    .set({ category: category || null, updatedBy: auth.user.id, updatedAt: new Date() })
    .where(eq(accountProjects.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "account_project_updated",
    targetName: `${existing.clientName} (category → ${category ? CATEGORY_LABELS[category as ProjectCategory] : "none"})`,
  });

  return NextResponse.json({ success: true });
}
