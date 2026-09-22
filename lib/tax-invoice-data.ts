import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { taxInvoices, taxInvoiceItems } from "@/db/schema";
import type { PrintableTaxInvoice } from "@/components/TaxInvoicePrintBody";

export async function getTaxInvoiceForPrint(id: string): Promise<PrintableTaxInvoice | null> {
  const [invoice] = await db.select().from(taxInvoices).where(eq(taxInvoices.id, id)).limit(1);
  if (!invoice) return null;

  const items = await db
    .select()
    .from(taxInvoiceItems)
    .where(eq(taxInvoiceItems.invoiceId, id))
    .orderBy(asc(taxInvoiceItems.sortOrder));

  return {
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
  };
}
