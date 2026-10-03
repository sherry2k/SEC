import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates, checklistItemComments, users } from "@/db/schema";
import { visibleActorName } from "@/lib/visibility";
import type { Role } from "@/lib/roles";

// Fetches exactly what ProjectPrintView consumes — the same query shape
// as the interactive detail page, minus attachments/financials, which
// aren't part of that print view. Kept separate from the interactive
// page's own queries rather than shared, so this never risks changing
// behavior there.
export async function getProjectForPrint(id: string, viewerRole: Role) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) return null;

  const [updatedByUser] = project.updatedBy
    ? await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, project.updatedBy)).limit(1)
    : [null];
  const updatedByDisplayName = updatedByUser ? visibleActorName(updatedByUser.role, updatedByUser.name, viewerRole) : null;

  const [completedByUser] = project.completedBy
    ? await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, project.completedBy)).limit(1)
    : [null];
  const completedByDisplayName = completedByUser ? visibleActorName(completedByUser.role, completedByUser.name, viewerRole) : null;

  const [responsibleUser] = project.responsibleId
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, project.responsibleId)).limit(1)
    : [null];

  const links = await db.select().from(projectCategories).where(eq(projectCategories.projectId, id));
  const linkedCategories = links.map((l) => l.category);

  const items = await db
    .select({
      id: projectChecklistItems.id,
      parentItemId: projectChecklistItems.parentItemId,
      status: projectChecklistItems.status,
      dueDate: projectChecklistItems.dueDate,
      submittedAt: projectChecklistItems.submittedAt,
      submittedByName: users.name,
      submittedByRole: users.role,
      approvedAt: projectChecklistItems.approvedAt,
      category: projectChecklistItems.category,
      templateId: projectChecklistItems.templateId,
      customName: projectChecklistItems.customName,
      templateName: checklistTemplates.name,
      sortOrder: projectChecklistItems.sortOrder,
    })
    .from(projectChecklistItems)
    .leftJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id))
    .leftJoin(users, eq(projectChecklistItems.submittedBy, users.id))
    .where(eq(projectChecklistItems.projectId, id));

  const commentRows = await db
    .select({
      id: checklistItemComments.id,
      itemId: checklistItemComments.itemId,
      comment: checklistItemComments.comment,
      createdAt: checklistItemComments.createdAt,
      authorName: users.name,
    })
    .from(checklistItemComments)
    .innerJoin(projectChecklistItems, eq(checklistItemComments.itemId, projectChecklistItems.id))
    .leftJoin(users, eq(checklistItemComments.userId, users.id))
    .where(eq(projectChecklistItems.projectId, id))
    .orderBy(asc(checklistItemComments.createdAt));

  const commentsByItem = new Map<string, { id: string; comment: string; authorName: string | null; createdAt: string }[]>();
  for (const c of commentRows) {
    const list = commentsByItem.get(c.itemId) ?? [];
    list.push({ id: c.id, comment: c.comment, authorName: c.authorName, createdAt: c.createdAt.toISOString() });
    commentsByItem.set(c.itemId, list);
  }

  const sections = linkedCategories.map((category) => ({
    category,
    items: items
      .filter((i) => i.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({
        id: i.id,
        name: i.customName ?? i.templateName ?? "Untitled item",
        status: i.status,
        parentItemId: i.parentItemId,
        dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : null,
        submittedByName: visibleActorName(i.submittedByRole, i.submittedByName, viewerRole),
        submittedAt: i.submittedAt ? i.submittedAt.toISOString() : null,
        approvedAt: i.approvedAt ? i.approvedAt.toISOString() : null,
        comments: commentsByItem.get(i.id) ?? [],
        isCustom: i.templateId === null,
      })),
  }));

  const details = [
    ["Project No.", project.municipalityNo],
    ["Client", project.clientName],
    ["Building / mall", project.buildingName],
    ["Unit / shop", project.unitNo],
    ["Plot No.", project.plotNo],
    ["Location", project.location],
    ["Responsible", responsibleUser?.name ?? null],
  ].filter(([, value]) => value) as [string, string][];

  return {
    projectCode: project.projectCode,
    name: project.name,
    status: project.status,
    details,
    updatedAtLabel: project.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    updatedByDisplayName,
    completedByDisplayName,
    completedAtLabel:
      project.status === "completed" && project.completedAt
        ? project.completedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : null,
    notes: project.notes,
    sections,
  };
}
