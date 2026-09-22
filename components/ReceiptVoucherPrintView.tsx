import PrintDocumentShell from "@/components/PrintDocumentShell";
import ReceiptVoucherPrintBody, { type PrintableReceiptVoucher } from "@/components/ReceiptVoucherPrintBody";

export type { PrintableRVItem, PrintableReceiptVoucher } from "@/components/ReceiptVoucherPrintBody";

export default function ReceiptVoucherPrintView({ voucher }: { voucher: PrintableReceiptVoucher }) {
  return (
    <PrintDocumentShell dateLabel="Date" dateValue={voucher.issueDate} refLabel="Ref. No." refValue={voucher.voucherNo}>
      <ReceiptVoucherPrintBody voucher={voucher} />
    </PrintDocumentShell>
  );
}
