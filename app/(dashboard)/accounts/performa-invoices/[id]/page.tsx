import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { performaInvoices } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { getPerformaInvoiceForPrint } from "@/lib/performa-invoice-data";
import PerformaInvoicePrintView from "@/components/PerformaInvoicePrintView";
import PrintButton from "@/components/PrintButton";
import DeletePerformaInvoiceButton from "@/components/DeletePerformaInvoiceButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: performaInvoices.invoiceNo }).from(performaInvoices).where(eq(performaInvoices.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function PerformaInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const invoice = await getPerformaInvoiceForPrint(id);
  if (!invoice) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/performa-invoices" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All performa invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/performa-invoices/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeletePerformaInvoiceButton invoiceId={id} />
          <a
            href={`/api/performa-invoices/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <PerformaInvoicePrintView invoice={invoice} />
    </div>
  );
}
