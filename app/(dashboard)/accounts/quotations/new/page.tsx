import { requirePermission } from "@/lib/auth";
import QuotationForm from "@/components/QuotationForm";
import { defaultQuotationValues } from "@/lib/quotation-defaults";
import { getProjectOptions } from "@/lib/project-options";

export default async function NewQuotationPage() {
  await requirePermission("accounts.edit");
  const projectOptions = await getProjectOptions();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New quotation</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">
        Numbered automatically once saved. Payment terms and commercial conditions are pre-filled — edit freely.
      </p>
      <div className="mt-8 max-w-4xl">
        <QuotationForm mode="create" initial={defaultQuotationValues()} projectOptions={projectOptions} />
      </div>
    </div>
  );
}
