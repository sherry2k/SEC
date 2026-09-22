import PrintDocumentShell from "@/components/PrintDocumentShell";
import TaxInvoicePrintBody, { type PrintableTaxInvoice } from "@/components/TaxInvoicePrintBody";

export type { PrintableTaxItem, PrintableTaxInvoice } from "@/components/TaxInvoicePrintBody";

export default function TaxInvoicePrintView({ invoice }: { invoice: PrintableTaxInvoice }) {
  return (
    <PrintDocumentShell dateLabel="Date" dateValue={invoice.issueDate} refLabel="No." refValue={invoice.invoiceNo}>
      <TaxInvoicePrintBody invoice={invoice} />
    </PrintDocumentShell>
  );
}
