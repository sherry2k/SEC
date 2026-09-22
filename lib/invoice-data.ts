import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import type { PrintableInvoice } from "@/components/InvoicePrintBody";

export async function getInvoiceForPrint(id: string): Promise<PrintableInvoice | null> {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) return null;

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder));

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
