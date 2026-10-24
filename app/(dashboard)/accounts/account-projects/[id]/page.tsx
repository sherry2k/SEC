import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import { getAccountProjectFinancials } from "@/lib/account-project-finance";
import DeleteAccountProjectButton from "@/components/DeleteAccountProjectButton";
import DeleteQuotationButton from "@/components/DeleteQuotationButton";
import DeleteTaxInvoiceButton from "@/components/DeleteTaxInvoiceButton";
import DeleteInvoiceButton from "@/components/DeleteInvoiceButton";
import DeletePerformaInvoiceButton from "@/components/DeletePerformaInvoiceButton";
import DeleteReceiptVoucherButton from "@/components/DeleteReceiptVoucherButton";

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

const DOC_BADGE: Record<string, string> = {
  quotation: "border-blue-200 bg-blue-50 text-blue-700",
  tax_invoice: "border-violet-200 bg-violet-50 text-violet-700",
  invoice: "border-sky-200 bg-sky-50 text-sky-700",
  performa_invoice: "border-amber-200 bg-amber-50 text-amber-700",
  receipt_voucher: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

// Where each document kind's own view/edit pages and list page live —
// `fin.documents[].kind` is the key. One place to keep this in sync if a
// route ever moves, rather than repeating the path per branch below.
const DOC_ROUTES: Record<string, { base: string }> = {
  quotation: { base: "/accounts/quotations" },
  tax_invoice: { base: "/accounts/tax-invoices" },
  invoice: { base: "/accounts/invoices" },
  performa_invoice: { base: "/accounts/performa-invoices" },
  receipt_voucher: { base: "/accounts/receipt-vouchers" },
};

export default async function AccountProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.view");
  const { id } = await params;

  const [accountProject] = await db.select().from(accountProjects).where(eq(accountProjects.id, id)).limit(1);
  if (!accountProject) notFound();

  const fin = await getAccountProjectFinancials(id);
  const projectHref = `/accounts/account-projects/${id}`;

  // One delete button per document kind — each component hits its own
  // document type's DELETE route, but all redirect back to this project
  // page afterward instead of their own type's full list.
  function renderDelete(kind: string, docId: string) {
    switch (kind) {
      case "quotation":
        return <DeleteQuotationButton quotationId={docId} redirectTo={projectHref} />;
      case "tax_invoice":
        return <DeleteTaxInvoiceButton invoiceId={docId} redirectTo={projectHref} />;
      case "invoice":
        return <DeleteInvoiceButton invoiceId={docId} redirectTo={projectHref} />;
      case "performa_invoice":
        return <DeletePerformaInvoiceButton invoiceId={docId} redirectTo={projectHref} />;
      case "receipt_voucher":
        return <DeleteReceiptVoucherButton voucherId={docId} redirectTo={projectHref} />;
      default:
        return null;
    }
  }

  return (
    <div>
      <Link href="/accounts/account-projects" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
        <ArrowLeft size={14} />
        Back to Account Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sec-ink)]">{accountProject.clientName}</h1>
          {accountProject.location && <p className="mt-1 text-sm text-[var(--sec-muted)]">{accountProject.location}</p>}
          {accountProject.projectDetails && <p className="mt-1 max-w-xl text-sm text-[var(--sec-ink)]">{accountProject.projectDetails}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounts/account-projects/${id}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3.5 py-2 text-sm font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
          >
            Edit project
          </Link>
          <DeleteAccountProjectButton accountProjectId={id} />
        </div>
      </div>

      {/* Financial summary */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total quoted</p>
          <p className="mt-1 text-xl font-bold text-[var(--sec-ink)]">AED {money(fin.totalQuoted)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total invoiced</p>
          <p className="mt-1 text-xl font-bold text-[var(--sec-ink)]">AED {money(fin.invoicedTotal)}</p>
        </div>
        <div className="rounded-lg border border-[var(--sec-line)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Total received</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">AED {money(fin.paidTotal)}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--sec-muted)]">Balance due</p>
          <p className="mt-1 text-xl font-bold text-amber-600">AED {money(fin.balance)}</p>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="mt-8">
        <p className="text-sm font-bold text-[var(--sec-ink)]">Fee Breakdown</p>
        <p className="mt-0.5 text-xs text-[var(--sec-muted)]">
          Pulled from every <em>accepted</em> quotation on this project — not entered manually.
        </p>

        {fin.acceptedQuotations.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-10 text-center">
            <p className="text-sm text-[var(--sec-muted)]">No accepted quotations yet.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {fin.acceptedQuotations.map((q) => (
                <div key={q.id} className="overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
                  <div className="flex items-center justify-between gap-2 bg-[var(--sec-blue)] px-4 py-2.5">
                    <p className="text-sm font-bold text-white">
                      Quotation — {q.label} <span className="font-normal opacity-80">· {q.quotationNo}</span>
                    </p>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">Accepted</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {q.lines.map((line, i) => (
                        <tr key={i} className="border-b border-[var(--sec-line)] last:border-0">
                          <td className="px-4 py-1.5 text-[var(--sec-muted)]">{line.label}</td>
                          <td className="px-4 py-1.5 text-right">{money(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[var(--sec-line)]">
                        <td className="px-4 py-1.5 text-[var(--sec-muted)]">Without VAT</td>
                        <td className="px-4 py-1.5 text-right text-[var(--sec-muted)]">{money(q.totalExclVat)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-1.5 text-[var(--sec-muted)]">VAT</td>
                        <td className="px-4 py-1.5 text-right text-[var(--sec-muted)]">{money(q.vatAmount)}</td>
                      </tr>
                      <tr className="border-t border-[var(--sec-line)] bg-yellow-50 font-bold">
                        <td className="px-4 py-2">Subtotal</td>
                        <td className="px-4 py-2 text-right">{money(q.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))}
            </div>

            {fin.acceptedQuotations.length > 1 && (
              <div className="mt-4 overflow-hidden rounded-lg border border-[var(--sec-blue)] bg-white">
                <table className="w-full text-left text-sm">
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-[var(--sec-muted)]">
                        Combined — Without VAT ({fin.acceptedQuotations.length} accepted quotations)
                      </td>
                      <td className="px-4 py-2 text-right text-[var(--sec-muted)]">{money(fin.totalQuotedExclVat)}</td>
                    </tr>
                    <tr className="border-t border-dashed border-[var(--sec-line)]">
                      <td className="px-4 py-2 text-[var(--sec-muted)]">Combined VAT</td>
                      <td className="px-4 py-2 text-right text-[var(--sec-muted)]">{money(fin.totalQuotedVat)}</td>
                    </tr>
                    <tr className="border-t border-[var(--sec-line)] bg-blue-50 font-bold text-[var(--sec-blue-deep)]">
                      <td className="px-4 py-2.5">Combined Total</td>
                      <td className="px-4 py-2.5 text-right">AED {money(fin.totalQuoted)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick-create actions */}
      <div className="mt-8">
        <p className="text-sm font-bold text-[var(--sec-ink)]">Create a document for this project</p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <Link
            href={`/accounts/quotations/new?accountProjectId=${id}`}
            className="flex items-center gap-2 rounded-md bg-[var(--sec-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--sec-blue-deep)]"
          >
            <Plus size={15} />
            New quotation
          </Link>
          <Link
            href={`/accounts/tax-invoices/new?accountProjectId=${id}`}
            className="flex items-center gap-2 rounded-md border border-[var(--sec-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Plus size={15} />
            New tax invoice
          </Link>
          <Link
            href={`/accounts/invoices/new?accountProjectId=${id}`}
            className="flex items-center gap-2 rounded-md border border-[var(--sec-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Plus size={15} />
            New invoice
          </Link>
          <Link
            href={`/accounts/performa-invoices/new?accountProjectId=${id}`}
            className="flex items-center gap-2 rounded-md border border-[var(--sec-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Plus size={15} />
            New performa invoice
          </Link>
          <Link
            href={`/accounts/receipt-vouchers/new?accountProjectId=${id}`}
            className="flex items-center gap-2 rounded-md border border-[var(--sec-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
          >
            <Plus size={15} />
            New receipt voucher
          </Link>
        </div>
        <p className="mt-2 text-xs text-[var(--sec-muted)]">
          Only &quot;New quotation&quot; is wired to this project so far — the other four still open their existing forms, which don&apos;t accept this
          link yet. We&apos;ll wire those next.
        </p>
      </div>

      {/* Documents */}
      <div className="mt-8">
        <p className="text-sm font-bold text-[var(--sec-ink)]">Documents on this project</p>
        {fin.documents.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-[var(--sec-line)] bg-white py-10 text-center">
            <p className="text-sm text-[var(--sec-muted)]">No documents linked yet.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--sec-line)] bg-white">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--sec-line)] text-xs uppercase tracking-wide text-[var(--sec-muted)]">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">No.</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fin.documents.map((d) => {
                  const routes = DOC_ROUTES[d.kind];
                  const viewHref = routes ? `${routes.base}/${d.id}` : undefined;
                  const editHref = routes ? `${routes.base}/${d.id}/edit` : undefined;
                  return (
                    <tr key={`${d.kind}-${d.id}`} className="border-b border-[var(--sec-line)] last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DOC_BADGE[d.kind]}`}>{d.label}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {viewHref ? (
                          <Link href={viewHref} className="text-[var(--sec-blue)] hover:underline">
                            {d.ref}
                          </Link>
                        ) : (
                          <span className="text-[var(--sec-muted)]">{d.ref}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--sec-muted)]">{d.dateLabel}</td>
                      <td className="px-4 py-3 text-right">AED {money(d.amount)}</td>
                      <td className="px-4 py-3 capitalize text-[var(--sec-muted)]">{d.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {viewHref && (
                            <Link
                              href={viewHref}
                              className="rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
                            >
                              View
                            </Link>
                          )}
                          {editHref && (
                            <Link
                              href={editHref}
                              className="flex items-center gap-1.5 rounded-md border border-[var(--sec-line)] px-3 py-1.5 text-xs font-medium text-[var(--sec-muted)] transition-colors hover:border-[var(--sec-blue)] hover:bg-blue-50 hover:text-[var(--sec-blue)]"
                            >
                              <Pencil size={13} />
                              Edit
                            </Link>
                          )}
                          {renderDelete(d.kind, d.id)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--sec-muted)]">Balance due updates automatically as quotations and receipt vouchers are added.</p>
      </div>
    </div>
  );
}
