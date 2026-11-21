import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { ACCOUNT_PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

// Single-purpose route, same reasoning as /api/vendor-payments/[id]/status —
// lets the inline multi-select on the Account Projects list change just the
// categories without going through the full edit form (and its required
// client-name field). A project can hold more than one category (e.g.
// both BOC and CBC), so the body carries the full replacement array.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("accounts.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const raw = body?.categories;

  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "Invalid categories." }, { status: 400 });
  }
  const categories = [...new Set(raw.map((c) => (typeof c === "string" ? c.trim() : "")).filter(Boolean))];
  if (!categories.every((c) => (ACCOUNT_PROJECT_CATEGORIES as readonly string[]).includes(c))) {
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
    .set({ categories, updatedBy: auth.user.id, updatedAt: new Date() })
    .where(eq(accountProjects.id, id));

  await logActivity({
    userId: auth.user.id,
    action: "account_project_updated",
    targetName: `${existing.clientName} (categories → ${
      categories.length ? categories.map((c) => CATEGORY_LABELS[c as ProjectCategory]).join(", ") : "none"
    })`,
  });

  return NextResponse.json({ success: true });
}
