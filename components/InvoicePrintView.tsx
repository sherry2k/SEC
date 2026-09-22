import PrintDocumentShell from "@/components/PrintDocumentShell";
import InvoicePrintBody, { type PrintableInvoice } from "@/components/InvoicePrintBody";

export type { PrintableInvoiceItem, PrintableInvoice } from "@/components/InvoicePrintBody";

export default function InvoicePrintView({ invoice }: { invoice: PrintableInvoice }) {
  return (
    <PrintDocumentShell dateLabel="Date" dateValue={invoice.issueDate} refLabel="Ref. No." refValue={invoice.invoiceNo}>
      <InvoicePrintBody invoice={invoice} />
    </PrintDocumentShell>
  );
}
