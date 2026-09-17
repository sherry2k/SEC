import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowLeft } from "lucide-react";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates, checklistItemComments, users } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { financeCanEditProjects } from "@/lib/settings";
import { can } from "@/lib/permissions";
import { visibleActorName } from "@/lib/visibility";
import { PROJECT_CATEGORIES, CATEGORY_LABELS, type ProjectCategory } from "@/lib/checklist";
import ProjectChecklist from "@/components/ProjectChecklist";
import AddCategoryButton from "@/components/AddCategoryButton";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import ProjectStatusControl from "@/components/ProjectStatusControl";
import PrintButton from "@/components/PrintButton";
import PrintLetterhead from "@/components/PrintLetterhead";
import PrintFooterStrip from "@/components/PrintFooterStrip";
import { getProjectFinancials } from "@/lib/project-finance";
import LinkExistingDocument from "@/components/LinkExistingDocument";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("projects.view");
  const allowFinanceEdit = await financeCanEditProjects();
  const canEdit = can(user.role, "projects.edit", allowFinanceEdit);
  const canDelete = can(user.role, "projects.delete", allowFinanceEdit);
  const canViewFinance = can(user.role, "accounts.view");

  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) notFound();

  const financials = canViewFinance ? await getProjectFinancials(id) : null;

  const [updatedByUser] = project.updatedBy
    ? await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, project.updatedBy)).limit(1)
    : [null];
  const updatedByDisplayName = updatedByUser ? visibleActorName(updatedByUser.role, updatedByUser.name, user.role) : null;

  const [responsibleUser] = project.responsibleId
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, project.responsibleId)).limit(1)
    : [null];

  const [completedByUser] = project.completedBy
    ? await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, project.completedBy)).limit(1)
    : [null];
  const completedByDisplayName = completedByUser
    ? visibleActorName(completedByUser.role, completedByUser.name, user.role)
    : null;

  const links = await db.select().from(projectCategories).where(eq(projectCategories.projectId, id));
  const linkedCategories = links.map((l) => l.category);

  const items = await db
    .select({
      id: projectChecklistItems.id,
      parentItemId: projectChecklistItems.parentItemId,
      status: projectChecklistItems.status,
      dueDate: projectChecklistItems.dueDate,
      submittedAt: projectChecklistItems.submittedAt,
      submittedByName: users.name,
      submittedByRole: users.role,
      approvedAt: projectChecklistItems.approvedAt,
      category: projectChecklistItems.category,
      templateId: projectChecklistItems.templateId,
      customName: projectChecklistItems.customName,
      templateName: checklistTemplates.name,
      sortOrder: projectChecklistItems.sortOrder,
    })
    .from(projectChecklistItems)
    .leftJoin(checklistTemplates, eq(projectChecklistItems.templateId, checklistTemplates.id))
    .leftJoin(users, eq(projectChecklistItems.submittedBy, users.id))
    .where(eq(projectChecklistItems.projectId, id));

  const commentRows = await db
    .select({
      id: checklistItemComments.id,
      itemId: checklistItemComments.itemId,
      comment: checklistItemComments.comment,
      createdAt: checklistItemComments.createdAt,
      authorName: users.name,
    })
    .from(checklistItemComments)
    .innerJoin(projectChecklistItems, eq(checklistItemComments.itemId, projectChecklistItems.id))
    .leftJoin(users, eq(checklistItemComments.userId, users.id))
    .where(eq(projectChecklistItems.projectId, id))
    .orderBy(asc(checklistItemComments.createdAt));

  const commentsByItem = new Map<string, { id: string; comment: string; authorName: string | null; createdAt: string }[]>();
  for (const c of commentRows) {
    const list = commentsByItem.get(c.itemId) ?? [];
    list.push({ id: c.id, comment: c.comment, authorName: c.authorName, createdAt: c.createdAt.toISOString() });
    commentsByItem.set(c.itemId, list);
  }

  const sections = linkedCategories.map((category) => ({
    category,
    items: items
      .filter((i) => i.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({
        id: i.id,
        name: i.customName ?? i.templateName ?? "Untitled item",
        status: i.status,
        parentItemId: i.parentItemId,
        dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : null,
        submittedByName: visibleActorName(i.submittedByRole, i.submittedByName, user.role),
        submittedAt: i.submittedAt ? i.submittedAt.toISOString() : null,
        approvedAt: i.approvedAt ? i.approvedAt.toISOString() : null,
        comments: commentsByItem.get(i.id) ?? [],
        isCustom: i.templateId === null,
      })),
  }));

  const availableCategories: ProjectCategory[] = PROJECT_CATEGORIES.filter((c) => !linkedCategories.includes(c));

  const details = [
    ["Project No.", project.municipalityNo],
    ["Client", project.clientName],
    ["Building / mall", project.buildingName],
    ["Unit / shop", project.unitNo],
    ["Plot No.", project.plotNo],
    ["Location", project.location],
    ["Responsible", responsibleUser?.name ?? null],
  ].filter(([, value]) => value) as [string, string][];

  return (
    <div>
      <Link
        href="/projects"
        className="no-print mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
      >
        <ArrowLeft size={14} />
        Back to projects
      </Link>

      {/* Print-only letterhead — matches the finance documents' branding.
          Unlike Quotations/Invoices, this shows once at the top rather than
          repeating on every printed page, since turning this whole page
          into the same repeating-header table structure would mean a much
          bigger rework of the page. Worth doing later if projects commonly
          print past one page. */}
      <div className="hidden print:mb-6 print:block">
        <PrintLetterhead
          dateLabel="Printed"
          dateValue={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          refLabel="Ref."
          refValue={project.projectCode}
        />
      </div>

      <p className="font-mono text-xs text-[var(--sec-muted)]">Ref: {project.projectCode}</p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-bold text-2xl text-[var(--sec-ink)]">{project.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusControl projectId={project.id} initialStatus={project.status} canEdit={canEdit} />
          {canEdit && (
            <Link
              href={`/projects/${project.id}/edit`}
              className="no-print flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
            >
              <Pencil size={13} />
              Edit
            </Link>
          )}
          {canDelete && <DeleteProjectButton projectId={project.id} />}
          <PrintButton />
        </div>
      </div>

      {details.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">{label}</dt>
              <dd className="text-[var(--sec-ink)]">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-4 text-xs text-[var(--sec-muted)]">
        Last updated{" "}
        {project.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        {updatedByDisplayName && ` by ${updatedByDisplayName}`}
      </p>

      {project.status === "completed" && project.completedAt && (
        <p className="mt-1 text-xs font-medium text-emerald-700">
          Completed{completedByDisplayName && ` by ${completedByDisplayName}`} on{" "}
          {project.completedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      )}

      {project.notes && <p className="mt-4 text-sm text-[var(--sec-muted)]">{project.notes}</p>}

      {financials && (
        <div className="no-print mt-8 rounded-lg border border-[var(--sec-line)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-lg text-[var(--sec-ink)]">Financial Summary</h2>
            <Link
              href={`/projects/${project.id}/statement`}
              className="text-sm font-medium text-[var(--sec-blue)] hover:underline"
            >
              View Statement of Account →
            </Link>
          </div>
          {can(user.role, "accounts.edit") && <LinkExistingDocument projectId={project.id} />}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Quoted</p>
              <p className="mt-0.5 text-lg font-bold text-[var(--sec-ink)]">
                AED {financials.quotedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Invoiced</p>
              <p className="mt-0.5 text-lg font-bold text-[var(--sec-ink)]">
                AED {financials.invoicedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Paid</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-600">
                AED {financials.paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Balance</p>
              <p className={`mt-0.5 text-lg font-bold ${financials.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                AED {financials.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {financials.quotedTotal === 0 && financials.ledger.length === 0 && (
            <p className="mt-3 text-xs text-[var(--sec-muted)]">
              No Quotation, Tax Invoice, Invoice, or Receipt Voucher is linked to this project yet.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-bold text-lg text-[var(--sec-ink)]">Checklist</h2>
        {canEdit && (
          <div className="no-print">
            <AddCategoryButton projectId={project.id} availableCategories={availableCategories} />
          </div>
        )}
      </div>

      <div className="mt-4">
        <ProjectChecklist sections={sections} projectId={project.id} canEdit={canEdit} currentUserName={user.name} />
      </div>

      {/* Print-only footer — same certification logos and contact line as
          Quotations/Invoices. */}
      <div className="hidden print:mt-8 print:block">
        <PrintFooterStrip />
      </div>
    </div>
  );
}
