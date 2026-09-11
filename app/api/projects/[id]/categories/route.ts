import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { addCategoryToProject } from "@/lib/projects";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/checklist";

// Links one more category onto an existing project (framework doc 3.3 —
// projects aren't locked to the category chosen at creation).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const category = body?.category as ProjectCategory | undefined;

  if (!category || !PROJECT_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  await addCategoryToProject(projectId, category);

  return NextResponse.json({ success: true });
}
