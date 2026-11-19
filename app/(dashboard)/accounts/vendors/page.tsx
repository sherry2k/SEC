import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { db } from "@/db";
import { vendors, vendorPayments } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import DeleteVendorButton from "@/components/DeleteVendorButton";

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

// Vendor accounts — "Option B" from the Third-Party Expenses design. Each
// vendor (soil lab, survey company, freelancer, etc.) keeps its own
// running payment history under /accounts/vendors/[id], instead of
// expenses being logged on the Account Project directly.
export default async function VendorsListPage() {
  await requirePermission("accounts.view");

  const rows = await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  const allPayments = await db.select().from(vendorPayments);

  const paymentsByVendor = new Map<string, typeof allPayments>();
  for (const p of allPayments) {
    const list = paymentsByVendor.get(p.vendorId) ?? [];
    list.push(p);
    paymentsByVendor.set(p.vendorId, list);
  }

  return (
    <div>
      <Link href="/accounts" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Accounts
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">Vendors</h1>
          <p className="mt-1 text-sm text-[var(--sec-muted)]">
            {rows.length} {rows.length === 1 ? "vendor" : "vendors"} — soil labs, survey companies, freelance work, and other third parties.
          </p>
        </div>
        <Link
          href="/accounts/vendors/new"
          className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
        >
          <Plus size={16} />
          New vendor
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-16 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No vendors yet.</p>
          <Link href="/accounts/vendors/new" className="mt-3 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
            Add the first one
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Paid (all time)</th>
                <th className="px-4 py-3 font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const payments = paymentsByVendor.get(v.id) ?? [];
                const paidTotal = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
                const pendingTotal = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <tr key={v.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/vendors/${v.id}`} className="font-semibold text-[var(--sec-ink)] hover:underline">
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--sec-muted)]">{v.category || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-ink)]">AED {money(paidTotal)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-amber-600">{pendingTotal > 0 ? `AED ${money(pendingTotal)}` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/accounts/vendors/${v.id}/edit`}
                          className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
                        >
                          <Pencil size={13} />
                          Edit
                        </Link>
                        <DeleteVendorButton vendorId={v.id} />
                      </div>
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
