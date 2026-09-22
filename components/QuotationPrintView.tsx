import PrintDocumentShell from "@/components/PrintDocumentShell";
import QuotationPrintBody, { type PrintableQuotation } from "@/components/QuotationPrintBody";
import QuotationCategoryPrintBody from "@/components/QuotationCategoryPrintBody";

export type { PrintableItem, PrintableFeeItem, PrintableQuotation } from "@/components/QuotationPrintBody";

export default function QuotationPrintView({ quotation }: { quotation: PrintableQuotation }) {
  return (
    <PrintDocumentShell
      dateLabel="Date"
      dateValue={quotation.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
      refLabel="Ref."
      refValue={quotation.quotationNo}
    >
      {quotation.category ? <QuotationCategoryPrintBody quotation={quotation} /> : <QuotationPrintBody quotation={quotation} />}
    </PrintDocumentShell>
  );
}
