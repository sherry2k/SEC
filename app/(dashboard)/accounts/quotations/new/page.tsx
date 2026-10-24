import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, FileText, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { accountProjects } from "@/db/schema";
import { requirePermission } from "@/lib/auth";
import QuotationForm from "@/components/QuotationForm";
import QuotationCategoryForm from "@/components/QuotationCategoryForm";
import { defaultQuotationValues, categoryQuotationValues } from "@/lib/quotation-defaults";
import { QUOTATION_CATEGORIES, QUOTATION_CATEGORY_LABELS, getAvailableQuotationTemplateCategories, getQuotationCategoryTemplate, type QuotationCategory } from "@/lib/quotation-category";

// Picker-only label suffixes — a clarifying note shown just on this
// category-picker screen, not on the printed quotation, the Fee Breakdown
// badge, or anywhere QUOTATION_CATEGORY_LABELS is used elsewhere. Keyed by
// the label text itself so this doesn't need to know the category's
// internal slug.
const PICKER_LABEL_SUFFIX: Record<string, string> = {
  Permit: " (Modifications)",
  "Work Permit": " (ADCD)",
};

function pickerLabel(category: QuotationCategory): string {
  const label = QUOTATION_CATEGORY_LABELS[category];
  return `${label}${PICKER_LABEL_SUFFIX[label] ?? ""}`;
}

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; accountProjectId?: string }>;
}) {
  await requirePermission("accounts.edit");

  const { category, accountProjectId } = await searchParams;

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

  const projectBanner = accountProject ? (
    <div className="mb-4 rounded-md border border-[var(--sec-blue)]/25 bg-[var(--sec-blue)]/[0.06] px-3.5 py-2.5 text-sm">
      <span className="font-semibold text-[var(--sec-blue)]">{accountProject.clientName}</span>
      {accountProject.location && <span className="text-[var(--sec-muted)]"> · {accountProject.location}</span>}
    </div>
  ) : null;

  const backHref = accountProject ? `/accounts/account-projects/${accountProject.id}` : "/accounts/quotations";

  // No category chosen yet — show the picker.
  if (!category) {
    const available = await getAvailableQuotationTemplateCategories();
    const qs = accountProjectId ? `&accountProjectId=${accountProjectId}` : "";
    return (
      <div>
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          <ArrowLeft size={14} />
          {accountProject ? "Back to project" : "Back to Quotations"}
        </Link>
        {projectBanner}
        <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New quotation</h1>
        <p className="mt-1 text-sm text-[var(--sec-muted)]">Pick a category to start from its standard template, or create a blank quotation.</p>

        <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {QUOTATION_CATEGORIES.map((c) => {
            const isAvailable = available.includes(c);
            return isAvailable ? (
              <Link
                key={c}
                href={`/accounts/quotations/new?category=${c}${qs}`}
                className="flex items-center justify-between rounded-lg border border-[var(--sec-line)] bg-white px-4 py-3.5 text-sm font-semibold text-[var(--sec-ink)] transition-colors hover:border-[var(--sec-blue)]"
              >
                {pickerLabel(c)}
                <ArrowRight size={16} className="text-[var(--sec-muted)]" />
              </Link>
            ) : (
              <div
                key={c}
                className="flex items-center justify-between rounded-lg border border-dashed border-[var(--sec-line)] bg-slate-50 px-4 py-3.5 text-sm font-medium text-[var(--sec-muted)]"
              >
                {pickerLabel(c)}
                <span className="text-xs">Template not set up yet</span>
              </div>
            );
          })}
        </div>

        <Link
          href={`/accounts/quotations/new?category=blank${qs}`}
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
    const initial = defaultQuotationValues();
    if (accountProject) {
      initial.accountProjectId = accountProject.id;
      initial.clientName = accountProject.clientName;
      initial.location = accountProject.location || initial.location;
    }
    return (
      <div>
        <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← Back
        </Link>
        {projectBanner}
        <h1 className="text-2xl font-bold text-[var(--sec-ink)]">New quotation</h1>
        <p className="mt-1 text-sm text-[var(--sec-muted)]">
          Numbered automatically once saved. Payment terms and commercial conditions are pre-filled — edit freely.
        </p>
        <div className="mt-8 max-w-4xl">
          <QuotationForm mode="create" initial={initial} />
        </div>
      </div>
    );
  }

  // A real category — load its template.
  if (!QUOTATION_CATEGORIES.includes(category as QuotationCategory)) {
    return (
      <div>
        <p className="text-sm text-[var(--sec-muted)]">Unknown category.</p>
        <Link href={backHref} className="text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  const template = await getQuotationCategoryTemplate(category as QuotationCategory);
  if (!template) {
    return (
      <div>
        <p className="text-sm text-[var(--sec-muted)]">This category's template isn't set up yet.</p>
        <Link href={backHref} className="mt-2 inline-block text-sm font-medium text-[var(--sec-blue)] hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  const initial = categoryQuotationValues(template);
  if (accountProject) {
    initial.accountProjectId = accountProject.id;
    initial.clientName = accountProject.clientName;
    initial.location = accountProject.location || initial.location;
  }

  return (
    <div>
      <Link
        href={accountProject ? `/accounts/quotations/new?accountProjectId=${accountProject.id}` : "/accounts/quotations/new"}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--sec-blue)] hover:underline"
      >
        ← Back to category picker
      </Link>
      {projectBanner}
      <p className="font-mono text-xs text-[var(--sec-muted)]">{QUOTATION_CATEGORY_LABELS[template.category]}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--sec-ink)]">New quotation</h1>
      <p className="mt-1 text-sm text-[var(--sec-muted)]">Numbered automatically once saved.</p>
      <div className="mt-8 max-w-4xl">
        <QuotationCategoryForm mode="create" initial={initial} />
      </div>
    </div>
  );
}
