import { requirePermission } from "@/lib/auth";
import { getProjectsForPrint } from "@/lib/projects-print-data";
import ProjectsListPrintBody from "@/components/ProjectsListPrintBody";

export default async function ProjectsListPrintSourcePage() {
  await requirePermission("projects.view");
  const rows = await getProjectsForPrint();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      <ProjectsListPrintBody rows={rows} />
    </div>
  );
}
