import { calcPerformaInvoiceTotals } from "@/lib/performa-invoice-calc";
import { COMPANY, BANK_DETAILS } from "@/lib/company";

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
      <div className="border-b border-[var(--sec-line)] pb-6">
        <img src="/images/logo.png" alt="SOLID Engineering Consultancy" className="h-20 object-contain" />
      </div>

      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Performa Invoice</h1>

      <div className="mt-6 text-sm">
        <p>
          <span className="font-semibold">Date:</span> {invoice.issueDate}
        </p>
        <p>
          <span className="font-semibold">Ref. No.:</span> {invoice.invoiceNo}
        </p>
      </div>

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
          <tr>
            <th className="w-32 border border-[var(--sec-line)] bg-slate-50 px-3 py-2 text-left">Date</th>
            <th className="border border-[var(--sec-line)] bg-slate-50 px-3 py-2 text-left">Description</th>
            <th className="w-32 border border-[var(--sec-line)] bg-slate-50 px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td className="border border-[var(--sec-line)] px-3 py-2 align-top">{item.itemDate}</td>
              <td className="border border-[var(--sec-line)] px-3 py-2 align-top">
                {invoice.items.length > 1 ? `${index + 1}. ` : ""}
                {item.description}
              </td>
              <td className="border border-[var(--sec-line)] px-3 py-2 text-right align-top">AED {money(item.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-2" colSpan={2}>
              VAT {invoice.vatRatePercent}%
            </td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(totals.vatAmount)}</td>
          </tr>
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-3 py-2" colSpan={2}>
              Total Amount
            </td>
            <td className="border border-[var(--sec-line)] px-3 py-2 text-right">AED {money(totals.total)}</td>
          </tr>
        </tbody>
      </table>

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
