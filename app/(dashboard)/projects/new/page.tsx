import { requirePermission } from "@/lib/auth";
import { getAssignableUsers } from "@/lib/assignable-users";
import NewProjectForm from "@/components/NewProjectForm";

export default async function NewProjectPage() {
  const user = await requirePermission("projects.create");
  const assignableUsers = await getAssignableUsers();
  // master_admin is never assignable (it's excluded from getAssignableUsers),
  // so only default Responsible to "self" for roles that are actually
  // eligible — Tecto creating a project still starts on "Unassigned".
  const defaultResponsibleId = user.role === "master_admin" ? null : user.id;

  return (
    <div>
      <h1 className="font-bold text-2xl text-[var(--sec-ink)]">Add project</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        Pick at least one category — its checklist is added automatically. You
        can link more categories later from the project page.
      </p>
      <div className="mt-8 max-w-2xl">
        <NewProjectForm assignableUsers={assignableUsers} defaultResponsibleId={defaultResponsibleId} />
      </div>
    </div>
  );
}
