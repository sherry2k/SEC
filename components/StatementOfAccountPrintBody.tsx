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

export default function StatementOfAccountPrintBody({ data }: { data: StatementOfAccountData }) {
  // Running balance walked chronologically. Starts at the Total Amount —
  // the agreed contract/quoted value — rather than 0: a Tax Invoice or
  // Invoice is paperwork billing a portion of that already-fixed total,
  // not a new charge on top of it, so it's listed here for the record but
  // doesn't move the balance. Only a payment (Receipt Voucher) reduces
  // what's still owed. This keeps the ledger's own Balance Due in step
  // with the Remaining Balance shown in the summary box above — before
  // this, a fully-invoiced-and-paid portion could read "Balance Due: AED
  // 0.00" here while the summary box still correctly showed what's left
  // on the uninvoiced remainder of the quote.
  let running = data.totalAmount;
  const rows = data.ledger.map((entry) => {
    if (entry.kind === "payment") running -= entry.amount;
    return { entry, runningBalance: running };
  });
  const balanceDue = rows.length > 0 ? rows[rows.length - 1].runningBalance : data.totalAmount;

  // Remarks are a separate pass from the running balance above, and a
  // charge's status is now resolved in two stages:
  //   1. Direct coverage — a Receipt Voucher explicitly linked (via the
  //      "Linked invoice" field on the voucher) to this exact charge
  //      counts toward it first, however much of it there is.
  //   2. Whatever the charge still needs beyond that falls back to the
  //      old FIFO pool of every UNLINKED payment, consumed in
  //      chronological ledger order — same reasoning as before: the
  //      earliest charge absorbs leftover, undirected money first.
  // A charge is PAID once direct + pool coverage meets its full amount,
  // PARTIALLY PAID once some but not all of it is covered, and NOT PAID
  // otherwise.
  type ChargeStatus = "paid" | "partial" | "unpaid";
  const EPSILON = 0.01;

  const directPaidByCharge = new Map<string, number>();
  for (const entry of data.ledger) {
    if (entry.kind === "payment" && entry.linkedChargeId) {
      directPaidByCharge.set(entry.linkedChargeId, (directPaidByCharge.get(entry.linkedChargeId) ?? 0) + entry.amount);
    }
  }

  let unlinkedPool = data.ledger
    .filter((e) => e.kind === "payment" && !e.linkedChargeId)
    .reduce((sum, e) => sum + e.amount, 0);

  const chargeStatus = new Map<string, ChargeStatus>();
  for (const entry of data.ledger) {
    if (entry.kind !== "charge") continue;
    const direct = Math.min(directPaidByCharge.get(entry.id) ?? 0, entry.amount);
    const remaining = entry.amount - direct;
    const fromPool = Math.min(unlinkedPool, remaining);
    unlinkedPool -= fromPool;
    const covered = direct + fromPool;
    chargeStatus.set(entry.id, covered >= entry.amount - EPSILON ? "paid" : covered > EPSILON ? "partial" : "unpaid");
  }

  return (
    <>
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
              ***Opening Balance*** — Total Amount per approved quotation
            </td>
            <td className="border border-[var(--sec-line)] px-2 py-2 text-right align-top">AED {money(data.totalAmount)}</td>
            <td className="border border-[var(--sec-line)] px-2 py-2 align-top" />
          </tr>
          {rows.map(({ entry, runningBalance }) => {
            const status = chargeStatus.get(entry.id);
            return (
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
                    <span
                      className={
                        status === "paid"
                          ? "font-semibold text-emerald-600"
                          : status === "partial"
                            ? "font-semibold text-amber-600"
                            : "font-semibold text-red-600"
                      }
                    >
                      {status === "paid" ? "PAID" : status === "partial" ? "PARTIALLY PAID" : "NOT PAID"}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
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
    </>
  );
}
