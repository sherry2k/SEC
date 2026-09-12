import Link from "next/link";
import { Plus } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { can } from "@/lib/permissions";
import type { ProjectCategory } from "@/lib/checklist";
import ProjectsTable from "@/components/ProjectsTable";

export default async function ProjectsPage() {
  const user = await requirePermission("projects.view");
  const allowFinanceEdit = await financeCanEditProjects();
  const canCreate = can(user.role, "projects.create", allowFinanceEdit);
  const canEdit = can(user.role, "projects.edit", allowFinanceEdit);
  const canDelete = can(user.role, "projects.delete", allowFinanceEdit);

  const rows = await db
    .select({
      id: projects.id,
      projectCode: projects.projectCode,
      municipalityNo: projects.municipalityNo,
      name: projects.name,
      clientName: projects.clientName,
      buildingName: projects.buildingName,
      unitNo: projects.unitNo,
      location: projects.location,
      status: projects.status,
      updatedAt: projects.updatedAt,
      updatedByName: users.name,
    })
    .from(projects)
    .leftJoin(users, eq(projects.updatedBy, users.id))
    .orderBy(desc(projects.updatedAt));

  const categoryLinks = await db.select().from(projectCategories);
  const checklistRows = await db
    .select({
      projectId: projectChecklistItems.projectId,
      status: projectChecklistItems.status,
      name: checklistTemplates.name,
      sortOrder: checklistTemplates.sortOrder,
    })
    .from(projectChecklistItems)
    .innerJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id));

  const categoriesByProject = new Map<string, ProjectCategory[]>();
  for (const link of categoryLinks) {
    const list = categoriesByProject.get(link.projectId) ?? [];
    list.push(link.category);
    categoriesByProject.set(link.projectId, list);
  }

  const progressByProject = new Map<string, { approved: number; total: number }>();
  // Whichever item is currently "submitted" or "resubmission" is the one
  // actively blocking progress — that's what shows in Current Activity.
  // Submitted takes priority over resubmission when both exist, and ties
  // break by checklist order (earlier items first).
  const currentActivityByProject = new Map<string, string>();
  const activityPriority: Record<string, number> = { submitted: 0, resubmission: 1 };

  const bestForProject = new Map<string, { priority: number; sortOrder: number; name: string }>();
  for (const item of checklistRows) {
    const progress = progressByProject.get(item.projectId) ?? { approved: 0, total: 0 };
    progress.total += 1;
    if (item.status === "approved") progress.approved += 1;
    progressByProject.set(item.projectId, progress);

    const priority = activityPriority[item.status];
    if (priority === undefined) continue;
    const current = bestForProject.get(item.projectId);
    if (!current || priority < current.priority || (priority === current.priority && item.sortOrder < current.sortOrder)) {
      bestForProject.set(item.projectId, { priority, sortOrder: item.sortOrder, name: item.name });
    }
  }
  for (const [projectId, best] of bestForProject) {
    currentActivityByProject.set(projectId, best.name);
  }

  const tableRows = rows.map((p) => ({
    id: p.id,
    projectCode: p.projectCode,
    municipalityNo: p.municipalityNo,
    name: p.name,
    clientName: p.clientName,
    buildingName: p.buildingName,
    unitNo: p.unitNo,
    location: p.location,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
    updatedByName: p.updatedByName,
    categories: categoriesByProject.get(p.id) ?? [],
    progress: progressByProject.get(p.id) ?? { approved: 0, total: 0 },
    currentActivity: currentActivityByProject.get(p.id) ?? null,
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Projects</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "project" : "projects"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Plus size={16} />
            Add project
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No projects yet.</p>
          {canCreate && (
            <Link href="/projects/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
              Add the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <ProjectsTable rows={tableRows} canEdit={canEdit} canDelete={canDelete} />
        </div>
      )}
    </div>
  );
}
