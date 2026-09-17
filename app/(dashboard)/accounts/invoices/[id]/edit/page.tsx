import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import InvoiceForm from "@/components/InvoiceForm";
import type { InvoiceFormValues, InvoiceItemDraft } from "@/lib/invoice-defaults";
import { getProjectOptions } from "@/lib/project-options";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder));

  const projectOptions = await getProjectOptions();

  const initial: InvoiceFormValues = {
    projectId: invoice.projectId ?? "",
    issueDate: invoice.issueDate,
    customerName: invoice.customerName ?? "",
    project: invoice.project ?? "",
    customerAddress: invoice.customerAddress ?? "",
    vatRatePercent: Number(invoice.vatRatePercent),
    signatoryName: invoice.signatoryName ?? "",
    showStamp: invoice.showStamp,
    items: items.map(
      (i): InvoiceItemDraft => ({
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
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit invoice</h1>
      <div className="mt-8 max-w-3xl">
        <InvoiceForm mode="edit" invoiceId={invoice.id} initial={initial} projectOptions={projectOptions} />
      </div>
    </div>
  );
}
