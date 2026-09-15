import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { taxInvoices, taxInvoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcTaxInvoiceTotals } from "@/lib/tax-invoice-calc";

export default async function TaxInvoicesListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(taxInvoices).orderBy(desc(taxInvoices.createdAt));
  const allItems = await db.select().from(taxInvoiceItems);

  const itemsByInvoice = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByInvoice.get(item.invoiceId) ?? [];
    list.push(item);
    itemsByInvoice.set(item.invoiceId, list);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Tax Invoices</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>
        <Link
          href="/accounts/tax-invoices/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No tax invoices yet.</p>
          <Link href="/accounts/tax-invoices/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Client TRN</th>
                <th className="px-4 py-3 font-medium">Invoice Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const items = itemsByInvoice.get(inv.id) ?? [];
                const totals = calcTaxInvoiceTotals(
                  items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
                  Number(inv.vatRatePercent)
                );
                return (
                  <tr key={inv.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/tax-invoices/${inv.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{inv.clientName}</td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{inv.clientTrn || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)] capitalize">{inv.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{inv.issueDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
