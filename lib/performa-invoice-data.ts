import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { performaInvoices, performaInvoiceItems } from "@/db/schema";
import type { PrintablePerformaInvoice } from "@/components/PerformaInvoicePrintBody";

export async function getPerformaInvoiceForPrint(id: string): Promise<PrintablePerformaInvoice | null> {
  const [invoice] = await db.select().from(performaInvoices).where(eq(performaInvoices.id, id)).limit(1);
  if (!invoice) return null;

  const items = await db
    .select()
    .from(performaInvoiceItems)
    .where(eq(performaInvoiceItems.invoiceId, id))
    .orderBy(asc(performaInvoiceItems.sortOrder));

  return {
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
  };
}
