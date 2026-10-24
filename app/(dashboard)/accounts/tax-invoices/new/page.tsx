import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import TaxInvoiceForm from "@/components/TaxInvoiceForm";
import { defaultTaxInvoiceValues, type TaxInvoiceFormValues } from "@/lib/tax-invoice-defaults";

export default async function NewTaxInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ accountProjectId?: string }>;
}) {
  await requirePermission("accounts.edit");

  const { accountProjectId } = await searchParams;
  const initial: TaxInvoiceFormValues = defaultTaxInvoiceValues();

  if (accountProjectId) {
    initial.accountProjectId = accountProjectId;

    const [accountProject] = await db
      .select({
        clientName: accountProjects.clientName,
        location: accountProjects.location,
      })
      .from(accountProjects)
      .where(eq(accountProjects.id, accountProjectId))
      .limit(1);

    if (accountProject) {
      initial.clientName = accountProject.clientName;
      if (accountProject.location) initial.clientAddress = accountProject.location;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New tax invoice</h1>
      <div className="mt-8 max-w-3xl">
        <TaxInvoiceForm mode="create" initial={initial} />
      </div>
    </div>
  );
}
