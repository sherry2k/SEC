// Wraps a printable document (Quotation, Tax Invoice, Performa Invoice,
// Receipt Voucher, Invoice) in a real HTML <table> with the letterhead in
// <thead> and the certification logos + contact line in <tfoot>. Browsers
// pin a table's <tfoot> to the bottom of every page the table spans,
// including the true last page — exactly the "footer stays at the bottom,
// not wherever the content happens to end" behavior this needs. (An
// earlier version moved the footer out of <tfoot> after what looked like
// it failing to appear on the last page — that turned out to coincide
// with an unrelated database error breaking the page entirely, not a real
// <tfoot> problem, so this reverts back to the correct, bottom-pinned
// approach.)
import PrintLetterhead from "@/components/PrintLetterhead";
import PrintFooterStrip from "@/components/PrintFooterStrip";
import PrintWatermark from "@/components/PrintWatermark";

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
    <>
      <PrintWatermark />
      <table className="print-doc-table mx-auto w-full max-w-[850px] border-collapse bg-white text-[13px] leading-relaxed text-[var(--sec-ink)] shadow-sm print:bg-transparent print:shadow-none">
      <thead>
        <tr>
          <td>
            <div className="p-8 pb-4 sm:px-12 sm:pt-8 sm:pb-4">
              <PrintLetterhead dateLabel={dateLabel} dateValue={dateValue} refLabel={refLabel} refValue={refValue} />
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div className="print-doc-body-fill px-8 sm:px-12">{children}</div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div className="px-8 pb-4 pt-4 sm:px-12 sm:pb-6">
              <PrintFooterStrip />
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
    </>
  );
}
