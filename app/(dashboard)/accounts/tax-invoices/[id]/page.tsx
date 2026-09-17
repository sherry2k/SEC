import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { taxInvoices, taxInvoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { toFilenameSafe } from "@/lib/pdf-filename";
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
  const [invoice] = await db.select().from(taxInvoices).where(eq(taxInvoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(taxInvoiceItems)
    .where(eq(taxInvoiceItems.invoiceId, id))
    .orderBy(asc(taxInvoiceItems.sortOrder));

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/tax-invoices" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All tax invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/tax-invoices/${invoice.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteTaxInvoiceButton invoiceId={invoice.id} />
          <PrintButton />
        </div>
      </div>

      <TaxInvoicePrintView
        invoice={{
          invoiceNo: invoice.invoiceNo,
          issueDate: invoice.issueDate,
          clientName: invoice.clientName ?? "",
          clientAddress: invoice.clientAddress ?? "",
          clientTrn: invoice.clientTrn ?? "",
          vatRatePercent: Number(invoice.vatRatePercent),
          signatoryName: invoice.signatoryName ?? "",
          showStamp: invoice.showStamp,
          items: items.map((i) => ({
            itemDate: i.itemDate ?? "",
            description: i.description,
            amount: Number(i.amount),
          })),
        }}
      />
    </div>
  );
}
