import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, FolderOpen, ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { receiptVouchers, receiptVoucherItems, projects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { calcReceiptVoucherTotals } from "@/lib/receipt-voucher-calc";

export default async function ReceiptVouchersListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(receiptVouchers).orderBy(desc(receiptVouchers.createdAt));
  const allItems = await db.select().from(receiptVoucherItems);

  const allProjects = await db.select({ id: projects.id, name: projects.name }).from(projects);
  const projectNameById = new Map(allProjects.map((p) => [p.id, p.name]));

  const itemsByVoucher = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByVoucher.get(item.voucherId) ?? [];
    list.push(item);
    itemsByVoucher.set(item.voucherId, list);
  }

  return (
    <div>
      <Link href="/accounts" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Accounts
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Receipt Vouchers</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "voucher" : "vouchers"}
          </p>
        </div>
        <Link
          href="/accounts/receipt-vouchers/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New voucher
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No receipt vouchers yet.</p>
          <Link href="/accounts/receipt-vouchers/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Project</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const items = itemsByVoucher.get(v.id) ?? [];
                const totals = calcReceiptVoucherTotals(
                  items.map((i) => ({ description: i.description, amount: Number(i.amount) })),
                  Number(v.vatRatePercent)
                );
                const projectName = v.projectId ? projectNameById.get(v.projectId) : null;
                return (
                  <tr key={v.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/receipt-vouchers/${v.id}`} className="font-mono text-xs text-[var(--sec-blue)] hover:underline">
                        {v.voucherNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sec-ink)]">{v.toName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">
                      AED {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)] capitalize">{v.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{v.issueDate}</td>
                    <td className="px-4 py-3">
                      {v.projectId ? (
                        <Link
                          href={`/projects/${v.projectId}`}
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
