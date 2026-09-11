import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { projects, projectCategories } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { can } from "@/lib/permissions";
import { CATEGORY_LABELS, PROJECT_STATUS_LABELS, type ProjectCategory } from "@/lib/checklist";

export default async function ProjectsPage() {
  const user = await requirePermission("projects.view");
  const allowFinanceEdit = await financeCanEditProjects();
  const canCreate = can(user.role, "projects.create", allowFinanceEdit);

  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  const categoryLinks = await db.select().from(projectCategories);

  const categoriesByProject = new Map<string, ProjectCategory[]>();
  for (const link of categoryLinks) {
    const list = categoriesByProject.get(link.projectId) ?? [];
    list.push(link.category);
    categoriesByProject.set(link.projectId, list);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--sec-ink)]">Projects</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "project" : "projects"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Plus size={16} />
            Add project
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No projects yet.</p>
          {canCreate && (
            <Link href="/projects/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
              Add the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Categories</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                      {p.projectCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-medium text-[var(--sec-ink)] hover:underline">
                      {p.name}
                    </Link>
                    {p.clientName && <p className="text-xs text-[var(--sec-muted)]">{p.clientName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(categoriesByProject.get(p.id) ?? []).map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-[var(--sec-blue)]/20 bg-[var(--sec-blue)]/[0.06] px-2 py-0.5 text-xs font-medium text-[var(--sec-blue)]"
                        >
                          {CATEGORY_LABELS[c]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">
                    {[p.buildingName, p.unitNo, p.location].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--sec-muted)]">{PROJECT_STATUS_LABELS[p.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
