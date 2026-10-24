import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import InvoiceForm from "@/components/InvoiceForm";
import { defaultInvoiceValues } from "@/lib/invoice-defaults";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ accountProjectId?: string }> }) {
  await requirePermission("accounts.edit");
  const { accountProjectId } = await searchParams;

  let accountProject: { id: string; clientName: string; location: string | null } | null = null;
  if (accountProjectId) {
    const [row] = await db
      .select({ id: accountProjects.id, clientName: accountProjects.clientName, location: accountProjects.location })
      .from(accountProjects)
      .where(eq(accountProjects.id, accountProjectId))
      .limit(1);
    if (!row) notFound();
    accountProject = row;
  }

  const initial = defaultInvoiceValues();
  if (accountProject) {
    initial.accountProjectId = accountProject.id;
    initial.customerName = accountProject.clientName;
  }

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
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New invoice</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <InvoiceForm mode="create" initial={initial} />
      </div>
    </div>
  );
}