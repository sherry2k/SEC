import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, ArrowLeft } from "lucide-react";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { projects, projectCategories, projectChecklistItems, checklistTemplates, checklistItemComments, users, projectAttachments } from "@/db/schema";
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
import ProjectPrintView from "@/components/ProjectPrintView";
import { getProjectFinancials } from "@/lib/project-finance";
import LinkExistingDocument from "@/components/LinkExistingDocument";
import ProjectTotalAmountEditor from "@/components/ProjectTotalAmountEditor";
import ProjectAttachments, { type Attachment } from "@/components/ProjectAttachments";
import { toFilenameSafe } from "@/lib/pdf-filename";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project] = await db.select({ projectCode: projects.projectCode }).from(projects).where(eq(projects.id, id)).limit(1);
  return { title: project ? toFilenameSafe(project.projectCode) : "Project" };
}

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

  const attachmentRows = await db
    .select({
      id: projectAttachments.id,
      fileName: projectAttachments.fileName,
      fileUrl: projectAttachments.fileUrl,
      fileSizeBytes: projectAttachments.fileSizeBytes,
      uploadedAt: projectAttachments.uploadedAt,
      uploadedByName: users.name,
      uploadedByRole: users.role,
    })
    .from(projectAttachments)
    .leftJoin(users, eq(projectAttachments.uploadedBy, users.id))
    .where(eq(projectAttachments.projectId, id));

  const attachments: Attachment[] = attachmentRows
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSizeBytes: a.fileSizeBytes,
      uploadedByName: visibleActorName(a.uploadedByRole, a.uploadedByName, user.role),
      uploadedAt: a.uploadedAt.toISOString(),
    }));

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

  // Same "completed" definition as the Projects list: Approved or Not
  // Required both count as done, so a project isn't stuck looking
  // incomplete forever over items that were never actually needed.
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === "approved" || i.status === "not_applicable").length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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

      {/* On-screen, interactive version — hidden entirely when printing.
          ProjectPrintView below is the print-specific rendering instead,
          using the same repeating-letterhead table structure as the
          finance documents. */}
      <div className="print:hidden">
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

      {totalItems > 0 && (
        <div className="no-print mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--sec-muted)]">Progress</span>
            <span className={`font-semibold ${progressPct === 100 ? "text-emerald-600" : "text-[var(--sec-ink)]"}`}>
              {progressPct}% ({completedItems}/{totalItems})
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${progressPct === 100 ? "bg-emerald-500" : "bg-[var(--sec-blue)]"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
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
            <ProjectTotalAmountEditor projectId={project.id} initialAmount={financials.totalAmount} canEdit={can(user.role, "accounts.edit")} />
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
          {financials.totalAmount === 0 && financials.ledger.length === 0 && (
            <p className="mt-3 text-xs text-[var(--sec-muted)]">
              No Total Amount set, and no Tax Invoice, Invoice, or Receipt Voucher is linked to this project yet.
            </p>
          )}
        </div>
      )}

      <ProjectAttachments projectId={project.id} initialAttachments={attachments} canEdit={canEdit} />

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
      </div>

      <div className="hidden print:block">
        <ProjectPrintView
          project={{
            projectCode: project.projectCode,
            name: project.name,
            status: project.status,
            details,
            updatedAtLabel: project.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            updatedByDisplayName,
            completedByDisplayName,
            completedAtLabel:
              project.status === "completed" && project.completedAt
                ? project.completedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : null,
            notes: project.notes,
            sections,
          }}
        />
      </div>
    </div>
  );
}
