import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import EditProjectForm from "@/components/EditProjectForm";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("projects.edit");

  const { id } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">{project.projectCode}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit project</h1>

      <div className="mt-8 max-w-2xl">
        <EditProjectForm
          projectId={project.id}
          initial={{
            name: project.name,
            clientName: project.clientName ?? "",
            buildingName: project.buildingName ?? "",
            unitNo: project.unitNo ?? "",
            plotNo: project.plotNo ?? "",
            location: project.location ?? "",
            notes: project.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
