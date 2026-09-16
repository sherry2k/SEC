"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, CATEGORY_BADGE_STYLES, PROJECT_STATUS_LABELS, type ProjectCategory, type ProjectStatus } from "@/lib/checklist";
import type { Role } from "@/lib/roles";
import MyTasksView, { type MyTask } from "@/components/MyTasksView";
import { URGENCY_STYLES, formatDueLabel, type TaskUrgency } from "@/lib/task-urgency";

export type { MyTask };

type AssignableUser = { id: number; name: string; role: Role };

type ProjectRow = {
  id: string;
  projectCode: string;
  municipalityNo: string | null;
  name: string;
  clientName: string | null;
  buildingName: string | null;
  unitNo: string | null;
  location: string | null;
  status: ProjectStatus;
  updatedAt: string;
  updatedByName: string | null;
  responsibleId: number | null;
  responsibleName: string | null;
  completedByName: string | null;
  completedAt: string | null;
  categories: ProjectCategory[];
  progress: { completed: number; total: number };
  currentActivity: string | null;
  dueInfo: { dueDate: string; urgency: TaskUrgency } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectsTable({
  rows,
  canEdit,
  canDelete,
  currentUserId,
  currentUserName,
  defaultToMine = false,
  assignableUsers,
  myTasks,
  completedThisWeekCount,
}: {
  rows: ProjectRow[];
  canEdit: boolean;
  canDelete: boolean;
  currentUserId: number;
  currentUserName: string;
  defaultToMine?: boolean;
  assignableUsers: AssignableUser[];
  myTasks: MyTask[];
  completedThisWeekCount: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | "all">("all");
  // "all" | "me" | a user id (as string)
  const [responsibleFilter, setResponsibleFilter] = useState<string>(defaultToMine ? "me" : "all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const mineCount = useMemo(() => rows.filter((r) => r.responsibleId === currentUserId).length, [rows, currentUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (responsibleFilter === "me" && r.responsibleId !== currentUserId) return false;
      if (responsibleFilter !== "all" && responsibleFilter !== "me" && r.responsibleId !== Number(responsibleFilter)) {
        return false;
      }
      const matchesCategory = categoryFilter === "all" || r.categories.includes(categoryFilter);
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = [r.name, r.projectCode, r.municipalityNo, r.clientName, r.buildingName, r.unitNo, r.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, categoryFilter, responsibleFilter, currentUserId]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-[var(--sec-line)] bg-white p-0.5">
          <button
            onClick={() => setResponsibleFilter("all")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              responsibleFilter === "all" ? "bg-[var(--sec-blue)] text-white" : "text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
            }`}
          >
            All projects
          </button>
          <button
            onClick={() => setResponsibleFilter("me")}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              responsibleFilter === "me" ? "bg-[var(--sec-blue)] text-white" : "text-[var(--sec-muted)] hover:text-[var(--sec-ink)]"
            }`}
          >
            My projects ({mineCount})
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

          <select
            value={["all", "me"].includes(responsibleFilter) ? "" : responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value || "all")}
            className="rounded-md border border-[var(--sec-line)] bg-white px-3 py-2 text-sm text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
          >
            <option value="">Check a team member…</option>
            {assignableUsers
              .filter((u) => u.id !== currentUserId && u.role !== "admin")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {responsibleFilter === "me" && (
        <MyTasksView tasks={myTasks} completedThisWeekCount={completedThisWeekCount} currentUserName={currentUserName} />
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-12 text-center text-sm text-[var(--sec-muted)]">
          {responsibleFilter === "me" ? "No projects assigned to you yet." : "No projects match that search."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[1330px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">S.No.</th>
                <th className="w-40 px-4 py-3 font-medium">Project No.</th>
                <th className="w-56 px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Categories</th>
                <th className="w-40 px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Current activity</th>
                <th className="w-32 px-4 py-3 font-medium">Due</th>
                <th className="w-36 px-4 py-3 font-medium">Responsible</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last updated</th>
                {(canEdit || canDelete) && <th className="px-4 py-3 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, index) => {
                const pct = p.progress.total > 0 ? Math.round((p.progress.completed / p.progress.total) * 100) : 0;
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="cursor-pointer border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{index + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--sec-muted)]">{p.municipalityNo || "—"}</td>
                    <td className="max-w-56 px-4 py-3">
                      <p className="truncate font-medium text-[var(--sec-ink)]">{p.name}</p>
                      {p.clientName && <p className="truncate text-xs text-[var(--sec-muted)]">{p.clientName}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((c) => (
                          <span
                            key={c}
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE_STYLES[c]}`}
                          >
                            {CATEGORY_LABELS[c]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="max-w-40 px-4 py-3 text-[var(--sec-muted)]">
                      {[p.buildingName, p.unitNo].filter(Boolean).length > 0 && (
                        <p className="truncate">{[p.buildingName, p.unitNo].filter(Boolean).join(" · ")}</p>
                      )}
                      {p.location ? <p className="truncate">{p.location}</p> : !p.buildingName && !p.unitNo && "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.progress.total > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-[var(--sec-blue)]"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`whitespace-nowrap text-xs ${pct === 100 ? "font-medium text-emerald-700" : "text-[var(--sec-muted)]"}`}>
                            {p.progress.completed}/{p.progress.total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--sec-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.currentActivity ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {p.currentActivity}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--sec-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.dueInfo ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${URGENCY_STYLES[p.dueInfo.urgency]}`} aria-hidden="true" />
                          <span className="text-[var(--sec-ink)]">{formatDueLabel(p.dueInfo.dueDate)}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--sec-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{p.responsibleName || "—"}</td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">
                      <p>{PROJECT_STATUS_LABELS[p.status]}</p>
                      {p.status === "completed" && p.completedByName && (
                        <p className="text-xs text-emerald-700">by {p.completedByName}</p>
                      )}
                      {p.status === "completed" && p.completedAt && (
                        <p className="text-xs text-emerald-700">{formatDate(p.completedAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">
                      <p className="whitespace-nowrap">{formatDate(p.updatedAt)}</p>
                      {p.updatedByName && <p className="text-xs">by {p.updatedByName}</p>}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <Link
                              href={`/projects/${p.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
                            >
                              <Pencil size={12} />
                              Edit
                            </Link>
                          )}
                          {canDelete &&
                            (confirmingId === p.id ? (
                              <button
                                onClick={() => handleDelete(p.id)}
                                disabled={deletingId === p.id}
                                className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                {deletingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Confirm
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmingId(p.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-muted)] hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            ))}
                        </div>
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
