import "server-only";
import { eq, inArray } from "drizzle-orm";
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
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/roles";
import { calcGrandTotals } from "@/lib/quotation-calc";
import { calcPerformaInvoiceTotals } from "@/lib/performa-invoice-calc";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, PROJECT_STATUS_LABELS, ITEM_STATUS_LABELS, type ProjectCategory } from "@/lib/checklist";

const STALE_DAYS = 14;

export async function getDashboardForPrint(viewerRole: Role) {
  const canViewFinance = can(viewerRole, "accounts.view");

  const allProjects = await db.select().from(projects);
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
    ad_ports: 0,
    work_permit: 0,
    contractor: 0,
    archives: 0,
    pending_projects: 0,
  };
  for (const link of categoryLinks) categoryCounts[link.category] += 1;

  const pendingItems = checklistRows.filter((i) => i.status === "submitted" || i.status === "resubmission").length;
  const approvedItems = checklistRows.filter((i) => i.status === "approved").length;

  const recentProjects = allProjects.slice(0, 5);

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

  let financeSnapshot: { quotationCount: number; quotationTotal: number; invoiceCount: number; invoiceTotal: number } | null = null;

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
      const vat = Number(q.vatRatePercent) / 100;
      if (q.category) {
        const scopeFee = q.scopeFeeExclVat ? Number(q.scopeFeeExclVat) : 0;
        const mandatoryTotal = qItems
          .filter((i) => i.quotationId === q.id && i.section === "mandatory")
          .reduce((s, i) => s + Number(i.feeExclVat), 0);
        return sum + (scopeFee + mandatoryTotal) * (1 + vat);
      }
      const items = qItems
        .filter((i) => i.quotationId === q.id && !i.section)
        .map((i) => ({ description: i.description, classification: i.classification ?? "", feeExclVat: Number(i.feeExclVat) }));
      return sum + calcGrandTotals(items, Number(q.vatRatePercent)).grandTotal;
    }, 0);

    const allInvoices = await db.select().from(performaInvoices);
    const monthInvoices = allInvoices.filter((inv) => inv.createdAt >= startOfMonth);
    const invoiceIds = monthInvoices.map((inv) => inv.id);
    const invItems = invoiceIds.length
      ? await db.select().from(performaInvoiceItems).where(inArray(performaInvoiceItems.invoiceId, invoiceIds))
      : [];
    const invoiceTotal = monthInvoices.reduce((sum, inv) => {
      const items = invItems.filter((i) => i.invoiceId === inv.id).map((i) => ({ description: i.description, amount: Number(i.amount) }));
      return sum + calcPerformaInvoiceTotals(items, Number(inv.vatRatePercent)).total;
    }, 0);

    financeSnapshot = {
      quotationCount: monthQuotations.length,
      quotationTotal,
      invoiceCount: monthInvoices.length,
      invoiceTotal,
    };
  }

  return {
    totalProjects,
    activeCount,
    onHoldCount,
    completedCount,
    categoryCounts,
    categoryLabels: PROJECT_CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABELS[c], count: categoryCounts[c] })),
    pendingItems,
    approvedItems,
    recentProjects: recentProjects.map((p) => ({ name: p.name, projectCode: p.projectCode, statusLabel: PROJECT_STATUS_LABELS[p.status] })),
    stuckItems: stuckItems.map((i) => ({
      name: i.customName ?? i.templateName ?? "Untitled item",
      projectName: i.project!.name,
      status: i.status,
      statusLabel: ITEM_STATUS_LABELS[i.status],
    })),
    staleProjects: staleProjects.map((p) => ({
      name: p.name,
      updatedAtLabel: p.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    })),
    workload,
    unassignedCount,
    financeSnapshot,
  };
}
