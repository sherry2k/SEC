import PrintDocumentShell from "@/components/PrintDocumentShell";
import type { LedgerEntry } from "@/lib/project-finance";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export type StatementOfAccountData = {
  projectRef: string;
  printedDate: string;
  clientName: string;
  clientAddress: string;
  totalAmount: number;
  invoicedTotal: number;
  paidTotal: number;
  balance: number;
  ledger: LedgerEntry[];
  showStamp: boolean;
};

export default function StatementOfAccountPrintView({ data }: { data: StatementOfAccountData }) {
  // Running balance walked chronologically — a charge adds to what's owed,
  // a payment reduces it. Remarks on a charge row reflect whether the
  // account had fully caught up again by that point in the sequence, not
  // a strict per-invoice reconciliation (payments aren't matched to one
  // specific invoice) — simple and honest for how these are actually used.
  let running = 0;
  const rows = data.ledger.map((entry) => {
    if (entry.kind === "charge") running += entry.amount;
    else running -= entry.amount;
    return { entry, runningBalance: running };
  });
  const balanceDue = rows.length > 0 ? rows[rows.length - 1].runningBalance : 0;

  return (
    <PrintDocumentShell dateLabel="Date" dateValue={data.printedDate} refLabel="Ref." refValue={data.projectRef}>
      <h1 className="mt-6 text-center text-lg font-bold uppercase underline">Statement of Account</h1>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-6 text-sm">
        <div>
          <p className="font-semibold">To:</p>
          <p>{data.clientName || "-"}</p>
          {data.clientAddress && <p>Address: {data.clientAddress}</p>}
        </div>
        <table className="border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 font-semibold">Total Amount</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(data.totalAmount)}</td>
            </tr>
            <tr>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 font-semibold">Invoice Amount</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(data.invoicedTotal)}</td>
            </tr>
            <tr>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 font-semibold">Amount Paid</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right">AED {money(data.paidTotal)}</td>
            </tr>
            <tr>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 font-bold">Remaining Balance</td>
              <td className="border border-[var(--sec-line)] px-3 py-1.5 text-right font-bold">AED {money(data.balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--sec-blue-deep)] text-white">
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Date</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Transaction</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Details</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Amount</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Payments</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-right">Balance</th>
            <th className="border border-[var(--sec-blue-deep)] px-2 py-2 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{data.ledger[0]?.dateLabel ?? ""}</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 align-top italic" colSpan={4}>
              ***Opening Balance***
            </td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED 0.00</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 align-top" />
          </tr>
          {rows.map(({ entry, runningBalance }) => (
            <tr key={entry.id}>
              <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{entry.dateLabel}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{entry.docLabel}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 align-top">{entry.description}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">
                {entry.kind === "charge" ? `AED ${money(entry.amount)}` : ""}
              </td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">
                {entry.kind === "payment" ? `AED ${money(entry.amount)}` : ""}
              </td>
              <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(runningBalance)}</td>
              <td className="border border-[var(--sec-line)] px-2 py-2 align-top">
                {entry.kind === "charge" && (
                  <span className={runningBalance > 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                    {runningBalance > 0 ? "NOT PAID" : "PAID"}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {data.ledger.length === 0 && (
            <tr>
              <td className="border border-[var(--sec-line)] px-2 py-6 text-center text-[var(--sec-muted)]" colSpan={7}>
                No transactions linked to this project yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-4 text-right text-sm font-bold text-[var(--sec-ink)]">Balance Due: AED {money(balanceDue)}</p>

      {data.showStamp && <img src="/images/stamp.png" alt="Company stamp" className="mt-6 h-28 object-contain" />}
    </PrintDocumentShell>
  );
}
