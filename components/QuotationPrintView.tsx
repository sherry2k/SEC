import PrintDocumentShell from "@/components/PrintDocumentShell";
import QuotationPrintBody, { type PrintableQuotation } from "@/components/QuotationPrintBody";

export type { PrintableItem, PrintableQuotation } from "@/components/QuotationPrintBody";

export default function QuotationPrintView({ quotation }: { quotation: PrintableQuotation }) {
  return (
    <PrintDocumentShell
      dateLabel="Date"
      dateValue={quotation.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
      refLabel="Ref."
      refValue={quotation.quotationNo}
    >
      <QuotationPrintBody quotation={quotation} />
    </PrintDocumentShell>
  );
}
