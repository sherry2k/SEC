import { requirePermission } from "@/lib/auth";
import InvoiceForm from "@/components/InvoiceForm";
import { defaultInvoiceValues } from "@/lib/invoice-defaults";

export default async function NewInvoicePage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New invoice</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <InvoiceForm mode="create" initial={defaultInvoiceValues()} />
      </div>
    </div>
  );
}
