import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { performaInvoices, performaInvoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import PerformaInvoiceForm from "@/components/PerformaInvoiceForm";
import type { PerformaInvoiceFormValues, PerformaInvoiceItemDraft } from "@/lib/performa-invoice-defaults";

export default async function EditPerformaInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [invoice] = await db.select().from(performaInvoices).where(eq(performaInvoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(performaInvoiceItems)
    .where(eq(performaInvoiceItems.invoiceId, id))
    .orderBy(asc(performaInvoiceItems.sortOrder));

  const initial: PerformaInvoiceFormValues = {
    issueDate: invoice.issueDate,
    customerName: invoice.customerName ?? "",
    project: invoice.project ?? "",
    customerAddress: invoice.customerAddress ?? "",
    vatRatePercent: Number(invoice.vatRatePercent),
    signatoryName: invoice.signatoryName ?? "",
    items: items.map(
      (i): PerformaInvoiceItemDraft => ({
        key: i.id,
        itemDate: i.itemDate ?? "",
        description: i.description,
        amount: i.amount,
      })
    ),
  };

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">{invoice.invoiceNo}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit performa invoice</h1>
      <div className="mt-8 max-w-3xl">
        <PerformaInvoiceForm mode="edit" invoiceId={invoice.id} initial={initial} />
      </div>
    </div>
  );
}
