import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { taxInvoices, taxInvoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import TaxInvoiceForm from "@/components/TaxInvoiceForm";
import type { TaxInvoiceFormValues, TaxInvoiceItemDraft } from "@/lib/tax-invoice-defaults";
import { getProjectOptions } from "@/lib/project-options";

export default async function EditTaxInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [invoice] = await db.select().from(taxInvoices).where(eq(taxInvoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(taxInvoiceItems)
    .where(eq(taxInvoiceItems.invoiceId, id))
    .orderBy(asc(taxInvoiceItems.sortOrder));

  const projectOptions = await getProjectOptions();

  const initial: TaxInvoiceFormValues = {
    projectId: invoice.projectId ?? "",
    issueDate: invoice.issueDate,
    clientName: invoice.clientName ?? "",
    clientAddress: invoice.clientAddress ?? "",
    clientTrn: invoice.clientTrn ?? "",
    vatRatePercent: Number(invoice.vatRatePercent),
    signatoryName: invoice.signatoryName ?? "",
    showStamp: invoice.showStamp,
    items: items.map(
      (i): TaxInvoiceItemDraft => ({
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
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit tax invoice</h1>
      <div className="mt-8 max-w-3xl">
        <TaxInvoiceForm mode="edit" invoiceId={invoice.id} initial={initial} projectOptions={projectOptions} />
      </div>
    </div>
  );
}
