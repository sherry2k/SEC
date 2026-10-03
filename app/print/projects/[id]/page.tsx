import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getProjectForPrint } from "@/lib/project-print-data";
import ProjectPrintBody from "@/components/ProjectPrintBody";

export default async function ProjectDetailPrintSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("projects.view");
  const { id } = await params;
  const project = await getProjectForPrint(id, user.role);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-[780px] px-2 text-[13px] leading-normal text-[var(--sec-ink)]">
      <ProjectPrintBody project={project} />
    </div>
  );
}
