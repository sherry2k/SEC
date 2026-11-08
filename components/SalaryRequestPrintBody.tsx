import { payMonthLabel } from "@/components/SalarySlipPrintBody";

export type PrintableSalaryRequestItem = { employeeName: string; designation: string; amount: number };

export type PrintableSalaryRequest = {
  requestNo: string;
  payMonth: string;
  notes: string;
  items: PrintableSalaryRequestItem[];
};

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function SalaryRequestPrintBody({ request }: { request: PrintableSalaryRequest }) {
  const total = request.items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <>
      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Salary Request</h1>
      <p className="mt-1 text-center text-sm text-[var(--sec-muted)]">For the month of {payMonthLabel(request.payMonth)}</p>
      <p className="mt-1 text-center text-xs text-[var(--sec-muted)]">Requesting approval to release the following salaries</p>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Employee</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Designation</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((i, idx) => (
            <tr key={idx}>
              <td className="border border-[var(--sec-line)] px-2 py-2">{i.employeeName}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2">{i.designation}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(i.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td className="border border-[var(--sec-line)] px-2 py-2" colSpan={2}>
              Total
            </td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right">AED {money(total)}</td>
          </tr>
        </tfoot>
      </table>

      {request.notes && (
        <div className="mt-5 text-sm">
          <p className="font-bold">Notes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {request.notes
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p>Requested by:</p>
          <p className="mt-8 border-t border-[var(--sec-line)] pt-1 text-xs text-[var(--sec-muted)]">Accounts</p>
        </div>
        <div>
          <p>Approved by (GM):</p>
          <p className="mt-8 border-t border-[var(--sec-line)] pt-1 text-xs text-[var(--sec-muted)]">Signature &amp; Date</p>
        </div>
      </div>
    </>
  );
}
