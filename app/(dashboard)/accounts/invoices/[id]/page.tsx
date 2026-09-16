import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { Pencil } from "lucide-react";
import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import InvoicePrintView from "@/components/InvoicePrintView";
import PrintButton from "@/components/PrintButton";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder));

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/accounts/invoices" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← All invoices
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/invoices/${invoice.id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Pencil size={13} />
            Edit
          </Link>
          <DeleteInvoiceButton invoiceId={invoice.id} />
          <PrintButton />
        </div>
      </div>

      <InvoicePrintView
        invoice={{
          invoiceNo: invoice.invoiceNo,
          issueDate: invoice.issueDate,
          customerName: invoice.customerName ?? "",
          project: invoice.project ?? "",
          customerAddress: invoice.customerAddress ?? "",
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
