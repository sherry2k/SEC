// Wraps a printable document (Quotation, Tax Invoice, Performa Invoice) in
// a real HTML <table> with the letterhead in <thead> and the certification
// logos + contact line in <tfoot>. This isn't decorative — browsers
// natively repeat a table's <thead> and <tfoot> on every printed page when
// the <tbody> content spans more than one page, which is the only
// reliable, cross-browser way to get a repeating header/footer without a
// headless-browser PDF pipeline. On screen it renders the same three
// sections top to bottom, so nothing changes there.
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
    <table className="mx-auto w-full max-w-[850px] border-collapse bg-white text-[13px] leading-relaxed text-[var(--sec-ink)] shadow-sm print:shadow-none">
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
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div className="px-8 pb-8 pt-4 sm:px-12 sm:pb-12">
              <PrintFooterStrip />
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
