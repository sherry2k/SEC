import { requirePermission } from "@/lib/auth";
import { getProjectsForPrint } from "@/lib/projects-print-data";
import ProjectsListPrintBody from "@/components/ProjectsListPrintBody";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";

export default async function ProjectsListPrintSourcePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requirePermission("projects.view");
  const { category } = await searchParams;
  const categoryFilter = category && PROJECT_CATEGORIES.includes(category as ProjectCategory) ? (category as ProjectCategory) : undefined;
  const rows = await getProjectsForPrint(categoryFilter);

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      <ProjectsListPrintBody rows={rows} categoryLabel={categoryFilter ? CATEGORY_LABELS[categoryFilter] : null} />
    </div>
  );
}
