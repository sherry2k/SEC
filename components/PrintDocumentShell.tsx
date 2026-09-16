// Wraps a printable document (Quotation, Tax Invoice, Performa Invoice,
// Receipt Voucher, Invoice) in a real HTML <table> with the letterhead in
// <thead> — browsers reliably repeat a table's <thead> on every printed
// page when content spans more than one page, which is the standard
// cross-browser trick for a repeating header. The footer, though, is
// deliberately NOT a <tfoot>: repeating <tfoot> on literally every page,
// including guaranteeing it on the true last page, turned out to be
// inconsistent across browsers/PDF engines — some browsers only show it
// once, and not reliably at the actual end. So the footer is just the
// last piece of ordinary flowing content instead, which reliably lands
// at the bottom of wherever the document actually ends.
import PrintLetterhead from "@/components/PrintLetterhead";
import PrintFooterStrip from "@/components/PrintFooterStrip";

export default function PrintDocumentShell({
  dateLabel,
  dateValue,
  refLabel,
  refValue,
  children,
}: {
  dateLabel: string;
  dateValue: string;
  refLabel: string;
  refValue: string;
  children: React.ReactNode;
}) {
  return (
    <table className="print-doc-table mx-auto w-full max-w-[850px] border-collapse bg-white text-[13px] leading-relaxed text-[var(--sec-ink)] shadow-sm print:shadow-none">
      <thead>
        <tr>
          <td>
            <div className="p-8 pb-4 sm:p-12 sm:pb-4">
              <PrintLetterhead dateLabel={dateLabel} dateValue={dateValue} refLabel={refLabel} refValue={refValue} />
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div className="px-8 sm:px-12">{children}</div>
            <div className="px-8 pb-8 pt-4 sm:px-12 sm:pb-12">
              <PrintFooterStrip />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
