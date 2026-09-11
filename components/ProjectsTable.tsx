"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Pencil } from "lucide-react";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, PROJECT_STATUS_LABELS, type ProjectCategory, type ProjectStatus } from "@/lib/checklist";

type ProjectRow = {
  id: string;
  projectCode: string;
  name: string;
  clientName: string | null;
  buildingName: string | null;
  unitNo: string | null;
  location: string | null;
  status: ProjectStatus;
  categories: ProjectCategory[];
  progress: { approved: number; total: number };
};

export default function ProjectsTable({ rows, canEdit }: { rows: ProjectRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesCategory = categoryFilter === "all" || r.categories.includes(categoryFilter);
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = [r.name, r.projectCode, r.clientName, r.buildingName, r.unitNo, r.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, categoryFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sec-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a project…"
            className="w-full rounded-md border border-[var(--sec-line)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)] focus:ring-2 focus:ring-[var(--sec-blue)]/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ProjectCategory | "all")}
          className="rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
        >
          <option value="all">All categories</option>
          {PROJECT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-12 text-center text-sm text-[var(--sec-muted)]">
          No projects match that search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Categories</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canEdit && <th className="px-4 py-3 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const pct = p.progress.total > 0 ? Math.round((p.progress.approved / p.progress.total) * 100) : 0;
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="cursor-pointer border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--sec-ink)]">{p.name}</p>
                      <p className="font-mono text-xs text-[var(--sec-muted)]">{p.projectCode}</p>
                      {p.clientName && <p className="text-xs text-[var(--sec-muted)]">{p.clientName}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((c) => (
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
                    <td className="px-4 py-3">
                      {p.progress.total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[var(--sec-blue)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="whitespace-nowrap text-xs text-[var(--sec-muted)]">
                            {p.progress.approved}/{p.progress.total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--sec-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{PROJECT_STATUS_LABELS[p.status]}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/projects/${p.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
                        >
                          <Pencil size={12} />
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
