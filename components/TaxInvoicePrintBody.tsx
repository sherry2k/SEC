import { calcItemTotals } from "@/lib/quotation-calc";
import { calcTaxInvoiceTotals } from "@/lib/tax-invoice-calc";
import { amountToWordsAED } from "@/lib/number-to-words";
import { COMPANY, BANK_DETAILS } from "@/lib/company";

export type PrintableTaxItem = { itemDate: string; description: string; amount: number };

export type PrintableTaxInvoice = {
  invoiceNo: string;
  issueDate: string;
  clientName: string;
  clientAddress: string;
  clientTrn: string;
  vatRatePercent: number;
  signatoryName: string;
  showStamp: boolean;
  items: PrintableTaxItem[];
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function TaxInvoicePrintBody({ invoice }: { invoice: PrintableTaxInvoice }) {
  const totals = calcTaxInvoiceTotals(invoice.items, invoice.vatRatePercent);

  return (
    <>
      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Tax Invoice</h1>

      <div className="mt-5 text-sm">
        <p className="font-bold">{COMPANY.legalName}</p>
        <p>Address: {COMPANY.address}</p>
        <p>TRN No: {COMPANY.trn}</p>
        <p>Tel: {COMPANY.tel}</p>
      </div>

      <div className="mt-4 border-t border-dashed border-[var(--sec-line)] pt-4 text-sm">
        <p className="font-bold">Client Details</p>
        <p className="mt-1">{invoice.clientName}</p>
        {invoice.clientAddress && <p>Address: {invoice.clientAddress}</p>}
        {invoice.clientTrn && <p>Client TRN No: {invoice.clientTrn}</p>}
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

      <table className="mt-4 w-full max-w-xs border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-1.5">Total Amount</td>
            <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(totals.subtotal)}</td>
          </tr>
          <tr>
            <td className="border border-[var(--sec-line)] px-3 py-1.5">VAT {invoice.vatRatePercent}%</td>
            <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(totals.vatAmount)}</td>
          </tr>
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-3 py-1.5">Invoice Amount</td>
            <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(totals.total)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3 text-sm italic text-[var(--sec-muted)]">{amountToWordsAED(totals.total)}</p>

      <div className="mt-6 text-sm">
        <p className="font-bold underline">Bank Account Details:</p>
        <p>Account Name: {BANK_DETAILS.accountName}</p>
        <p>Bank Name: {BANK_DETAILS.bankName}</p>
        <p>Account Number: {BANK_DETAILS.accountNumber}</p>
        <p>IBAN: {BANK_DETAILS.iban}</p>
        <p>Currency: {BANK_DETAILS.currency}</p>
      </div>

      <div className="mt-8 text-sm">
        <p>Thank you.</p>
        <p className="mt-6">Signature</p>
        {invoice.signatoryName && <p className="mt-3 font-semibold">{invoice.signatoryName}</p>}
        {invoice.showStamp && <img src="/images/stamp.png" alt="Company stamp" className="mt-2 h-28 object-contain" />}
      </div>
    </>
  );
}
