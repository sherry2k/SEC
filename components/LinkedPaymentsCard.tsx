import type { LinkedPayment } from "@/lib/invoice-link-options";

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

const STATUS_BADGE: Record<string, string> = {
  received: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
};

// "Payments received against this invoice" — every Receipt Voucher
// explicitly linked to this Tax Invoice/Invoice via its "Linked invoice"
// field, shown on the invoice's own page so it's obvious at a glance how
// much of it has actually been collected. Screen-only (no-print), same
// as the Edit/Delete/Download action row above it on these pages.
export default function LinkedPaymentsCard({ payments, invoiceTotal }: { payments: LinkedPayment[]; invoiceTotal: number }) {
  if (payments.length === 0) return null;

  const receivedTotal = payments.filter((p) => p.status === "received").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="no-print mt-6 rounded-lg border border-[var(--sec-line)] bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-[var(--sec-ink)]">Payments received against this invoice</p>
        <p className="text-sm text-[var(--sec-muted)]">
          AED {money(receivedTotal)} of {money(invoiceTotal)}
        </p>
      </div>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
            <th className="py-2 font-medium">Receipt voucher</th>
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 text-right font-medium">Amount</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.voucherId} className="border-b border-[var(--sec-line)] last:border-0">
              <td className="py-2 font-mono text-xs text-[var(--sec-ink)]">{p.voucherNo}</td>
              <td className="py-2 text-[var(--sec-muted)]">{p.dateLabel}</td>
              <td className="py-2 text-right">AED {money(p.amount)}</td>
              <td className="py-2">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[p.status] ?? STATUS_BADGE.draft}`}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
