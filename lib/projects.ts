import "server-only";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { checklistTemplates, projectCategories, projectChecklistItems } from "@/db/schema";
import type { ProjectCategory } from "@/lib/checklist";

// Copies one category's checklist_templates onto a project as new
// project_checklist_items, preserving the parent/child structure (e.g.
// Contractor → Inspection → its 8 inspection types). Safe to call more than
// once for different categories on the same project — each call only adds
// the items for the category passed in.
export async function addCategoryToProject(projectId: string, category: ProjectCategory) {
  const [existingLink] = await db
    .select()
    .from(projectCategories)
    .where(and(eq(projectCategories.projectId, projectId), eq(projectCategories.category, category)))
    .limit(1);

  if (existingLink) return; // category already linked — don't duplicate the checklist

  await db.insert(projectCategories).values({ projectId, category });

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
      .values({ projectId, templateId: t.id })
      .returning({ id: projectChecklistItems.id });
    templateIdToItemId.set(t.id, row.id);
  }

  for (const t of children) {
    const parentItemId = t.parentId ? templateIdToItemId.get(t.parentId) : undefined;
    const [row] = await db
      .insert(projectChecklistItems)
      .values({ projectId, templateId: t.id, parentItemId })
      .returning({ id: projectChecklistItems.id });
    templateIdToItemId.set(t.id, row.id);
  }
}
