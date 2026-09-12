import { calcItemTotals } from "@/lib/quotation-calc";
import { calcPerformaInvoiceTotals } from "@/lib/performa-invoice-calc";
import { COMPANY, BANK_DETAILS } from "@/lib/company";
import PrintLetterhead from "@/components/PrintLetterhead";

export type PrintablePIItem = { itemDate: string; description: string; amount: number };

export type PrintablePerformaInvoice = {
  invoiceNo: string;
  issueDate: string;
  customerName: string;
  project: string;
  customerAddress: string;
  vatRatePercent: number;
  signatoryName: string;
  items: PrintablePIItem[];
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function PerformaInvoicePrintView({ invoice }: { invoice: PrintablePerformaInvoice }) {
  const totals = calcPerformaInvoiceTotals(invoice.items, invoice.vatRatePercent);

  return (
    <div className="mx-auto max-w-[850px] bg-white p-8 text-[13px] leading-relaxed text-[var(--sec-ink)] shadow-sm print:shadow-none sm:p-12">
      <PrintLetterhead
        dateLabel="Date"
        dateValue={invoice.issueDate}
        refLabel="Ref. No."
        refValue={invoice.invoiceNo}
      />

      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Performa Invoice</h1>

      <div className="mt-4 text-sm">
        <p>
          <span className="font-semibold">Customer Name</span> : {invoice.customerName}
        </p>
        {invoice.project && (
          <p>
            <span className="font-semibold">Project</span> : {invoice.project}
          </p>
        )}
        {invoice.customerAddress && (
          <p>
            <span className="font-semibold">Customer Address</span> : {invoice.customerAddress}
          </p>
        )}
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">No.</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Description</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Amount</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">VAT {invoice.vatRatePercent}%</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Total Incl. VAT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => {
            const { vatAmount, totalInclVat } = calcItemTotals(item.amount, invoice.vatRatePercent);
            return (
              <tr key={index}>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{index + 1}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{item.description}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(item.amount)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(vatAmount)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top font-semibold">AED {money(totalInclVat)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-3 text-right text-sm font-bold text-[var(--sec-ink)]">
        Total Amount: AED {money(totals.total)} including {invoice.vatRatePercent}% VAT.
      </p>

      <div className="mt-6 text-sm">
        <p className="font-bold underline">Bank Account Details:</p>
        <p>Account Name: {BANK_DETAILS.accountName}</p>
        <p>Bank Name: {BANK_DETAILS.bankName}</p>
        <p>Account Number: {BANK_DETAILS.accountNumber}</p>
        <p>IBAN: {BANK_DETAILS.iban}</p>
        <p>Currency: {BANK_DETAILS.currency}</p>
      </div>

      <div className="mt-8 text-sm">
        <p>Best Regards,</p>
        {invoice.signatoryName && <p className="mt-6">{invoice.signatoryName}</p>}
      </div>

      <div className="mt-10 border-t border-[var(--sec-line)] pt-3 text-center text-[11px] text-[var(--sec-muted)]">
        {COMPANY.address}, Tel: {COMPANY.tel}, Mobil: {COMPANY.mobile}, Email: {COMPANY.email}
      </div>
    </div>
  );
}
