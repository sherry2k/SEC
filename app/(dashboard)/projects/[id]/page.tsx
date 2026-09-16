import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { can } from "@/lib/permissions";
import { visibleActorName } from "@/lib/visibility";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";
import ProjectChecklist from "@/components/ProjectChecklist";
import AddCategoryButton from "@/components/AddCategoryButton";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import ProjectStatusControl from "@/components/ProjectStatusControl";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("projects.view");
  const allowFinanceEdit = await financeCanEditProjects();
  const canEdit = can(user.role, "projects.edit", allowFinanceEdit);
  const canDelete = can(user.role, "projects.delete", allowFinanceEdit);

  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  const [updatedByUser] = project.updatedBy
    ? await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, project.updatedBy)).limit(1)
    : [null];
  const updatedByDisplayName = updatedByUser ? visibleActorName(updatedByUser.role, updatedByUser.name, user.role) : null;

  const [responsibleUser] = project.responsibleId
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, project.responsibleId)).limit(1)
    : [null];

  const [completedByUser] = project.completedBy
    ? await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, project.completedBy)).limit(1)
    : [null];
  const completedByDisplayName = completedByUser
    ? visibleActorName(completedByUser.role, completedByUser.name, user.role)
    : null;

  const links = await db.select().from(projectCategories).where(eq(projectCategories.projectId, id));
  const linkedCategories = links.map((l) => l.category);

  const items = await db
    .select({
      id: projectChecklistItems.id,
      parentItemId: projectChecklistItems.parentItemId,
      status: projectChecklistItems.status,
      remarks: projectChecklistItems.remarks,
      dueDate: projectChecklistItems.dueDate,
      submittedAt: projectChecklistItems.submittedAt,
      submittedByName: users.name,
      submittedByRole: users.role,
      approvedAt: projectChecklistItems.approvedAt,
      category: checklistTemplates.category,
      name: checklistTemplates.name,
      sortOrder: checklistTemplates.sortOrder,
    })
    .from(projectChecklistItems)
    .innerJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id))
    .leftJoin(users, eq(projectChecklistItems.submittedBy, users.id))
    .where(eq(projectChecklistItems.projectId, id));

  const sections = linkedCategories.map((category) => ({
    category,
    items: items
      .filter((i) => i.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({
        id: i.id,
        name: i.name,
        status: i.status,
        remarks: i.remarks,
        parentItemId: i.parentItemId,
        dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : null,
        submittedByName: visibleActorName(i.submittedByRole, i.submittedByName, user.role),
        submittedAt: i.submittedAt ? i.submittedAt.toISOString() : null,
        approvedAt: i.approvedAt ? i.approvedAt.toISOString() : null,
      })),
  }));

  const availableCategories: ProjectCategory[] = PROJECT_CATEGORIES.filter((c) => !linkedCategories.includes(c));

  const details = [
    ["Project No.", project.municipalityNo],
    ["Client", project.clientName],
    ["Building / mall", project.buildingName],
    ["Unit / shop", project.unitNo],
    ["Plot No.", project.plotNo],
    ["Location", project.location],
    ["Responsible", responsibleUser?.name ?? null],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">Ref: {project.projectCode}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-bold text-2xl text-[var(--sec-ink)]">{project.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusControl projectId={project.id} initialStatus={project.status} canEdit={canEdit} />
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

      <p className="mt-4 text-xs text-[var(--sec-muted)]">
        Last updated{" "}
        {project.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        {updatedByDisplayName && ` by ${updatedByDisplayName}`}
      </p>

      {project.status === "completed" && project.completedAt && (
        <p className="mt-1 text-xs font-medium text-emerald-700">
          Completed{completedByDisplayName && ` by ${completedByDisplayName}`} on{" "}
          {project.completedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      )}

      {project.notes && <p className="mt-4 text-sm text-[var(--sec-muted)]">{project.notes}</p>}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-bold text-lg text-[var(--sec-ink)]">Checklist</h2>
        {canEdit && <AddCategoryButton projectId={project.id} availableCategories={availableCategories} />}
      </div>

      <div className="mt-4">
        <ProjectChecklist sections={sections} projectId={project.id} canEdit={canEdit} currentUserName={user.name} />
      </div>
    </div>
  );
}
