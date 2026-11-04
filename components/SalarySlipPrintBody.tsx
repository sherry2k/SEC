import { calcSalarySlipTotals } from "@/lib/salary-slip-calc";
import { BANK_DETAILS } from "@/lib/company";

export type PrintableSalarySlipItem = { type: "earning" | "deduction"; description: string; amount: number };

export type PrintableSalarySlip = {
  slipNo: string;
  issueDate: string;
  employeeName: string;
  designation: string;
  payMonth: string; // "YYYY-MM"
  signatoryName: string;
  showStamp: boolean;
  notes: string;
  items: PrintableSalarySlipItem[];
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function payMonthLabel(payMonth: string): string {
  const [y, m] = payMonth.split("-").map(Number);
  if (!y || !m) return payMonth;
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function SalarySlipPrintBody({ slip }: { slip: PrintableSalarySlip }) {
  const totals = calcSalarySlipTotals(slip.items);
  const earnings = slip.items.filter((i) => i.type === "earning");
  const deductions = slip.items.filter((i) => i.type === "deduction");

  return (
    <>
      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Salary Slip</h1>
      <p className="mt-1 text-center text-sm text-[var(--sec-muted)]">For the month of {payMonthLabel(slip.payMonth)}</p>

      <div className="mt-5 text-sm">
        <p>
          <span className="font-semibold">Employee</span> : {slip.employeeName}
        </p>
        {slip.designation && (
          <p>
            <span className="font-semibold">Designation</span> : {slip.designation}
          </p>
        )}
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Earnings</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Amount</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Deductions</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.max(earnings.length, deductions.length, 1) }).map((_, i) => (
            <tr key={i}>
              <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{earnings[i]?.description ?? ""}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">
                {earnings[i] ? `AED ${money(earnings[i].amount)}` : ""}
              </td>
              <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{deductions[i]?.description ?? ""}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">
                {deductions[i] ? `AED ${money(deductions[i].amount)}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="border border-[var(--sec-line)] px-2 py-2">Gross Earnings</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(totals.earningsTotal)}</td>
            <td className="border border-[var(--sec-line)] px-2 py-2">Total Deductions</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(totals.deductionsTotal)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-3 text-right text-sm font-bold text-[var(--sec-ink)]">Net Pay: AED {money(totals.netPay)}</p>

      {slip.notes && (
        <div className="mt-5 text-sm">
          <p className="font-bold">Notes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {slip.notes
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </div>
      )}

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
        {slip.signatoryName && <p className="mt-6">{slip.signatoryName}</p>}
        {slip.showStamp && <img src="/images/stamp.png" alt="Company stamp" className="mt-2 h-28 object-contain" />}
      </div>
    </>
  );
}
