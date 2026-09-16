import { calcItemTotals } from "@/lib/quotation-calc";
import { calcReceiptVoucherTotals } from "@/lib/receipt-voucher-calc";
import { BANK_DETAILS } from "@/lib/company";
import PrintDocumentShell from "@/components/PrintDocumentShell";

export type PrintableRVItem = { itemDate: string; description: string; amount: number };

export type PrintableReceiptVoucher = {
  voucherNo: string;
  issueDate: string;
  toName: string;
  project: string;
  location: string;
  vatRatePercent: number;
  signatoryName: string;
  items: PrintableRVItem[];
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function ReceiptVoucherPrintView({ voucher }: { voucher: PrintableReceiptVoucher }) {
  const totals = calcReceiptVoucherTotals(voucher.items, voucher.vatRatePercent);

  return (
    <PrintDocumentShell dateLabel="Date" dateValue={voucher.issueDate} refLabel="Ref. No." refValue={voucher.voucherNo}>
      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Receipt Voucher</h1>

      <div className="mt-5 text-sm">
        <p>
          <span className="font-semibold">To</span> : {voucher.toName}
        </p>
        {voucher.project && (
          <p>
            <span className="font-semibold">Project</span> : {voucher.project}
          </p>
        )}
        {voucher.location && (
          <p>
            <span className="font-semibold">Location</span> : {voucher.location}
          </p>
        )}
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Date</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Description</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Amount</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">VAT {voucher.vatRatePercent}%</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Total Incl. VAT</th>
          </tr>
        </thead>
        <tbody>
          {voucher.items.map((item, index) => {
            const { vatAmount, totalInclVat } = calcItemTotals(item.amount, voucher.vatRatePercent);
            return (
              <tr key={index}>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{item.itemDate}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 align-top">
                  {voucher.items.length > 1 ? `${index + 1}. ` : ""}
                  {item.description}
                </td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(item.amount)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(vatAmount)}</td>
                <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top font-semibold">AED {money(totalInclVat)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-3 text-right text-sm font-bold text-[var(--sec-ink)]">
        Total Amount: AED {money(totals.total)} including {voucher.vatRatePercent}% VAT.
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
        {voucher.signatoryName && <p className="mt-6">{voucher.signatoryName}</p>}
      </div>
    </PrintDocumentShell>
  );
}
