import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { invoices, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { getInvoiceForPrint } from "@/lib/invoice-data";
import InvoicePrintView from "@/components/InvoicePrintView";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: invoices.invoiceNo }).from(invoices).where(eq(invoices.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const invoice = await getInvoiceForPrint(id);
  if (!invoice) notFound();

  const [row] = await db.select({ accountProjectId: invoices.accountProjectId }).from(invoices).where(eq(invoices.id, id)).limit(1);

  // If this invoice was created under an Account Project, "back" should
  // return there — where the Documents table and Fee Breakdown live —
  // rather than the flat invoices list.
  let accountProject: { id: string; clientName: string } | null = null;
  if (row?.accountProjectId) {
    const [p] = await db
      .select({ id: accountProjects.id, clientName: accountProjects.clientName })
      .from(accountProjects)
      .where(eq(accountProjects.id, row.accountProjectId))
      .limit(1);
    accountProject = p ?? null;
  }
  const backHref = accountProject ? `/accounts/account-projects/${accountProject.id}` : "/accounts/invoices";
  const backLabel = accountProject ? `Back to ${accountProject.clientName}` : "All invoices";

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/invoices/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteInvoiceButton invoiceId={id} redirectTo={backHref} />
          <a
            href={`/api/invoices/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
                 </div>
      </div>

      <InvoicePrintView invoice={invoice} />
    </div>
  );
}
