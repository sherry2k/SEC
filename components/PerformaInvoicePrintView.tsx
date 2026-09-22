import PrintDocumentShell from "@/components/PrintDocumentShell";
import PerformaInvoicePrintBody, { type PrintablePerformaInvoice } from "@/components/PerformaInvoicePrintBody";

export type { PrintablePIItem, PrintablePerformaInvoice } from "@/components/PerformaInvoicePrintBody";

export default function PerformaInvoicePrintView({ invoice }: { invoice: PrintablePerformaInvoice }) {
  return (
    <PrintDocumentShell dateLabel="Date" dateValue={invoice.issueDate} refLabel="Ref. No." refValue={invoice.invoiceNo}>
      <PerformaInvoicePrintBody invoice={invoice} />
    </PrintDocumentShell>
  );
}
