import { requirePermission } from "@/lib/auth";
import PerformaInvoiceForm from "@/components/PerformaInvoiceForm";
import { defaultPerformaInvoiceValues } from "@/lib/performa-invoice-defaults";

export default async function NewPerformaInvoicePage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New performa invoice</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <PerformaInvoiceForm mode="create" initial={defaultPerformaInvoiceValues()} />
      </div>
    </div>
  );
}
