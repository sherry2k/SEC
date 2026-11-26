import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { checklistTemplates, projectCategories, projectChecklistItems } from "@/db/schema";
import type { ProjectCategory } from "@/lib/checklist";

// Copies one category's checklist_templates onto a project as new
// project_checklist_items, preserving the parent/child structure (e.g.
// Contractor → Inspection → its 8 inspection types). A project can link the
// same category more than once (e.g. a second, independent BOC submission
// later on) — each call always adds a fresh link and its own fresh set of
// items, tied together by the new link's id, rather than reusing an
// existing link for that category. Returns the new link's id so a caller
// that needs it (none currently do) can use it right away.
export async function addCategoryToProject(projectId: string, category: ProjectCategory): Promise<string> {
  const [link] = await db.insert(projectCategories).values({ projectId, category }).returning({ id: projectCategories.id });

  const templates = await db
    .select()
    .from(checklistTemplates)
    .where(eq(checklistTemplates.category, category));

  const topLevel = templates.filter((t) => t.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
  const children = templates.filter((t) => t.parentId !== null).sort((a, b) => a.sortOrder - b.sortOrder);

  const templateIdToItemId = new Map<number, string>();

  for (const t of topLevel) {
    const [row] = await db
      .insert(projectChecklistItems)
      .values({ projectId, templateId: t.id, category, categoryLinkId: link.id, sortOrder: t.sortOrder })
      .returning({ id: projectChecklistItems.id });
    templateIdToItemId.set(t.id, row.id);
  }

  for (const t of children) {
    const parentItemId = t.parentId ? templateIdToItemId.get(t.parentId) : undefined;
    const [row] = await db
      .insert(projectChecklistItems)
      .values({ projectId, templateId: t.id, category, categoryLinkId: link.id, sortOrder: t.sortOrder, parentItemId })
      .returning({ id: projectChecklistItems.id });
    templateIdToItemId.set(t.id, row.id);
  }

  return link.id;
}
