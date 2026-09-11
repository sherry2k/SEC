import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { addCategoryToProject } from "@/lib/projects";
import { touchProject, logActivity } from "@/lib/activity";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

// Links one more category onto an existing project (framework doc 3.3 —
// projects aren't locked to the category chosen at creation).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizePermissionApi("projects.edit");
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const category = body?.category as ProjectCategory | undefined;

  if (!category || !PROJECT_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }

  await addCategoryToProject(projectId, category);
  await touchProject(projectId, auth.user.id);
  await logActivity({
    userId: auth.user.id,
    projectId,
    action: "category_added",
    targetName: project.name,
    details: `Linked ${CATEGORY_LABELS[category]}`,
  });

  return NextResponse.json({ success: true });
}
