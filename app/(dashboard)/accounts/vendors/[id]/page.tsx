import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { ArrowLeft, Plus, Pencil, FolderOpen } from "lucide-react";
import { db } from "@/db";
import { vendors, vendorPayments, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import DeleteVendorButton from "@/components/DeleteVendorButton";
import DeleteVendorPaymentButton from "@/components/DeleteVendorPaymentButton";
import VendorPaymentStatusControl from "@/components/VendorPaymentStatusControl";

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("accounts.view");
  const canEdit = can(user.role, "accounts.edit");
  const { id } = await params;

  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) notFound();

  const payments = await db.select().from(vendorPayments).where(eq(vendorPayments.vendorId, id)).orderBy(desc(vendorPayments.createdAt));

  const linkedProjectIds = [...new Set(payments.map((p) => p.accountProjectId).filter((x): x is string => !!x))];
  const projectNameById = new Map<string, string>();
  if (linkedProjectIds.length > 0) {
    const allProjects = await db.select({ id: accountProjects.id, clientName: accountProjects.clientName }).from(accountProjects);
    for (const p of allProjects) projectNameById.set(p.id, p.clientName);
  }

  const paidTotal = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const pendingTotal = payments.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <Link href="/accounts/vendors" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Vendors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">{vendor.name}</h1>
          {vendor.category && <p className="mt-1 text-sm text-[var(--sec-muted)]">{vendor.category}</p>}
          {vendor.contactInfo && <p className="mt-1 text-sm text-[var(--sec-ink)]">{vendor.contactInfo}</p>}
          {vendor.notes && <p className="mt-1 max-w-xl text-sm text-[var(--sec-muted)]">{vendor.notes}</p>}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Link
              href={`/accounts/vendors/${id}/edit`}
              className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3.5 py-2 text-sm font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
            >
              Edit vendor
            </Link>
            <DeleteVendorButton vendorId={id} />
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">AED {money(paidTotal)}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Pending</p>
          <p className="mt-1 text-xl font-bold text-amber-600">AED {money(pendingTotal)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Payments</p>
          <p className="mt-1 text-xl font-bold text-[var(--sec-ink)]">{payments.length}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-[var(--sec-ink)]">Payment history</p>
        {canEdit && (
          <Link
            href={`/accounts/vendors/${id}/payments/new`}
            className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Plus size={16} />
            New payment
          </Link>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-10 text-center">
          <p className="text-sm text-[var(--sec-muted)]">No payments logged yet.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const projectName = p.accountProjectId ? projectNameById.get(p.accountProjectId) : null;
                return (
                  <tr key={p.id} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--sec-muted)]">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-[var(--sec-ink)]">{p.description || "—"}</td>
                    <td className="px-4 py-3">
                      {p.accountProjectId ? (
                        <Link
                          href={`/accounts/account-projects/${p.accountProjectId}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--sec-line)] px-2.5 py-1 text-xs font-medium text-[var(--sec-ink)] hover:border-[var(--sec-blue)]"
                        >
                          <FolderOpen size={12} />
                          {projectName || "View"}
                        </Link>
                      ) : (
                        <span className="text-xs text-[var(--sec-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[var(--sec-ink)]">AED {money(Number(p.amount))}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <VendorPaymentStatusControl paymentId={p.id} status={p.status} />
                      ) : (
                        <span className="capitalize text-[var(--sec-muted)]">{p.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/accounts/vendors/${id}/payments/${p.id}/edit`}
                            className="rounded p-1.5 text-[var(--sec-muted)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
                            aria-label="Edit payment"
                          >
                            <Pencil size={13} />
                          </Link>
                          <DeleteVendorPaymentButton paymentId={p.id} />
                        </div>
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
