import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, FolderOpen } from "lucide-react";
import { db } from "@/db";
import { performaInvoices, performaInvoiceItems, projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcPerformaInvoiceTotals } from "@/lib/performa-invoice-calc";

export default async function PerformaInvoicesListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(performaInvoices).orderBy(desc(performaInvoices.createdAt));
  const allItems = await db.select().from(performaInvoiceItems);

  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects);
  const projectNameById = new Map(allProjects.map((p) => [p.id, p.name]));

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
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Performa Invoices</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "invoice" : "invoices"}
          </p>
        </div>
        <Link
          href="/accounts/performa-invoices/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New invoice
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No performa invoices yet.</p>
          <Link href="/accounts/performa-invoices/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Invoice Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Project</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const items = itemsByInvoice.get(inv.id) ?? [];
                const totals = calcPerformaInvoiceTotals(
                  items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
                  Number(inv.vatRatePercent)
                );
                const projectName = inv.projectId ? projectNameById.get(inv.projectId) : null;
                return (
                  <tr key={inv.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/performa-invoices/${inv.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{inv.customerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)] capitalize">{inv.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{inv.issueDate}</td>
                    <td className="px-4 py-3">
                      {inv.projectId ? (
                        <Link
                          href={`/projects/${inv.projectId}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
                        >
                          <FolderOpen size={12} />
                          {projectName || "View"}
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--sec-muted)]">—</span>
                      )}
                    </td>
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
