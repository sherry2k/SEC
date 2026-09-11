import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems } from "@/db/schema";
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

  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  const categoryLinks = await db.select().from(projectCategories);
  const checklistRows = await db
    .select({ projectId: projectChecklistItems.projectId, status: projectChecklistItems.status })
    .from(projectChecklistItems);

  const categoriesByProject = new Map<string, ProjectCategory[]>();
  for (const link of categoryLinks) {
    const list = categoriesByProject.get(link.projectId) ?? [];
    list.push(link.category);
    categoriesByProject.set(link.projectId, list);
  }

  const progressByProject = new Map<string, { approved: number; total: number }>();
  for (const item of checklistRows) {
    const entry = progressByProject.get(item.projectId) ?? { approved: 0, total: 0 };
    entry.total += 1;
    if (item.status === "approved") entry.approved += 1;
    progressByProject.set(item.projectId, entry);
  }

  const tableRows = rows.map((p) => ({
    id: p.id,
    projectCode: p.projectCode,
    name: p.name,
    clientName: p.clientName,
    buildingName: p.buildingName,
    unitNo: p.unitNo,
    location: p.location,
    status: p.status,
    categories: categoriesByProject.get(p.id) ?? [],
    progress: progressByProject.get(p.id) ?? { approved: 0, total: 0 },
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
          <ProjectsTable rows={tableRows} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}
