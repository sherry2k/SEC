import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";

const EDITABLE_TEXT_FIELDS = ["name", "clientName", "buildingName", "unitNo", "plotNo", "location", "notes"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: Partial<Record<(typeof EDITABLE_TEXT_FIELDS)[number], string | null>> = {};
  for (const field of EDITABLE_TEXT_FIELDS) {
    const value = body?.[field];
    if (typeof value === "string") {
      update[field] = value.trim() || null;
    }
  }

  if (update.name === null || update.name === "") {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const result = await db
    .update(projects)
    .set(update as Partial<typeof projects.$inferInsert>)
    .where(eq(projects.id, id))
    .returning({ id: projects.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// project_categories and project_checklist_items are ON DELETE CASCADE, so
// removing the project row cleans up its checklist and category links too.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.delete");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const result = await db.delete(projects).where(eq(projects.id, id)).returning({ id: projects.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
