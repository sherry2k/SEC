import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import PerformaInvoiceForm from "@/components/PerformaInvoiceForm";
import { defaultPerformaInvoiceValues } from "@/lib/performa-invoice-defaults";

export default async function NewPerformaInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ accountProjectId?: string }>;
}) {
  await requirePermission("accounts.edit");
  const { accountProjectId } = await searchParams;

  const initial = defaultPerformaInvoiceValues();

  if (accountProjectId) {
    initial.accountProjectId = accountProjectId;

    // Pre-fill from the Account Project this invoice is being created
    // under — the client/location/project details are already on record
    // there, so there's no reason to retype them.
    const [accountProject] = await db
      .select({ clientName: accountProjects.clientName, location: accountProjects.location, projectDetails: accountProjects.projectDetails })
      .from(accountProjects)
      .where(eq(accountProjects.id, accountProjectId))
      .limit(1);

    if (accountProject) {
      initial.customerName = accountProject.clientName;
      if (accountProject.projectDetails) initial.project = accountProject.projectDetails;
      if (accountProject.location) initial.customerAddress = accountProject.location;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New performa invoice</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <PerformaInvoiceForm mode="create" initial={initial} />
      </div>
    </div>
  );
}
