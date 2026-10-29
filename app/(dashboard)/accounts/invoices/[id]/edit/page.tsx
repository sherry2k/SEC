import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceItems, accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import InvoiceForm from "@/components/InvoiceForm";
import type { InvoiceFormValues, InvoiceItemDraft } from "@/lib/invoice-defaults";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("accounts.edit");

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder));

  let accountProject: { id: string; clientName: string; location: string | null } | null = null;
  if (invoice.accountProjectId) {
    const [row] = await db
      .select({ id: accountProjects.id, clientName: accountProjects.clientName, location: accountProjects.location })
      .from(accountProjects)
      .where(eq(accountProjects.id, invoice.accountProjectId))
      .limit(1);
    accountProject = row ?? null;
  }

  const initial: InvoiceFormValues = {
    accountProjectId: invoice.accountProjectId ?? "",
    issueDate: invoice.issueDate,
    customerName: invoice.customerName ?? "",
    project: invoice.project ?? "",
    customerAddress: invoice.customerAddress ?? "",
    vatRatePercent: Number(invoice.vatRatePercent),
    signatoryName: invoice.signatoryName ?? "",
    showStamp: invoice.showStamp,
    notes: invoice.notes ?? "",
    items: items.map(
      (i): InvoiceItemDraft => ({
        key: i.id,
        itemDate: i.itemDate ?? "",
        description: i.description,
        amount: i.amount,
      })
    ),
  };

  return (
    <div>
      {accountProject && (
        <Link
          href={`/accounts/account-projects/${accountProject.id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
        >
          <ArrowLeft size={14} />
          Back to project
        </Link>
      )}
      {accountProject && (
        <div className="mb-4 rounded-md border border-[var(--sec-blue)]/25 bg-[var(--sec-blue)]/[0.06] px-3.5 py-2.5 text-sm">
          <span className="font-semibold text-[var(--sec-blue)]">{accountProject.clientName}</span>
          {accountProject.location && <span className="text-[var(--sec-muted)]"> · {accountProject.location}</span>}
        </div>
      )}
      <p className="font-mono text-xs text-[var(--sec-muted)]">{invoice.invoiceNo}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">Edit invoice</h1>
      <div className="mt-8 max-w-3xl">
        <InvoiceForm mode="edit" invoiceId={invoice.id} initial={initial} />
      </div>
    </div>
  );
}