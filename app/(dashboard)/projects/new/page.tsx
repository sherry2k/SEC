import { requirePermission } from "@/lib/auth";
import NewProjectForm from "@/components/NewProjectForm";

export default async function NewProjectPage() {
  await requirePermission("projects.create");

  return (
    <div>
      <h1 className="font-bold text-2xl text-[var(--sec-ink)]">Add project</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        Pick at least one category — its checklist is added automatically. You
        can link more categories later from the project page.
      </p>
      <div className="mt-8 max-w-2xl">
        <NewProjectForm />
      </div>
    </div>
  );
}
