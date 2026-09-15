import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { authorizePermissionApi } from "@/lib/auth";
import { nextDocumentCode } from "@/lib/sequences";
import { addCategoryToProject } from "@/lib/projects";
import { getAssignableUsers } from "@/lib/assignable-users";
import { logActivity } from "@/lib/activity";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

export async function POST(request: NextRequest) {
  const auth = await authorizePermissionApi("projects.create");
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : "";
    const buildingName = typeof body?.buildingName === "string" ? body.buildingName.trim() : "";
    const unitNo = typeof body?.unitNo === "string" ? body.unitNo.trim() : "";
    const plotNo = typeof body?.plotNo === "string" ? body.plotNo.trim() : "";
    const municipalityNo = typeof body?.municipalityNo === "string" ? body.municipalityNo.trim() : "";
    const location = typeof body?.location === "string" ? body.location.trim() : "";
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
    const responsibleId = typeof body?.responsibleId === "number" ? body.responsibleId : null;
    const categories: unknown[] = Array.isArray(body?.categories) ? body.categories : [];

    if (!name) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    if (responsibleId !== null) {
      const assignable = await getAssignableUsers();
      if (!assignable.some((u) => u.id === responsibleId)) {
        return NextResponse.json({ error: "Choose a valid person for Responsible." }, { status: 400 });
      }
    }

    const validCategories = categories.filter((c): c is ProjectCategory =>
      PROJECT_CATEGORIES.includes(c as ProjectCategory)
    );
    if (validCategories.length === 0) {
      return NextResponse.json({ error: "Select at least one category." }, { status: 400 });
    }

    const projectCode = await nextDocumentCode("PRJ");

    const [project] = await db
      .insert(projects)
      .values({
        projectCode,
        name,
        clientName: clientName || null,
        buildingName: buildingName || null,
        unitNo: unitNo || null,
        plotNo: plotNo || null,
        municipalityNo: municipalityNo || null,
        location: location || null,
        notes: notes || null,
        responsibleId,
        createdBy: auth.user.id,
        updatedBy: auth.user.id,
      })
      .returning();

    for (const category of validCategories) {
      await addCategoryToProject(project.id, category);
    }

    await logActivity({
      userId: auth.user.id,
      projectId: project.id,
      action: "project_created",
      targetName: project.name,
      details: `Categories: ${validCategories.map((c) => CATEGORY_LABELS[c]).join(", ")}`,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Something went wrong on the server. Try again." },
      { status: 500 }
    );
  }
}
