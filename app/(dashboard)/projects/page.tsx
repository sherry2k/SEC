import Link from "next/link";
import { Plus } from "lucide-react";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { can } from "@/lib/permissions";
import { visibleActorName } from "@/lib/visibility";
import { getAssignableUsers } from "@/lib/assignable-users";
import { classifyTask } from "@/lib/task-urgency";
import type { TaskUrgency } from "@/lib/task-urgency";
import type { ProjectCategory } from "@/lib/checklist";
import ProjectsTable, { type MyTask } from "@/components/ProjectsTable";

export default async function ProjectsPage() {
  const user = await requirePermission("projects.view");
  const allowFinanceEdit = await financeCanEditProjects();
  const canCreate = can(user.role, "projects.create", allowFinanceEdit);
  const canEdit = can(user.role, "projects.edit", allowFinanceEdit);
  const canDelete = can(user.role, "projects.delete", allowFinanceEdit);
  const assignableUsers = await getAssignableUsers();

  const responsibleUsers = alias(users, "responsible_users");
  const completedByUsers = alias(users, "completed_by_users");

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
      updatedByRole: users.role,
      responsibleId: projects.responsibleId,
      responsibleName: responsibleUsers.name,
      completedByName: completedByUsers.name,
      completedByRole: completedByUsers.role,
      completedAt: projects.completedAt,
    })
    .from(projects)
    .leftJoin(users, eq(projects.updatedBy, users.id))
    .leftJoin(responsibleUsers, eq(projects.responsibleId, responsibleUsers.id))
    .leftJoin(completedByUsers, eq(projects.completedBy, completedByUsers.id))
    .orderBy(desc(projects.updatedAt));

  const categoryLinks = await db.select().from(projectCategories);
  const checklistRows = await db
    .select({
      id: projectChecklistItems.id,
      projectId: projectChecklistItems.projectId,
      status: projectChecklistItems.status,
      dueDate: projectChecklistItems.dueDate,
      updatedAt: projectChecklistItems.updatedAt,
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

  // Same idea as Current Activity, but for the due date: whichever open
  // task on this project is most urgent (overdue beats due-today beats a
  // future date), so the list shows at a glance which projects are behind.
  const dueUrgencyOrder: Record<TaskUrgency, number> = { overdue: 0, due_today: 1, in_progress: 2 };
  const dueByProject = new Map<string, { dueDate: string; urgency: TaskUrgency }>();
  for (const item of checklistRows) {
    if (!item.dueDate) continue;
    const urgency = classifyTask(item.dueDate, item.status);
    if (!urgency) continue;
    const dueDate = item.dueDate.toISOString().slice(0, 10);
    const current = dueByProject.get(item.projectId);
    if (
      !current ||
      dueUrgencyOrder[urgency] < dueUrgencyOrder[current.urgency] ||
      (dueUrgencyOrder[urgency] === dueUrgencyOrder[current.urgency] && dueDate < current.dueDate)
    ) {
      dueByProject.set(item.projectId, { dueDate, urgency });
    }
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
    updatedByName: visibleActorName(p.updatedByRole, p.updatedByName, user.role),
    responsibleId: p.responsibleId,
    responsibleName: p.responsibleName,
    completedByName: visibleActorName(p.completedByRole, p.completedByName, user.role),
    completedAt: p.completedAt ? p.completedAt.toISOString() : null,
    categories: categoriesByProject.get(p.id) ?? [],
    progress: progressByProject.get(p.id) ?? { approved: 0, total: 0 },
    currentActivity: currentActivityByProject.get(p.id) ?? null,
    dueInfo: dueByProject.get(p.id) ?? null,
  }));

  // My Tasks — every open checklist item across projects where the viewer
  // is Responsible. "Open" = not yet Approved or marked Not applicable.
  const myProjectIds = new Set(rows.filter((p) => p.responsibleId === user.id).map((p) => p.id));
  const projectLabelById = new Map(rows.map((p) => [p.id, p.municipalityNo || p.projectCode]));

  const myTasks: MyTask[] = checklistRows
    .filter((i) => myProjectIds.has(i.projectId) && classifyTask(i.dueDate, i.status) !== null)
    .map((i) => ({
      projectId: i.projectId,
      projectLabel: projectLabelById.get(i.projectId) ?? "",
      taskName: i.name,
      dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : null,
      urgency: classifyTask(i.dueDate, i.status)!,
    }));

  const urgencyOrder = { overdue: 0, due_today: 1, in_progress: 2 };
  myTasks.sort((a, b) => {
    const byUrgency = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (byUrgency !== 0) return byUrgency;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const completedThisWeekCount = checklistRows.filter(
    (i) => myProjectIds.has(i.projectId) && i.status === "approved" && i.updatedAt >= weekAgo
  ).length;

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
          <ProjectsTable
            rows={tableRows}
            canEdit={canEdit}
            canDelete={canDelete}
            currentUserId={user.id}
            currentUserName={user.name}
            defaultToMine={user.role === "staff"}
            assignableUsers={assignableUsers}
            myTasks={myTasks}
            completedThisWeekCount={completedThisWeekCount}
          />
        </div>
      )}
    </div>
  );
}
