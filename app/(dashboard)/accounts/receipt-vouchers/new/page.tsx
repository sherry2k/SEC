import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import ReceiptVoucherForm from "@/components/ReceiptVoucherForm";
import { defaultReceiptVoucherValues } from "@/lib/receipt-voucher-defaults";
import BackButton from "@/components/BackButton";

export default async function NewReceiptVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ accountProjectId?: string }>;
}) {
  await requirePermission("accounts.edit");
  const { accountProjectId } = await searchParams;

  const initial = defaultReceiptVoucherValues();

  if (accountProjectId) {
    initial.accountProjectId = accountProjectId;

    // Pre-fill from the Account Project this voucher is being created
    // under — the recipient/location/project details are already on
    // record there, so there's no reason to retype them.
    const [accountProject] = await db
      .select({ clientName: accountProjects.clientName, location: accountProjects.location, projectDetails: accountProjects.projectDetails })
      .from(accountProjects)
      .where(eq(accountProjects.id, accountProjectId))
      .limit(1);

    if (accountProject) {
      initial.toName = accountProject.clientName;
      if (accountProject.projectDetails) initial.project = accountProject.projectDetails;
      if (accountProject.location) initial.location = accountProject.location;
    }
  }

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New receipt voucher</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <ReceiptVoucherForm mode="create" initial={initial} />
      </div>
    </div>
  );
}
