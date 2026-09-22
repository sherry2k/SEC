import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { getInvoiceForPrint } from "@/lib/invoice-data";
import InvoicePrintView from "@/components/InvoicePrintView";
import PrintButton from "@/components/PrintButton";
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

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/invoices" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/invoices/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteInvoiceButton invoiceId={id} />
          <a
            href={`/api/invoices/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <InvoicePrintView invoice={invoice} />
    </div>
  );
}
