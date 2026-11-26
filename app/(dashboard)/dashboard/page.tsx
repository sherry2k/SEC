import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus, AlertTriangle, AlertCircle, Clock, Loader2, CheckCircle2 } from "lucide-react";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import UnconfirmedAnnouncementBanner from "@/components/UnconfirmedAnnouncementBanner";
import AnnouncementStatusBanner from "@/components/AnnouncementStatusBanner";
import { db } from "@/db";
import {
  projects,
  projectCategories,
  projectChecklistItems,
  checklistTemplates,
  users,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { can } from "@/lib/permissions";
import { financeCanEditProjects } from "@/lib/settings";
import { getExpiringAlerts } from "@/lib/document-renewals";
import { getRecentActivity } from "@/lib/activity";
import { ACTIVITY_LABELS, type ActivityAction } from "@/lib/activity-labels";
import {
  getLatestUnconfirmedAnnouncement,
  getAllAnnouncementsForUser,
  getAnnouncementConfirmationRosters,
} from "@/lib/announcements";
import { classifyTask, daysInCurrentStatus } from "@/lib/task-urgency";
import {
  PROJECT_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
  PROJECT_STATUS_LABELS,
  ITEM_STATUS_LABELS,
  type ProjectCategory,
} from "@/lib/checklist";

const STALE_DAYS = 14;
// Same "this has been sitting a while" cutoff as Accounts' Pending
// Payments list (lib/pending-payments.ts) — one round number reused rather
// than inventing a different threshold per page.
const ATTENTION_OVERDUE_DAYS = 14;

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardHome() {
  const user = await requireRole();
  const allowFinanceEdit = await financeCanEditProjects();
  const canCreateProject = can(user.role, "projects.create", allowFinanceEdit);
  const expiryAlerts = can(user.role, "document_renewals.view") ? await getExpiringAlerts() : [];

  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
  const categoryLinks = await db.select().from(projectCategories);
  const checklistRows = await db
    .select({
      status: projectChecklistItems.status,
      projectId: projectChecklistItems.projectId,
      customName: projectChecklistItems.customName,
      templateName: checklistTemplates.name,
      dueDate: projectChecklistItems.dueDate,
      updatedAt: projectChecklistItems.updatedAt,
    })
    .from(projectChecklistItems)
    .leftJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id));

  const totalProjects = allProjects.length;
  const activeCount = allProjects.filter((p) => p.status === "active").length;
  const onHoldCount = allProjects.filter((p) => p.status === "on_hold").length;
  const completedCount = allProjects.filter((p) => p.status === "completed").length;

  const categoryCounts: Record<ProjectCategory, number> = {
    boc: 0,
    cbc: 0,
    permit: 0,
    ad_ports: 0,
    work_permit: 0,
    contractor: 0,
    archives: 0,
    new_project: 0,
    enoc: 0,
    itc: 0,
  };
  for (const link of categoryLinks) categoryCounts[link.category] += 1;
  const maxCategoryCount = Math.max(1, ...Object.values(categoryCounts));

  const pendingItems = checklistRows.filter((i) => i.status === "submitted" || i.status === "resubmission").length;
  const approvedItems = checklistRows.filter((i) => i.status === "approved").length;

  const recentProjects = allProjects.slice(0, 5);

  const statCards = [
    { label: "Total projects", value: totalProjects },
    { label: "Active", value: activeCount },
    { label: "On hold", value: onHoldCount },
    { label: "Completed", value: completedCount },
  ];

  // Needs attention: items stuck in rejected/resubmission, and projects
  // nobody has touched in a while — combined into one list and sorted by
  // how long it's been stuck, oldest first, same instinct as Accounts'
  // Pending Payments list (lib/pending-payments.ts).
  const projectsById = new Map(allProjects.map((p) => [p.id, p]));
  const stuckItemRows = checklistRows
    .filter((i) => i.status === "rejected" || i.status === "resubmission")
    .map((i) => ({ ...i, project: projectsById.get(i.projectId) }))
    .filter((i) => i.project);

  const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const staleProjectRows = allProjects.filter((p) => p.status === "active" && p.updatedAt < staleCutoff);

  type AttentionRow = { key: string; href: string; primary: string; secondary: string; badge: string; days: number };
  const attentionRows: AttentionRow[] = [
    ...stuckItemRows.map((item, i) => ({
      key: `stuck-${i}`,
      href: `/projects/${item.project!.id}`,
      primary: item.customName ?? item.templateName ?? "Untitled item",
      secondary: item.project!.name,
      badge: ITEM_STATUS_LABELS[item.status],
      days: daysInCurrentStatus(item.updatedAt),
    })),
    ...staleProjectRows.map((p) => ({
      key: `stale-${p.id}`,
      href: `/projects/${p.id}`,
      primary: p.name,
      secondary: `No update since ${p.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
      badge: "Stale",
      days: daysInCurrentStatus(p.updatedAt),
    })),
  ]
    .sort((a, b) => b.days - a.days)
    .slice(0, 6);

  // Team workload: how many projects each person is Responsible for.
  const responsibleUsers = await db.select({ id: users.id, name: users.name }).from(users);
  const responsibleNameById = new Map(responsibleUsers.map((u) => [u.id, u.name]));
  const workloadCounts = new Map<string, number>();
  let unassignedCount = 0;
  for (const p of allProjects) {
    if (!p.responsibleId) {
      unassignedCount += 1;
      continue;
    }
    const name = responsibleNameById.get(p.responsibleId) ?? "Unknown";
    workloadCounts.set(name, (workloadCounts.get(name) ?? 0) + 1);
  }
  const workload = [...workloadCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  // Flagged only when the gap is both proportionally and numerically large
  // — avoids flagging a trivial 3-vs-2 split as an "imbalance".
  const workloadImbalanced =
    workload.length >= 2 && workload[0][1] >= workload[1][1] * 1.5 && workload[0][1] - workload[1][1] >= 10;

  // My tasks — every open checklist item (not yet Approved/Not applicable)
  // on a project this user is personally Responsible for. Mirrors
  // app/(dashboard)/projects/page.tsx's own My Tasks chips exactly, so the
  // two never disagree; only shown here when it's non-empty for this user.
  const myProjectIds = new Set(allProjects.filter((p) => p.responsibleId === user.id).map((p) => p.id));
  const myOpenTasks = checklistRows.filter((i) => myProjectIds.has(i.projectId) && classifyTask(i.dueDate, i.status) !== null);
  const myOverdueCount = myOpenTasks.filter((i) => classifyTask(i.dueDate, i.status) === "overdue").length;
  const myDueTodayCount = myOpenTasks.filter((i) => classifyTask(i.dueDate, i.status) === "due_today").length;
  const myInProgressCount = myOpenTasks.filter((i) => classifyTask(i.dueDate, i.status) === "in_progress").length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const myCompletedThisWeekCount = checklistRows.filter(
    (i) => myProjectIds.has(i.projectId) && i.status === "approved" && i.updatedAt >= weekAgo
  ).length;

  // Announcements — the explicit confirmation prompt (separate from the
  // passive dismiss-banner every page already shows via the layout).
  // Admin/Master Admin get ONE combined row (their own confirm prompt plus
  // the team-wide "X of Y confirmed" status) rather than two stacked
  // banners that otherwise show at the same time and read as duplicated.
  // Regular staff, who have no oversight to show, just get the plain
  // confirm prompt.
  const canManageAnnouncements = can(user.role, "announcements.manage");
  let unconfirmedAnnouncement: Awaited<ReturnType<typeof getLatestUnconfirmedAnnouncement>> = null;
  let announcementStatus: {
    id: string;
    title: string;
    postedByLabel: string;
    createdAt: Date;
    isConfirmedByMe: boolean;
    confirmedCount: number;
    totalStaff: number;
    pendingNames: string[];
  } | null = null;
  if (canManageAnnouncements) {
    const allAnnouncements = await getAllAnnouncementsForUser(user.id);
    const latest = allAnnouncements[0];
    if (latest) {
      const rosters = await getAnnouncementConfirmationRosters([latest.id]);
      const pendingNames = (rosters[latest.id] ?? []).filter((r) => !r.confirmed).map((r) => r.name);
      announcementStatus = {
        id: latest.id,
        title: latest.title,
        postedByLabel: latest.postedByLabel,
        createdAt: latest.createdAt,
        isConfirmedByMe: latest.isConfirmedByMe,
        confirmedCount: latest.confirmedCount,
        totalStaff: latest.totalStaff,
        pendingNames,
      };
    }
  } else {
    unconfirmedAnnouncement = await getLatestUnconfirmedAnnouncement(user.id);
  }

  // Recent activity — same feed the notification bell shows, just as an
  // always-visible card on the page itself rather than tucked behind a
  // click.
  const recentActivity = await getRecentActivity(user.role, 6);

  // Finance snapshot removed — it summed each project's legacy
  // `totalAmount` field (set manually in the old per-project Financial
  // Summary, which was itself removed from the Project detail page),
  // not anything from the current Accounts / Account Projects system.
  // Finance now lives entirely under Accounts, which has its own
  // up-to-date stats on its landing page.

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {user.role !== "staff" && (
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--sec-muted)]">
              {ROLE_LABELS[user.role]}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-bold text-[var(--sec-ink)]">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadPdfButton href="/api/dashboard/pdf" />
          {canCreateProject && (
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
            >
              <Plus size={15} />
              Project
            </Link>
          )}
        </div>
      </div>

      {announcementStatus ? (
        <div className="mt-4">
          <AnnouncementStatusBanner
            announcementId={announcementStatus.id}
            title={announcementStatus.title}
            postedByLabel={announcementStatus.postedByLabel}
            createdAt={announcementStatus.createdAt.toISOString()}
            myName={user.name}
            initialConfirmedByMe={announcementStatus.isConfirmedByMe}
            initialConfirmedCount={announcementStatus.confirmedCount}
            totalStaff={announcementStatus.totalStaff}
            initialPendingNames={announcementStatus.pendingNames}
          />
        </div>
      ) : (
        <div className="mt-4">
          <UnconfirmedAnnouncementBanner
            announcement={
              unconfirmedAnnouncement
                ? { ...unconfirmedAnnouncement, createdAt: unconfirmedAnnouncement.createdAt.toISOString() }
                : null
            }
          />
        </div>
      )}

      {myOpenTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--sec-ink)]">My tasks</h2>
            <Link href="/projects" className="text-xs font-medium text-[var(--sec-blue)] hover:underline">
              View in Projects
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Overdue", count: myOverdueCount, icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-700" },
              { label: "Due Today", count: myDueTodayCount, icon: Clock, className: "border-amber-200 bg-amber-50 text-amber-700" },
              { label: "In Progress", count: myInProgressCount, icon: Loader2, className: "border-blue-200 bg-blue-50 text-blue-700" },
              {
                label: "Completed This Week",
                count: myCompletedThisWeekCount,
                icon: CheckCircle2,
                className: "border-emerald-200 bg-emerald-50 text-emerald-700",
              },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <div key={chip.label} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${chip.className}`}>
                  <Icon size={18} />
                  <div>
                    <p className="text-lg font-bold">{chip.count}</p>
                    <p className="text-xs">{chip.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expiryAlerts.length > 0 && (
        <Link
          href="/document-renewals"
          className="mt-4 flex items-center gap-2.5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-100"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {expiryAlerts.length} document{expiryAlerts.length > 1 ? "s" : ""} expired or expiring soon —{" "}
            {expiryAlerts
              .slice(0, 3)
              .map((a) => `${a.label} (${a.status === "expired" ? `expired ${Math.abs(a.daysUntil)}d ago` : `${a.daysUntil}d left`})`)
              .join(", ")}
            {expiryAlerts.length > 3 && ` +${expiryAlerts.length - 3} more`}
          </span>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[var(--sec-line)] bg-white px-4 py-4">
            <p className="text-2xl font-bold text-[var(--sec-ink)]">{card.value}</p>
            <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-base font-bold text-[var(--sec-ink)]">Needs attention</h2>
          </div>

          {attentionRows.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--sec-muted)]">Nothing needs attention right now.</p>
          ) : (
            <div className="mt-3 space-y-1">
              {attentionRows.map((row) => (
                <Link
                  key={row.key}
                  href={row.href}
                  className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--sec-ink)]">{row.primary}</p>
                    <p className="truncate text-xs text-[var(--sec-muted)]">{row.secondary}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.days >= ATTENTION_OVERDUE_DAYS ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.days}d
                    </span>
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-[var(--sec-muted)]">{row.badge}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--sec-ink)]">Team workload</h2>
            {can(user.role, "users.manage") && (
              <Link href="/users" className="text-xs font-medium text-[var(--sec-blue)] hover:underline">
                View all
              </Link>
            )}
          </div>

          {workload.length === 0 && unassignedCount === 0 ? (
            <p className="mt-4 text-sm text-[var(--sec-muted)]">No projects yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {workload.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-[var(--sec-ink)]">{name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--sec-blue)]"
                      style={{ width: `${(count / Math.max(1, workload[0]?.[1] ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-right text-sm text-[var(--sec-muted)]">{count}</span>
                </div>
              ))}
              {unassignedCount > 0 && (
                <p className="border-t border-[var(--sec-line)] pt-3 text-xs text-[var(--sec-muted)]">
                  {unassignedCount} project{unassignedCount === 1 ? "" : "s"} unassigned
                </p>
              )}
              {workloadImbalanced && (
                <p className="flex items-center gap-1.5 border-t border-[var(--sec-line)] pt-3 text-xs text-amber-700">
                  <AlertTriangle size={12} className="shrink-0" />
                  {workload[0][0]} is carrying noticeably more than the rest of the team.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[var(--sec-line)] bg-white p-5">
        <h2 className="text-base font-bold text-[var(--sec-ink)]">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--sec-muted)]">Nothing yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-[var(--sec-line)]">
            {recentActivity.map((e) => {
              const row = (
                <div className="flex items-center gap-3 py-2.5">
                  <p className="min-w-0 flex-1 truncate text-sm text-[var(--sec-ink)]">
                    <span className="font-medium">{e.actorName ?? "Someone"}</span>{" "}
                    {ACTIVITY_LABELS[e.action as ActivityAction] ?? e.action}{" "}
                    <span className="font-medium">{e.targetName}</span>
                  </p>
                  <span className="shrink-0 text-xs text-[var(--sec-muted)]">{relativeTime(e.createdAt)}</span>
                </div>
              );
              return e.projectId ? (
                <Link key={e.id} href={`/projects/${e.projectId}`} className="block hover:bg-slate-50">
                  {row}
                </Link>
              ) : (
                <div key={e.id}>{row}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
