"use client";

import { CATEGORY_LABELS, CATEGORY_ACCENT_BORDER, type ProjectCategory } from "@/lib/checklist";
import ChecklistItemRow, { type ChecklistItem } from "@/components/ChecklistItemRow";

type CategorySection = { category: ProjectCategory; items: ChecklistItem[] };

// Renders each linked category as its own card, with items indented one
// level under their parent (only Contractor → Inspection currently nests).
function renderTree(items: ChecklistItem[], projectId: string, canEdit: boolean) {
  const topLevel = items.filter((i) => i.parentItemId === null);
  const childrenByParent = new Map<string, ChecklistItem[]>();
  for (const i of items) {
    if (i.parentItemId) {
      const list = childrenByParent.get(i.parentItemId) ?? [];
      list.push(i);
      childrenByParent.set(i.parentItemId, list);
    }
  }

  return topLevel.map((item) => (
    <div key={item.id}>
      <ChecklistItemRow item={item} projectId={projectId} depth={0} canEdit={canEdit} />
      {(childrenByParent.get(item.id) ?? []).map((child) => (
        <ChecklistItemRow key={child.id} item={child} projectId={projectId} depth={1} canEdit={canEdit} />
      ))}
    </div>
  ));
}

export default function ProjectChecklist({
  sections,
  projectId,
  canEdit,
}: {
  sections: CategorySection[];
  projectId: string;
  canEdit: boolean;
}) {
  if (sections.length === 0) {
    return <p className="text-sm text-[var(--sec-muted)]">No categories linked yet.</p>;
  }

  return (
    <div className="space-y-6">
      {sections.map(({ category, items }) => (
        <div key={category} className={`rounded-lg border border-l-4 border-[var(--sec-line)] bg-white ${CATEGORY_ACCENT_BORDER[category]}`}>
          <div className="border-b border-[var(--sec-line)] px-4 py-3">
            <h3 className="font-bold text-base text-[var(--sec-ink)]">{CATEGORY_LABELS[category]}</h3>
          </div>
          <div className="px-4 py-1">{renderTree(items, projectId, canEdit)}</div>
        </div>
      ))}
    </div>
  );
}
