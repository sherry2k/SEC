import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { Plus, AlertTriangle } from "lucide-react";
import { db } from "@/db";
import {
  projects,
  projectCategories,
  projectChecklistItems,
  checklistTemplates,
  users,
  quotations,
  quotationItems,
  performaInvoices,
  performaInvoiceItems,
} from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { can } from "@/lib/permissions";
import { financeCanEditProjects } from "@/lib/settings";
import { calcGrandTotals } from "@/lib/quotation-calc";
import { calcPerformaInvoiceTotals } from "@/lib/performa-invoice-calc";
import {
  PROJECT_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
  PROJECT_STATUS_LABELS,
  ITEM_STATUS_LABELS,
  ITEM_STATUS_STYLES,
  type ProjectCategory,
} from "@/lib/checklist";

const STALE_DAYS = 14;

export default async function DashboardHome() {
  const user = await requireRole();
  const allowFinanceEdit = await financeCanEditProjects();
  const canCreateProject = can(user.role, "projects.create", allowFinanceEdit);
  const canViewFinance = can(user.role, "accounts.view");

  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
  const categoryLinks = await db.select().from(projectCategories);
  const checklistRows = await db
    .select({
      status: projectChecklistItems.status,
      projectId: projectChecklistItems.projectId,
      customName: projectChecklistItems.customName,
      templateName: checklistTemplates.name,
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
    work_permit: 0,
    contractor: 0,
    archives: 0,
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
  // nobody has touched in a while.
  const projectsById = new Map(allProjects.map((p) => [p.id, p]));
  const stuckItems = checklistRows
    .filter((i) => i.status === "rejected" || i.status === "resubmission")
    .map((i) => ({ ...i, project: projectsById.get(i.projectId) }))
    .filter((i) => i.project)
    .slice(0, 5);

  const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const staleProjects = allProjects
    .filter((p) => p.status === "active" && p.updatedAt < staleCutoff)
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .slice(0, 5);

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

  // Finance snapshot — Admin/Finance/Master admin only.
  let financeSnapshot: {
    quotationCount: number;
    quotationTotal: number;
    invoiceCount: number;
    invoiceTotal: number;
  } | null = null;

  if (canViewFinance) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const allQuotations = await db.select().from(quotations);
    const monthQuotations = allQuotations.filter((q) => q.createdAt >= startOfMonth);
    const quotationIds = monthQuotations.map((q) => q.id);
    const qItems = quotationIds.length
      ? await db.select().from(quotationItems).where(inArray(quotationItems.quotationId, quotationIds))
      : [];
    const quotationTotal = monthQuotations.reduce((sum, q) => {
      const items = qItems.filter((i) => i.quotationId === q.id).map((i) => ({
        description: i.description,
        classification: i.classification ?? "",
        feeExclVat: Number(i.feeExclVat),
      }));
      return sum + calcGrandTotals(items, Number(q.vatRatePercent)).grandTotal;
    }, 0);

    const allInvoices = await db.select().from(performaInvoices);
    const monthInvoices = allInvoices.filter((inv) => inv.createdAt >= startOfMonth);
    const invoiceIds = monthInvoices.map((inv) => inv.id);
    const invItems = invoiceIds.length
      ? await db.select().from(performaInvoiceItems).where(inArray(performaInvoiceItems.invoiceId, invoiceIds))
      : [];
    const invoiceTotal = monthInvoices.reduce((sum, inv) => {
      const items = invItems
        .filter((i) => i.invoiceId === inv.id)
        .map((i) => ({ description: i.description, amount: Number(i.amount) }));
      return sum + calcPerformaInvoiceTotals(items, Number(inv.vatRatePercent)).total;
    }, 0);

    financeSnapshot = {
      quotationCount: monthQuotations.length,
      quotationTotal,
      invoiceCount: monthInvoices.length,
      invoiceTotal,
    };
  }

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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[var(--sec-line)] bg-white px-4 py-4">
            <p className="text-2xl font-bold text-[var(--sec-ink)]">{card.value}</p>
            <p className="mt-0.5 text-xs text-[var(--sec-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      {financeSnapshot && (
        <div className="mt-6 rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <h2 className="text-base font-bold text-[var(--sec-ink)]">Finance this month</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-[var(--sec-ink)]">{financeSnapshot.quotationCount}</p>
              <p className="text-xs text-[var(--sec-muted)]">Quotations issued</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--sec-ink)]">
                AED {financeSnapshot.quotationTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-[var(--sec-muted)]">Quoted value</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--sec-ink)]">{financeSnapshot.invoiceCount}</p>
              <p className="text-xs text-[var(--sec-muted)]">Invoices issued</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--sec-ink)]">
                AED {financeSnapshot.invoiceTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-[var(--sec-muted)]">Invoiced value</p>
            </div>
          </div>
        </div>
      )}

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

          {stuckItems.length === 0 && staleProjects.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--sec-muted)]">Nothing needs attention right now.</p>
          ) : (
            <div className="mt-3 space-y-1">
              {stuckItems.map((item, i) => (
                <Link
                  key={`stuck-${i}`}
                  href={`/projects/${item.project!.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--sec-ink)]">{item.customName ?? item.templateName ?? "Untitled item"}</p>
                    <p className="truncate text-xs text-[var(--sec-muted)]">{item.project!.name}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${ITEM_STATUS_STYLES[item.status]}`}
                  >
                    {ITEM_STATUS_LABELS[item.status]}
                  </span>
                </Link>
              ))}
              {staleProjects.map((p) => (
                <Link
                  key={`stale-${p.id}`}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 hover:bg-slate-50"
                >
                  <p className="truncate text-sm text-[var(--sec-ink)]">{p.name}</p>
                  <span className="shrink-0 text-xs text-[var(--sec-muted)]">
                    No update since {p.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <h2 className="text-base font-bold text-[var(--sec-ink)]">Team workload</h2>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
