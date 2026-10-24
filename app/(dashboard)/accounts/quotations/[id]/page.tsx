import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { quotations, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { getQuotationForPrint } from "@/lib/quotation-data";
import type { QuotationStatus } from "@/lib/quotation-status";
import QuotationPrintView from "@/components/QuotationPrintView";
import QuotationStatusControl from "@/components/QuotationStatusControl";
import PrintButton from "@/components/PrintButton";
import DeleteQuotationButton from "@/components/DeleteQuotationButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: quotations.quotationNo }).from(quotations).where(eq(quotations.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function QuotationViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const quotation = await getQuotationForPrint(id);
  if (!quotation) notFound();

  const [row] = await db.select({ status: quotations.status, accountProjectId: quotations.accountProjectId }).from(quotations).where(eq(quotations.id, id)).limit(1);
  const status = (row?.status ?? "draft") as QuotationStatus;

  // If this quotation was created under an Account Project, "back" should
  // return there — where the Documents table and Fee Breakdown live —
  // rather than the flat quotations list, same as the edit page's backHref.
  let accountProject: { id: string; clientName: string } | null = null;
  if (row?.accountProjectId) {
    const [p] = await db
      .select({ id: accountProjects.id, clientName: accountProjects.clientName })
      .from(accountProjects)
      .where(eq(accountProjects.id, row.accountProjectId))
      .limit(1);
    accountProject = p ?? null;
  }
  const backHref = accountProject ? `/accounts/account-projects/${accountProject.id}` : "/accounts/quotations";
  const backLabel = accountProject ? `Back to ${accountProject.clientName}` : "All quotations";

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <QuotationStatusControl quotationId={id} initialStatus={status} canEdit />
          <Link
            href={`/accounts/quotations/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteQuotationButton quotationId={id} redirectTo={backHref} />
          <a
            href={`/api/quotations/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <QuotationPrintView quotation={quotation} />
    </div>
  );
}
