import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Pencil, Download } from "lucide-react";
import { db } from "@/db";
import { taxInvoices } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
import { getTaxInvoiceForPrint } from "@/lib/tax-invoice-data";
import TaxInvoicePrintView from "@/components/TaxInvoicePrintView";
import PrintButton from "@/components/PrintButton";
import DeleteTaxInvoiceButton from "@/components/DeleteTaxInvoiceButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc] = await db.select({ ref: taxInvoices.invoiceNo }).from(taxInvoices).where(eq(taxInvoices.id, id)).limit(1);
  return { title: doc ? toFilenameSafe(doc.ref) : "Document" };
}

export default async function TaxInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const invoice = await getTaxInvoiceForPrint(id);
  if (!invoice) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/tax-invoices" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All tax invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/tax-invoices/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteTaxInvoiceButton invoiceId={id} />
          <a
            href={`/api/tax-invoices/${id}/pdf`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--sec-blue)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Download size={13} />
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>

      <TaxInvoicePrintView invoice={invoice} />
    </div>
  );
}
