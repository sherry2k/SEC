import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import QuotationForm from "@/components/QuotationForm";
import QuotationCategoryForm from "@/components/QuotationCategoryForm";
import { defaultQuotationValues, categoryQuotationValues } from "@/lib/quotation-defaults";
import { getProjectOptions } from "@/lib/project-options";
import { QUOTATION_CATEGORIES, QUOTATION_CATEGORY_LABELS, getAvailableQuotationTemplateCategories, getQuotationCategoryTemplate, type QuotationCategory } from "@/lib/quotation-category";

export default async function NewQuotationPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requirePermission("accounts.edit");

  const { category } = await searchParams;
  const projectOptions = await getProjectOptions();

  // No category chosen yet — show the picker.
  if (!category) {
    const available = await getAvailableQuotationTemplateCategories();
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New quotation</h1>
        <p className="mt-1 text-sm text-[var(--sec-muted)]">Pick a category to start from its standard template, or create a blank quotation.</p>

        <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {QUOTATION_CATEGORIES.map((c) => {
            const isAvailable = available.includes(c);
            return isAvailable ? (
              <Link
                key={c}
                href={`/accounts/quotations/new?category=${c}`}
                className="flex items-center justify-between rounded-lg border border-[var(--sec-line)] bg-white px-4 py-3.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
              >
                {QUOTATION_CATEGORY_LABELS[c]}
                <ArrowRight size={16} className="text-[var(--sec-muted)]" />
              </Link>
            ) : (
              <div
                key={c}
                className="flex items-center justify-between rounded-lg border border-dashed border-[var(--sec-line)] bg-slate-50 px-4 py-3.5 text-sm font-medium text-[var(--sec-muted)]"
              >
                {QUOTATION_CATEGORY_LABELS[c]}
                <span className="text-xs">Template not set up yet</span>
              </div>
            );
          })}
        </div>

        <Link
          href="/accounts/quotations/new?category=blank"
          className="mt-4 flex max-w-2xl items-center justify-between rounded-lg border border-[var(--sec-line)] bg-white px-4 py-3.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
        >
          <span className="flex items-center gap-2">
            <FileText size={16} className="text-[var(--sec-muted)]" />
            Blank / Custom quotation
          </span>
          <ArrowRight size={16} className="text-[var(--sec-muted)]" />
        </Link>
      </div>
    );
  }

  // Blank/custom — the original flat pricing schedule form.
  if (category === "blank") {
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

  // A real category — load its template.
  if (!QUOTATION_CATEGORIES.includes(category as QuotationCategory)) {
    return (
      <div>
        <p className="text-sm text-[var(--sec-muted)]">Unknown category.</p>
        <Link href="/accounts/quotations/new" className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← Back to category picker
        </Link>
      </div>
    );
  }

  const template = await getQuotationCategoryTemplate(category as QuotationCategory);
  if (!template) {
    return (
      <div>
        <p className="text-sm text-[var(--sec-muted)]">This category's template isn't set up yet.</p>
        <Link href="/accounts/quotations/new" className="mt-2 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← Back to category picker
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-xs text-[var(--sec-muted)]">{QUOTATION_CATEGORY_LABELS[template.category]}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">New quotation</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-4xl">
        <QuotationCategoryForm mode="create" initial={categoryQuotationValues(template)} projectOptions={projectOptions} />
      </div>
    </div>
  );
}
