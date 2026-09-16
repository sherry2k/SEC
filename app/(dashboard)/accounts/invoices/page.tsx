import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { invoices, invoiceItems } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcInvoiceTotals } from "@/lib/invoice-calc";

export default async function InvoicesListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  const allItems = await db.select().from(invoiceItems);

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
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Invoices</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>
        <Link
          href="/accounts/invoices/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No invoices yet.</p>
          <Link href="/accounts/invoices/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Ref. No.</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const items = itemsByInvoice.get(inv.id) ?? [];
                const totals = calcInvoiceTotals(
                  items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
                  Number(inv.vatRatePercent)
                );
                return (
                  <tr key={inv.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/invoices/${inv.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{inv.customerName}</td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{inv.project || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
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
