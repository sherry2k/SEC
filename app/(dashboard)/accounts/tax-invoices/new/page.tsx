import { requirePermission } from "@/lib/auth";
import TaxInvoiceForm from "@/components/TaxInvoiceForm";
import { defaultTaxInvoiceValues } from "@/lib/tax-invoice-defaults";

export default async function NewTaxInvoicePage() {
  await requirePermission("accounts.edit");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New tax invoice</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-3xl">
        <TaxInvoiceForm mode="create" initial={defaultTaxInvoiceValues()} />
      </div>
    </div>
  );
}
