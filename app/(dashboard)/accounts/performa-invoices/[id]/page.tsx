import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { performaInvoices, performaInvoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import PerformaInvoicePrintView from "@/components/PerformaInvoicePrintView";
import PrintButton from "@/components/PrintButton";
import DeletePerformaInvoiceButton from "@/components/DeletePerformaInvoiceButton";

export default async function PerformaInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [invoice] = await db.select().from(performaInvoices).where(eq(performaInvoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(performaInvoiceItems)
    .where(eq(performaInvoiceItems.invoiceId, id))
    .orderBy(asc(performaInvoiceItems.sortOrder));

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/performa-invoices" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All performa invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/performa-invoices/${invoice.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeletePerformaInvoiceButton invoiceId={invoice.id} />
          <PrintButton />
        </div>
      </div>

      <PerformaInvoicePrintView
        invoice={{
          invoiceNo: invoice.invoiceNo,
          issueDate: invoice.issueDate,
          customerName: invoice.customerName ?? "",
          project: invoice.project ?? "",
          customerAddress: invoice.customerAddress ?? "",
          vatRatePercent: Number(invoice.vatRatePercent),
          signatoryName: invoice.signatoryName ?? "",
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
