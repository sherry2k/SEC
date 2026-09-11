import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { can } from "@/lib/permissions";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, PROJECT_STATUS_LABELS, type ProjectCategory } from "@/lib/checklist";
import ProjectChecklist from "@/components/ProjectChecklist";
import AddCategoryButton from "@/components/AddCategoryButton";
import DeleteProjectButton from "@/components/DeleteProjectButton";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("projects.view");
  const allowFinanceEdit = await financeCanEditProjects();
  const canEdit = can(user.role, "projects.edit", allowFinanceEdit);
  const canDelete = can(user.role, "projects.delete", allowFinanceEdit);

  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  const links = await db.select().from(projectCategories).where(eq(projectCategories.projectId, id));
  const linkedCategories = links.map((l) => l.category);

  const items = await db
    .select({
      id: projectChecklistItems.id,
      parentItemId: projectChecklistItems.parentItemId,
      status: projectChecklistItems.status,
      remarks: projectChecklistItems.remarks,
      category: checklistTemplates.category,
      name: checklistTemplates.name,
      sortOrder: checklistTemplates.sortOrder,
    })
    .from(projectChecklistItems)
    .innerJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id))
    .where(eq(projectChecklistItems.projectId, id));

  const sections = linkedCategories.map((category) => ({
    category,
    items: items
      .filter((i) => i.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({ id: i.id, name: i.name, status: i.status, remarks: i.remarks, parentItemId: i.parentItemId })),
  }));

  const availableCategories: ProjectCategory[] = PROJECT_CATEGORIES.filter((c) => !linkedCategories.includes(c));

  const details = [
    ["Client", project.clientName],
    ["Building / mall", project.buildingName],
    ["Unit / shop", project.unitNo],
    ["Plot No.", project.plotNo],
    ["Location", project.location],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">{project.projectCode}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-bold text-2xl text-[var(--sec-ink)]">{project.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--sec-line)] bg-white px-3 py-1 text-xs font-medium text-[var(--sec-muted)]">
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          {canEdit && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
            >
              <Pencil size={13} />
              Edit
            </Link>
          )}
          {canDelete && <DeleteProjectButton projectId={project.id} />}
        </div>
      </div>

      {details.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">{label}</dt>
              <dd className="text-[var(--sec-ink)]">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {project.notes && <p className="mt-4 text-sm text-[var(--sec-muted)]">{project.notes}</p>}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-bold text-lg text-[var(--sec-ink)]">Checklist</h2>
        {canEdit && <AddCategoryButton projectId={project.id} availableCategories={availableCategories} />}
      </div>

      <div className="mt-4">
        <ProjectChecklist sections={sections} projectId={project.id} canEdit={canEdit} />
      </div>
    </div>
  );
}
