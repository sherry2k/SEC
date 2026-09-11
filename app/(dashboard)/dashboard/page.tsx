import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import {
  PROJECT_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
  PROJECT_STATUS_LABELS,
  type ProjectCategory,
} from "@/lib/checklist";

export default async function DashboardHome() {
  const user = await requireRole();

  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
  const categoryLinks = await db.select().from(projectCategories);
  const checklistRows = await db
    .select({ status: projectChecklistItems.status })
    .from(projectChecklistItems);

  const totalProjects = allProjects.length;
  const activeCount = allProjects.filter((p) => p.status === "active").length;
  const onHoldCount = allProjects.filter((p) => p.status === "on_hold").length;
  const completedCount = allProjects.filter((p) => p.status === "completed").length;

  const categoryCounts: Record<ProjectCategory, number> = {
    boc: 0,
    cbc: 0,
    permit: 0,
    work_permit: 0,
    contractor: 0,
  };
  for (const link of categoryLinks) categoryCounts[link.category] += 1;
  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  const pendingItems = checklistRows.filter(
    (i) => i.status === "submitted" || i.status === "resubmission"
  ).length;
  const approvedItems = checklistRows.filter((i) => i.status === "approved").length;

  const recentProjects = allProjects.slice(0, 5);

  const statCards = [
    { label: "Total projects", value: totalProjects },
    { label: "Active", value: activeCount },
    { label: "On hold", value: onHoldCount },
    { label: "Completed", value: completedCount },
  ];

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">
        {ROLE_LABELS[user.role]}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-[var(--sec-ink)]">
        Welcome back, {user.name.split(" ")[0]}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[var(--sec-line)] bg-white px-4 py-4">
            <p className="text-2xl font-bold text-[var(--sec-ink)]">{card.value}</p>
            <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <h2 className="text-base font-bold text-[var(--sec-ink)]">Projects by category</h2>
          <div className="mt-4 space-y-3">
            {PROJECT_CATEGORIES.map((c) => (
              <div key={c} className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 rounded-full border px-2 py-0.5 text-center text-xs font-medium ${CATEGORY_BADGE_STYLES[c]}`}
                >
                  {CATEGORY_LABELS[c]}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--sec-blue)]"
                    style={{ width: `${(categoryCounts[c] / maxCategoryCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm text-[var(--sec-muted)]">
                  {categoryCounts[c]}
                </span>
              </div>
            ))}
          </div>

          {checklistRows.length > 0 && (
            <div className="mt-5 flex gap-6 border-t border-[var(--sec-line)] pt-4 text-sm">
              <div>
                <p className="font-bold text-[var(--sec-ink)]">{approvedItems}</p>
                <p className="text-xs text-[var(--sec-muted)]">Approved items</p>
              </div>
              <div>
                <p className="font-bold text-[var(--sec-ink)]">{pendingItems}</p>
                <p className="text-xs text-[var(--sec-muted)]">Awaiting review</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--sec-ink)]">Recent projects</h2>
            <Link href="/projects" className="text-xs font-medium text-[var(--sec-blue)] hover:underline">
              View all
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--sec-muted)]">No projects yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-[var(--sec-line)]">
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--sec-ink)]">{p.name}</p>
                    <p className="font-mono text-xs text-[var(--sec-muted)]">{p.projectCode}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--sec-muted)]">
                    {PROJECT_STATUS_LABELS[p.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
